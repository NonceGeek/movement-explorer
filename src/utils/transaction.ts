import { Types } from "aptos";
import { standardizeAddress, tryStandardizeAddress } from "./index";

export const TransactionTypeName = {
  User: "user_transaction",
  Genesis: "genesis_transaction",
  BlockMetadata: "block_metadata_transaction",
  StateCheckpoint: "state_checkpoint_transaction",
  Validator: "validator_transaction",
  BlockEpilogue: "block_epilogue_transaction",
} as const;

export type TransactionCounterparty = {
  address: string;
  role: "receiver" | "smartContract";
};

// Format timestamp for display
export function formatTimestamp(timestamp: string): string {
  const date = new Date(parseInt(timestamp) / 1000);
  return date.toLocaleString();
}

// Get transaction type name formatted for display
export function getTransactionTypeName(tx: Types.Transaction): string {
  return tx.type
    .replace(/_/g, " ")
    .replace(/transaction$/, "")
    .trim();
}

// Get sender address from transaction
export function getTransactionSender(tx: Types.Transaction): string | null {
  if (tx.type === "user_transaction" && "sender" in tx) {
    return (tx as Types.UserTransaction).sender;
  }
  if (tx.type === "block_metadata_transaction" && "proposer" in tx) {
    return (tx as Types.BlockMetadataTransaction).proposer;
  }
  return null;
}

// when the transaction counterparty is a "receiver",
//    the transaction is a user transfer (account A send money to account B)
// when the transaction counterparty is a "smartContract",
//    the transaction is a user interaction (account A interact with smart contract account B)
export function getTransactionCounterparty(
  transaction: Types.Transaction
): TransactionCounterparty | undefined {
  if (transaction.type !== TransactionTypeName.User) {
    return undefined;
  }

  if (!("payload" in transaction)) {
    return undefined;
  }

  let payload: Types.TransactionPayload_EntryFunctionPayload;
  if (transaction.payload.type === "entry_function_payload") {
    payload =
      transaction.payload as Types.TransactionPayload_EntryFunctionPayload;
  } else if (
    transaction.payload.type === "multisig_payload" &&
    "transaction_payload" in transaction.payload &&
    transaction.payload.transaction_payload &&
    "type" in transaction.payload.transaction_payload &&
    transaction.payload.transaction_payload.type === "entry_function_payload"
  ) {
    payload = transaction.payload
      .transaction_payload as Types.TransactionPayload_EntryFunctionPayload;
  } else {
    return undefined;
  }

  // there are two scenarios that this transaction is an MOVE coin transfer:
  // 1. coins are transferred from account1 to account2:
  //    payload function is "0x1::coin::transfer" or "0x1::aptos_account::transfer_coins" and the first item in type_arguments is "0x1::aptos_coin::AptosCoin"
  // 2. coins are transferred from account1 to account2, and account2 is created upon transaction:
  //    payload function is "0x1::aptos_account::transfer" or "0x1::aptos_account::transfer_coins"
  // In both scenarios, the first item in arguments is the receiver's address, and the second item is the amount.

  const isCoinTransfer =
    payload.function === "0x1::coin::transfer" ||
    payload.function === "0x1::aptos_account::transfer_coins" ||
    payload.function === "0x1::aptos_account::transfer" ||
    payload.function === "0x1::aptos_account::fungible_transfer_only";
  const isPrimaryFaTransfer =
    payload.function === "0x1::primary_fungible_store::transfer";

  const isObjectTransfer = payload.function === "0x1::object::transfer";
  const isTokenV2MintSoulbound =
    payload.function === "0x4::aptos_token::mint_soul_bound";

  if (isCoinTransfer) {
    return {
      address: payload.arguments[0],
      role: "receiver",
    };
  }

  if (isPrimaryFaTransfer) {
    return {
      address: payload.arguments[1],
      role: "receiver",
    };
  }

  if (isObjectTransfer) {
    return {
      address: payload.arguments[1],
      role: "receiver",
    };
  }
  if (isTokenV2MintSoulbound) {
    return {
      address: payload.arguments[7],
      role: "receiver",
    };
  }

  const smartContractAddr = payload.function.split("::")[0];
  return {
    address: smartContractAddr,
    role: "smartContract",
  };
}

type ChangeData = {
  coin: { value: string };
  deposit_events: {
    guid: {
      id: {
        addr: string;
        creation_num: string;
      };
    };
  };
  withdraw_events: {
    guid: {
      id: {
        addr: string;
        creation_num: string;
      };
    };
  };
};

function getBalanceMap(transaction: Types.Transaction) {
  const events: Types.Event[] =
    "events" in transaction ? transaction.events : [];

  // compile what fungible assets are updated in the transaction
  const fungibleAssetChangesByStore: Record<string, Types.WriteSetChange[]> =
    {};
  if ("changes" in transaction) {
    for (const change of transaction.changes) {
      if (
        change.type === "write_resource" ||
        change.type === "create_resource"
      ) {
        // track the store address and the changes to the store
        const changeWithData = change as {
          address: string;
          data: { type: string };
        };
        switch (changeWithData.data.type) {
          case "0x1::object::ObjectCore": // needed to determine owner of store
          case "0x1::fungible_asset::FungibleStore": // needed to determine FA type of store
            const addr = tryStandardizeAddress(changeWithData.address);
            if (!addr) {
              break;
            }
            if (fungibleAssetChangesByStore[addr] === undefined) {
              fungibleAssetChangesByStore[addr] = [];
            }

            fungibleAssetChangesByStore[addr].push(change);
            break;
        }
      }
    }
  }

  return events.reduce(
    (
      balanceMap: {
        [key: string]: {
          amountAfter: string;
          amount: bigint;
        };
      },
      event: Types.Event
    ) => {
      const addr = standardizeAddress(event.guid.account_address);

      if (
        event.type === "0x1::coin::DepositEvent" ||
        event.type === "0x1::coin::WithdrawEvent"
      ) {
        // deposit and withdraw events could be other coins
        // here we only care about MOVE events
        if (isAptEvent(event, transaction)) {
          if (!balanceMap[addr]) {
            balanceMap[addr] = { amount: BigInt(0), amountAfter: "" };
          }

          const amount = BigInt(event.data.amount);

          if (event.type === "0x1::coin::DepositEvent") {
            balanceMap[addr].amount += amount;
          } else {
            balanceMap[addr].amount -= amount;
          }
        }
      } else if (
        event.type === "0x1::fungible_asset::Withdraw" ||
        event.type === "0x1::fungible_asset::Deposit"
      ) {
        // in order to add to balance map:
        // 1. must be FA store that shows up in the changes
        // 2. must be 0xa MOVE

        // verify #1
        const faEvent = event;
        const store = tryStandardizeAddress(faEvent.data.store);
        // skip if the address doesn't parse (shouldn't happen)
        if (!store) {
          return balanceMap;
        }

        const changes = fungibleAssetChangesByStore[store];
        // skip if no changes (shouldn't happen)
        if (!changes || changes.length === 0) {
          return balanceMap;
        }

        // verify #2
        const faStore = changes.find((change) => {
          const changeWithData = change as {
            type: string;
            data: { type: string };
          };
          return (
            changeWithData.data.type === "0x1::fungible_asset::FungibleStore" // change of this type has FA type
          );
        });

        // skip if no FA store (shouldn't happen)
        if (!faStore) {
          return balanceMap;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const faStoreData = faStore as any as {
          data: {
            type: string;
            data: {
              balance: string;
              frozen: boolean;
              metadata: { inner: string };
            };
          };
        };

        // skip if not MOVE
        if (faStoreData.data.data.metadata.inner !== "0xa") {
          return balanceMap;
        }

        // Find the owner
        const object = changes.find((change) => {
          const changeWithData = change as {
            type: string;
            data: { type: string };
          };
          return changeWithData.data.type === "0x1::object::ObjectCore"; // change of this type has owner
        });

        // skip if no owner (shouldn't happen)
        if (!object) {
          return balanceMap;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const objectData = object as any as {
          data: {
            type: string;
            data: { owner: string };
          };
        };
        const balanceOwner = tryStandardizeAddress(objectData.data.data.owner);
        // skip if the address doesn't parse (shouldn't happen)
        if (!balanceOwner) {
          return balanceMap;
        }

        // add the balance
        const amount = BigInt(event.data.amount);

        if (balanceMap[balanceOwner] === undefined) {
          balanceMap[balanceOwner] = { amount: BigInt(0), amountAfter: "" };
        }

        if (event.type === "0x1::fungible_asset::Deposit") {
          balanceMap[balanceOwner].amount += amount;
        } else {
          balanceMap[balanceOwner].amount -= amount;
        }
      }

      return balanceMap;
    },
    {}
  );
}

function getAptChangeData(
  change: Types.WriteSetChange
): ChangeData | undefined {
  if (
    "address" in change &&
    "data" in change &&
    "type" in change.data &&
    change.data.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>" &&
    "data" in change.data
  ) {
    return JSON.parse(JSON.stringify(change.data.data)) as ChangeData;
  } else {
    return undefined;
  }
}

function isAptEvent(event: Types.Event, transaction: Types.Transaction) {
  const changes: Types.WriteSetChange[] =
    "changes" in transaction ? transaction.changes : [];

  const aptEventChange = changes.filter((change) => {
    if (
      "address" in change &&
      change.address &&
      tryStandardizeAddress(change.address) ===
        tryStandardizeAddress(event.guid.account_address)
    ) {
      const data = getAptChangeData(change);
      if (data !== undefined) {
        const eventCreationNum = event.guid.creation_number;
        let changeCreationNum;
        if (event.type === "0x1::coin::DepositEvent") {
          changeCreationNum = data.deposit_events.guid.id.creation_num;
        } else if (event.type === "0x1::coin::WithdrawEvent") {
          changeCreationNum = data.withdraw_events.guid.id.creation_num;
        }
        if (eventCreationNum === changeCreationNum) {
          return change;
        }
      }
    }
  });

  return aptEventChange.length > 0;
}

export function getCoinBalanceChangeForAccount(
  transaction: Types.Transaction,
  address: string
): bigint {
  const accountToBalance = getBalanceMap(transaction);
  address = standardizeAddress(address);

  if (!Object.prototype.hasOwnProperty.call(accountToBalance, address)) {
    return BigInt(0);
  }

  const accountBalance = accountToBalance[address];
  return accountBalance.amount;
}

export function getTransactionAmount(
  transaction: Types.Transaction
): bigint | undefined {
  if (transaction.type !== TransactionTypeName.User) {
    return undefined;
  }

  const accountToBalance = getBalanceMap(transaction);

  const [totalDepositAmount, totalWithdrawAmount] = Object.values(
    accountToBalance
  ).reduce(
    ([totalDepositAmount, totalWithdrawAmount]: bigint[], value) => {
      if (value.amount > 0) {
        totalDepositAmount += value.amount;
      }
      if (value.amount < 0) {
        totalWithdrawAmount -= value.amount;
      }
      return [totalDepositAmount, totalWithdrawAmount];
    },
    [BigInt(0), BigInt(0)]
  );

  return totalDepositAmount > totalWithdrawAmount
    ? totalDepositAmount
    : totalWithdrawAmount;
}

// Get the function name from a transaction
export function getTransactionFunction(
  transaction: Types.Transaction
): string | null {
  if (!("payload" in transaction)) {
    return null;
  }

  if (transaction.payload.type === "script_payload") {
    return "Script";
  }

  let functionFullStr: string;
  if (transaction.payload.type === "multisig_payload") {
    if (
      "transaction_payload" in transaction.payload &&
      transaction.payload.transaction_payload &&
      "function" in transaction.payload.transaction_payload
    ) {
      functionFullStr = transaction.payload.transaction_payload.function;
    } else {
      return "Multisig";
    }
  } else if ("function" in transaction.payload) {
    functionFullStr = transaction.payload.function;
  } else {
    return null;
  }

  // Check for coin transfer
  if (
    functionFullStr === "0x1::coin::transfer" ||
    functionFullStr === "0x1::aptos_account::transfer"
  ) {
    return "Coin Transfer";
  }

  const parts = functionFullStr.split("::");
  if (parts.length >= 3) {
    return `${parts[1]}::${parts[2]}`;
  }

  return functionFullStr;
}

// Format MOVE amount (8 decimals)
export function formatMoveAmount(amount: bigint | number | string): string {
  const amountBigInt = typeof amount === "bigint" ? amount : BigInt(amount);
  const decimals = 8;
  const divisor = BigInt(10 ** decimals);
  const whole = amountBigInt / divisor;
  const fraction = amountBigInt % divisor;

  if (fraction === BigInt(0)) {
    return whole.toString();
  }

  const fractionStr = fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return `${whole}.${fractionStr}`;
}

// Gas information type
export type GasInfo = {
  gasUsed: string;
  gasPrice: string;
  gasFee: string;
  maxGas?: string;
};

// Get gas information from transaction
export function getGasInfo(tx: Types.Transaction): GasInfo | null {
  if ("gas_used" in tx && "gas_unit_price" in tx) {
    const gasUsed = tx.gas_used;
    const gasPrice = tx.gas_unit_price;
    const gasFee = (BigInt(gasUsed) * BigInt(gasPrice)).toString();
    const maxGas =
      "max_gas_amount" in tx
        ? (tx as Types.UserTransaction).max_gas_amount
        : undefined;
    return { gasUsed, gasPrice, gasFee, maxGas };
  }
  return null;
}

// Balance change type for display
export type BalanceChange = {
  address: string;
  amount: bigint;
  type: "Deposit" | "Withdraw";
};

// Get balance changes from events (simplified for display)
export function getBalanceChanges(tx: Types.Transaction): BalanceChange[] {
  const events: Types.Event[] = "events" in tx ? tx.events : [];
  const changes: BalanceChange[] = [];

  for (const event of events) {
    if (event.type === "0x1::coin::DepositEvent") {
      changes.push({
        address: event.guid.account_address,
        amount: BigInt(event.data.amount),
        type: "Deposit",
      });
    } else if (event.type === "0x1::coin::WithdrawEvent") {
      changes.push({
        address: event.guid.account_address,
        amount: -BigInt(event.data.amount),
        type: "Withdraw",
      });
    } else if (event.type === "0x1::fungible_asset::Deposit") {
      changes.push({
        address: event.data.store || event.guid.account_address,
        amount: BigInt(event.data.amount),
        type: "Deposit",
      });
    } else if (event.type === "0x1::fungible_asset::Withdraw") {
      changes.push({
        address: event.data.store || event.guid.account_address,
        amount: -BigInt(event.data.amount),
        type: "Withdraw",
      });
    }
  }

  return changes;
}

// Get storage refund from FeeStatement event
export function getStorageRefund(tx: Types.Transaction): bigint | null {
  const events: Types.Event[] = "events" in tx ? tx.events : [];
  const feeStatement = events.find(
    (e) => e.type === "0x1::transaction_fee::FeeStatement"
  );
  if (feeStatement?.data?.storage_fee_refund_octas) {
    const refund = BigInt(feeStatement.data.storage_fee_refund_octas);
    return refund > 0 ? refund : null;
  }
  return null;
}

// Transaction action types
export type TransactionAction =
  | { type: "swap"; dex: string; amountIn: string; amountOut: string }
  | { type: "nft_mint"; collection: string; token: string }
  | { type: "nft_burn"; collection: string; token: string }
  | { type: "object_transfer"; object: string; from: string; to: string };

// Parse transaction actions from events
export function getTransactionActions(
  tx: Types.Transaction
): TransactionAction[] {
  const events: Types.Event[] = "events" in tx ? tx.events : [];
  const actions: TransactionAction[] = [];

  for (const event of events) {
    // NFT Mint
    if (
      event.type.startsWith("0x4::collection::Mint") ||
      event.type.startsWith("0x4::collection::MintEvent")
    ) {
      actions.push({
        type: "nft_mint",
        collection: event.data.collection,
        token: event.data.token,
      });
    }
    // NFT Burn
    else if (
      event.type.startsWith("0x4::collection::Burn") ||
      event.type.startsWith("0x4::collection::BurnEvent")
    ) {
      actions.push({
        type: "nft_burn",
        collection: event.data.collection,
        token: event.data.token,
      });
    }
    // Object Transfer
    else if (
      event.type.startsWith("0x1::object::Transfer") ||
      event.type.startsWith("0x1::object::TransferEvent")
    ) {
      actions.push({
        type: "object_transfer",
        object: event.data.object,
        from: event.data.from,
        to: event.data.to,
      });
    }
  }

  return actions;
}
