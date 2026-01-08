"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { useGetTransaction } from "@/hooks/transactions/useGetTransaction";
import { useGetBlockByVersion } from "@/hooks/blocks/useGetBlock";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Types } from "aptos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

function formatTimestamp(timestamp: string): string {
  const date = new Date(parseInt(timestamp) / 1000);
  return date.toLocaleString();
}

function getGasInfo(tx: Types.Transaction): {
  gasUsed: string;
  gasPrice: string;
  gasFee: string;
  maxGas?: string;
} | null {
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

// Get transaction counterparty (receiver or smart contract)
function getTransactionCounterparty(
  tx: Types.Transaction
): { address: string; role: "receiver" | "smartContract" } | null {
  if (tx.type !== "user_transaction") return null;
  if (!("payload" in tx)) return null;

  const userTx = tx as Types.UserTransaction;
  const payload = userTx.payload;

  if (payload.type !== "entry_function_payload") return null;

  const entryPayload = payload as Types.TransactionPayload_EntryFunctionPayload;
  const func = entryPayload.function;

  const isCoinTransfer =
    func === "0x1::coin::transfer" ||
    func === "0x1::aptos_account::transfer_coins" ||
    func === "0x1::aptos_account::transfer" ||
    func === "0x1::aptos_account::fungible_transfer_only";

  const isPrimaryFaTransfer = func === "0x1::primary_fungible_store::transfer";
  const isObjectTransfer = func === "0x1::object::transfer";

  if (isCoinTransfer && entryPayload.arguments?.[0]) {
    return { address: entryPayload.arguments[0] as string, role: "receiver" };
  }

  if (
    (isPrimaryFaTransfer || isObjectTransfer) &&
    entryPayload.arguments?.[1]
  ) {
    return { address: entryPayload.arguments[1] as string, role: "receiver" };
  }

  const smartContractAddr = func.split("::")[0];
  return { address: smartContractAddr, role: "smartContract" };
}

// Get function name from payload
function getFunctionName(tx: Types.Transaction): string | null {
  if (!("payload" in tx)) return null;
  const userTx = tx as Types.UserTransaction;
  const payload = userTx.payload;

  if (payload.type === "entry_function_payload") {
    return (payload as Types.TransactionPayload_EntryFunctionPayload).function;
  }
  if (payload.type === "script_payload") {
    return "Script";
  }
  if (payload.type === "multisig_payload") {
    const multisig = payload as Types.TransactionPayload_MultisigPayload;
    if (multisig.transaction_payload?.type === "entry_function_payload") {
      return (
        multisig.transaction_payload as Types.TransactionPayload_EntryFunctionPayload
      ).function;
    }
    return "Multisig";
  }
  return null;
}

// Extract balance changes from events
type BalanceChange = {
  address: string;
  amount: bigint;
  type: "Deposit" | "Withdraw" | "Gas Fee";
};

function getBalanceChanges(tx: Types.Transaction): BalanceChange[] {
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

// Get transaction amount from balance changes
function getTransactionAmount(tx: Types.Transaction): bigint | null {
  const events: Types.Event[] = "events" in tx ? tx.events : [];
  let totalDeposit = BigInt(0);
  let totalWithdraw = BigInt(0);

  for (const event of events) {
    if (
      event.type === "0x1::coin::DepositEvent" ||
      event.type === "0x1::fungible_asset::Deposit"
    ) {
      totalDeposit += BigInt(event.data.amount);
    } else if (
      event.type === "0x1::coin::WithdrawEvent" ||
      event.type === "0x1::fungible_asset::Withdraw"
    ) {
      totalWithdraw += BigInt(event.data.amount);
    }
  }

  const amount = totalDeposit > totalWithdraw ? totalDeposit : totalWithdraw;
  return amount > 0 ? amount : null;
}

// Get storage refund from FeeStatement event
function getStorageRefund(tx: Types.Transaction): bigint | null {
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

// Parse transaction actions from events
type TransactionAction =
  | { type: "swap"; dex: string; amountIn: string; amountOut: string }
  | { type: "nft_mint"; collection: string; token: string }
  | { type: "nft_burn"; collection: string; token: string }
  | { type: "object_transfer"; object: string; from: string; to: string };

function getTransactionActions(tx: Types.Transaction): TransactionAction[] {
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

// Reusable info item component
function InfoItem({
  label,
  value,
  mono = false,
  children,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  if (!value && !children) return null;
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      {children || (
        <p className={mono ? "font-mono text-sm break-all" : ""}>{value}</p>
      )}
    </div>
  );
}

// Section card component
function SectionCard({
  title,
  children,
  defaultCollapsed = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4 space-y-4">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-muted-foreground text-xs">
          {isCollapsed ? "▶" : "▼"}
        </span>
      </button>
      {!isCollapsed && children}
    </div>
  );
}

// Collapsible JSON viewer
function CollapsibleJson({ data, label }: { data: unknown; label: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-primary hover:underline flex items-center gap-1"
      >
        {isExpanded ? "▼ Hide" : "▶ Show"} {label}
      </button>
      {isExpanded && (
        <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

// Balance Change Table Component
function BalanceChangeTable({ changes }: { changes: BalanceChange[] }) {
  if (changes.length === 0) {
    return <p className="text-muted-foreground">No balance changes</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">
              Account
            </th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">
              Type
            </th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">
              Amount (MOVE)
            </th>
          </tr>
        </thead>
        <tbody>
          {changes.map((change, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="py-3 px-4">
                <Link
                  href={`/account/${change.address}`}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {change.address.slice(0, 10)}...{change.address.slice(-8)}
                </Link>
              </td>
              <td className="py-3 px-4">
                <Badge
                  variant={change.type === "Deposit" ? "success" : "secondary"}
                  className="text-xs"
                >
                  {change.type}
                </Badge>
              </td>
              <td
                className={`py-3 px-4 text-right font-mono ${
                  change.amount >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {change.amount >= 0 ? "+" : ""}
                {(Number(change.amount) / 1e8).toFixed(8)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Actions display component
function ActionsDisplay({ actions }: { actions: TransactionAction[] }) {
  if (actions.length === 0) return null;

  return (
    <div className="space-y-2">
      {actions.map((action, i) => (
        <div
          key={i}
          className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded"
        >
          {action.type === "nft_mint" && (
            <>
              <span>🏗️ Minted</span>
              <Link
                href={`/object/${action.token}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {action.token.slice(0, 10)}...
              </Link>
              <span>in</span>
              <Link
                href={`/object/${action.collection}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {action.collection.slice(0, 10)}...
              </Link>
            </>
          )}
          {action.type === "nft_burn" && (
            <>
              <span>🔥 Burned</span>
              <Link
                href={`/object/${action.token}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {action.token.slice(0, 10)}...
              </Link>
            </>
          )}
          {action.type === "object_transfer" && (
            <>
              <span>⏩ Transferred</span>
              <Link
                href={`/object/${action.object}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {action.object.slice(0, 10)}...
              </Link>
              <span>from</span>
              <Link
                href={`/account/${action.from}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {action.from.slice(0, 8)}...
              </Link>
              <span>to</span>
              <Link
                href={`/account/${action.to}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {action.to.slice(0, 8)}...
              </Link>
            </>
          )}
          {action.type === "swap" && (
            <>
              <span>🔄 Swapped</span>
              <span className="font-mono">{action.amountIn}</span>
              <span>for</span>
              <span className="font-mono">{action.amountOut}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default function TransactionDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hash = params.hash as string;
  const [showRaw, setShowRaw] = useState(false);

  // Get tab from URL or default to overview
  const tabFromUrl = searchParams.get("tab") || "overview";
  const validTabs = ["overview", "balance", "events", "payload", "changes"];
  const currentTab = validTabs.includes(tabFromUrl) ? tabFromUrl : "overview";

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", value);
    router.push(`/txn/${hash}?${newParams.toString()}`, { scroll: false });
  };

  const { data: tx, isLoading, error } = useGetTransaction(hash);

  // Fetch block height based on transaction version
  const version = tx && "version" in tx ? tx.version : null;
  const { data: blockData } = useGetBlockByVersion({
    version: version ? parseInt(version) : 0,
    withTransactions: false,
  });

  if (isLoading) {
    return (
      <>
        <PageNavigation title="Transaction Details" />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </>
    );
  }

  // Check if transaction not found
  const isNotFound = error?.type === "Not Found";

  if (isNotFound || (!tx && !isLoading)) {
    return (
      <>
        <PageNavigation title="Transaction Details" />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-center py-12 space-y-4">
                <Search className="w-16 h-16 mx-auto text-muted-foreground" />
                <h2 className="text-xl font-semibold">Transaction Not Found</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  The transaction{" "}
                  <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {hash.slice(0, 20)}...
                  </code>{" "}
                  could not be found on the current network.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check the transaction hash or try a different network.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error || !tx) {
    return (
      <>
        <PageNavigation title="Transaction Details" />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">
                Failed to load transaction {hash}
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Basic fields
  const isSuccess = "success" in tx ? tx.success : true;
  const txVersion = "version" in tx ? tx.version : null;
  const blockHeight = blockData?.block_height;
  const timestamp = "timestamp" in tx ? tx.timestamp : null;
  const sender = "sender" in tx ? (tx as Types.UserTransaction).sender : null;

  // Additional fields
  const sequenceNumber =
    "sequence_number" in tx
      ? (tx as Types.UserTransaction).sequence_number
      : null;
  const expirationTimestamp =
    "expiration_timestamp_secs" in tx
      ? (tx as Types.UserTransaction).expiration_timestamp_secs
      : null;
  const vmStatus = "vm_status" in tx ? tx.vm_status : null;
  const stateChangeHash =
    "state_change_hash" in tx ? tx.state_change_hash : null;
  const eventRootHash = "event_root_hash" in tx ? tx.event_root_hash : null;
  const accumulatorRootHash =
    "accumulator_root_hash" in tx ? tx.accumulator_root_hash : null;
  const signature =
    "signature" in tx ? (tx as Types.UserTransaction).signature : null;

  // Fee payer & secondary signers
  let feePayer: string | undefined;
  let secondarySigners: string[] | undefined;
  if (signature) {
    if ("fee_payer_address" in signature) {
      feePayer = (signature as { fee_payer_address?: string })
        .fee_payer_address;
    }
    if ("secondary_signer_addresses" in signature) {
      secondarySigners = (
        signature as { secondary_signer_addresses?: string[] }
      ).secondary_signer_addresses;
    }
  }

  const gasInfo = getGasInfo(tx);
  const payload =
    "payload" in tx ? (tx as Types.UserTransaction).payload : null;
  const events = "events" in tx ? tx.events : [];
  const changes = "changes" in tx ? tx.changes : [];
  const balanceChanges = getBalanceChanges(tx);

  // New fields
  const transactionAmount = getTransactionAmount(tx);
  const storageRefund = getStorageRefund(tx);
  const transactionActions = getTransactionActions(tx);

  // Counterparty and function
  const counterparty = getTransactionCounterparty(tx);
  const functionName = getFunctionName(tx);

  return (
    <>
      <PageNavigation title="Transaction Details" />
      <div className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold font-heading">
            Transaction Details
          </h1>
          <Badge variant={isSuccess ? "success" : "error"}>
            {isSuccess ? "✓ Success" : "✗ Failed"}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="balance">
              Balance Change ({balanceChanges.length})
            </TabsTrigger>
            <TabsTrigger value="events">
              Events ({events?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="payload">Payload</TabsTrigger>
            <TabsTrigger value="changes">
              Changes ({changes?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Overview</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRaw(!showRaw)}
                  className="font-mono text-xs"
                >
                  {showRaw ? "Formatted" : "Raw"}
                </Button>
              </CardHeader>
              <CardContent>
                {showRaw ? (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {JSON.stringify(tx, null, 2)}
                  </pre>
                ) : (
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <SectionCard title="Basic Info">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InfoItem label="Version" value={txVersion} mono />
                        {blockHeight && (
                          <InfoItem label="Block">
                            <Link
                              href={`/block/${blockHeight}`}
                              className="font-mono text-sm text-primary hover:underline"
                            >
                              {blockHeight}
                            </Link>
                          </InfoItem>
                        )}
                        <InfoItem
                          label="Timestamp"
                          value={timestamp ? formatTimestamp(timestamp) : null}
                          mono
                        />
                        <InfoItem label="Type">
                          <Badge variant="secondary" className="capitalize">
                            {tx.type.replace(/_/g, " ")}
                          </Badge>
                        </InfoItem>
                      </div>
                      <InfoItem label="Hash" value={tx.hash} mono />
                      {sender && (
                        <InfoItem label="Sender">
                          <Link
                            href={`/account/${sender}`}
                            className="font-mono text-sm text-primary hover:underline break-all"
                          >
                            {sender}
                          </Link>
                        </InfoItem>
                      )}
                      {feePayer && (
                        <InfoItem label="Fee Payer">
                          <Link
                            href={`/account/${feePayer}`}
                            className="font-mono text-sm text-primary hover:underline break-all"
                          >
                            {feePayer}
                          </Link>
                        </InfoItem>
                      )}
                      {secondarySigners && secondarySigners.length > 0 && (
                        <InfoItem label="Secondary Signers">
                          <div className="space-y-1">
                            {secondarySigners.map((addr, i) => (
                              <Link
                                key={i}
                                href={`/account/${addr}`}
                                className="font-mono text-sm text-primary hover:underline break-all block"
                              >
                                {addr}
                              </Link>
                            ))}
                          </div>
                        </InfoItem>
                      )}
                      {counterparty && (
                        <InfoItem
                          label={
                            counterparty.role === "receiver"
                              ? "Receiver"
                              : "Smart Contract"
                          }
                        >
                          <Link
                            href={`/account/${counterparty.address}`}
                            className="font-mono text-sm text-primary hover:underline break-all"
                          >
                            {counterparty.address}
                          </Link>
                        </InfoItem>
                      )}
                      {functionName && (
                        <InfoItem label="Function" value={functionName} mono />
                      )}
                      {transactionAmount && (
                        <InfoItem
                          label="Amount"
                          value={`${(Number(transactionAmount) / 1e8).toFixed(
                            8
                          )} MOVE`}
                          mono
                        />
                      )}
                      {transactionActions.length > 0 && (
                        <InfoItem label="Actions">
                          <ActionsDisplay actions={transactionActions} />
                        </InfoItem>
                      )}
                    </SectionCard>

                    {/* Gas Info */}
                    {gasInfo && (
                      <SectionCard title="Gas Info">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <InfoItem
                            label="Gas Used"
                            value={gasInfo.gasUsed}
                            mono
                          />
                          <InfoItem
                            label="Gas Price"
                            value={`${gasInfo.gasPrice} Octas`}
                            mono
                          />
                          {gasInfo.maxGas && (
                            <InfoItem
                              label="Max Gas"
                              value={gasInfo.maxGas}
                              mono
                            />
                          )}
                          <InfoItem
                            label="Gas Fee"
                            value={`${(Number(gasInfo.gasFee) / 1e8).toFixed(
                              8
                            )} MOVE`}
                            mono
                          />
                        </div>
                        {storageRefund && (
                          <InfoItem
                            label="Storage Refund"
                            value={`${(Number(storageRefund) / 1e8).toFixed(
                              8
                            )} MOVE`}
                            mono
                          />
                        )}
                      </SectionCard>
                    )}

                    {/* Execution Info */}
                    {(sequenceNumber || expirationTimestamp || vmStatus) && (
                      <SectionCard title="Execution Info">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sequenceNumber && (
                            <InfoItem
                              label="Sequence Number"
                              value={sequenceNumber}
                              mono
                            />
                          )}
                          {expirationTimestamp && (
                            <InfoItem
                              label="Expiration"
                              value={new Date(
                                parseInt(expirationTimestamp) * 1000
                              ).toLocaleString()}
                              mono
                            />
                          )}
                          {vmStatus && (
                            <InfoItem label="VM Status">
                              <Badge
                                variant={isSuccess ? "success" : "error"}
                                className="font-mono text-xs"
                              >
                                {vmStatus}
                              </Badge>
                            </InfoItem>
                          )}
                        </div>
                      </SectionCard>
                    )}

                    {/* Advanced */}
                    {(stateChangeHash ||
                      eventRootHash ||
                      accumulatorRootHash ||
                      signature) && (
                      <SectionCard title="Advanced" defaultCollapsed>
                        {stateChangeHash && (
                          <InfoItem
                            label="State Change Hash"
                            value={stateChangeHash}
                            mono
                          />
                        )}
                        {eventRootHash && (
                          <InfoItem
                            label="Event Root Hash"
                            value={eventRootHash}
                            mono
                          />
                        )}
                        {accumulatorRootHash && (
                          <InfoItem
                            label="Accumulator Root Hash"
                            value={accumulatorRootHash}
                            mono
                          />
                        )}
                        <CollapsibleJson data={signature} label="Signature" />
                      </SectionCard>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Balance Change Tab */}
          <TabsContent value="balance">
            <Card>
              <CardHeader>
                <CardTitle>Balance Change ({balanceChanges.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <BalanceChangeTable changes={balanceChanges} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Events ({events?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {events && events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((event, i) => (
                      <div
                        key={i}
                        className="border border-border rounded-lg p-4"
                      >
                        <p className="text-sm text-muted-foreground mb-2">
                          #{event.sequence_number} - {event.type}
                        </p>
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto font-mono">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No events</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payload Tab */}
          <TabsContent value="payload">
            <Card>
              <CardHeader>
                <CardTitle>Payload</CardTitle>
              </CardHeader>
              <CardContent>
                {payload ? (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground">No payload</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Changes Tab */}
          <TabsContent value="changes">
            <Card>
              <CardHeader>
                <CardTitle>Changes ({changes?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {changes && changes.length > 0 ? (
                  <div className="space-y-4">
                    {changes.slice(0, 20).map((change, i) => (
                      <div
                        key={i}
                        className="border border-border rounded-lg p-4"
                      >
                        <p className="text-sm text-muted-foreground mb-2">
                          {change.type}
                        </p>
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto font-mono">
                          {JSON.stringify(change, null, 2)}
                        </pre>
                      </div>
                    ))}
                    {changes.length > 20 && (
                      <p className="text-muted-foreground text-sm">
                        Showing first 20 of {changes.length} changes
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No changes</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
