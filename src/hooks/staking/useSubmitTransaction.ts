import { useEffect, useState } from "react";
import {
  useWallet,
  InputTransactionData,
} from "@aptos-labs/wallet-adapter-react";
import { useGlobalStore } from "@/store/useGlobalStore";

export type TransactionResponse =
  | TransactionResponseOnSubmission
  | TransactionResponseOnError;

export type TransactionResponseOnSubmission = {
  transactionSubmitted: true;
  transactionHash: string;
  success: boolean;
  message?: string;
};

export type TransactionResponseOnError = {
  transactionSubmitted: false;
  message: string;
};

const useSubmitTransaction = () => {
  const [transactionResponse, setTransactionResponse] =
    useState<TransactionResponse | null>(null);
  const [transactionInProcess, setTransactionInProcess] =
    useState<boolean>(false);
  const { aptos_client } = useGlobalStore();
  const { signAndSubmitTransaction } = useWallet();

  useEffect(() => {
    if (transactionResponse !== null) {
      setTransactionInProcess(false);
    }
  }, [transactionResponse]);

  async function submitTransaction(transaction: InputTransactionData) {
    setTransactionInProcess(true);

    const signAndSubmitTransactionCall = async (
      transaction: InputTransactionData
    ): Promise<TransactionResponse> => {
      const responseOnError: TransactionResponseOnError = {
        transactionSubmitted: false,
        message: "Unknown Error",
      };

      let response;
      try {
        response = await signAndSubmitTransaction(transaction);

        if ("hash" in response) {
          await aptos_client.waitForTransaction(response["hash"], {
            checkSuccess: true,
          });
          return {
            transactionSubmitted: true,
            transactionHash: response["hash"],
            success: true,
          };
        }
        return {
          ...responseOnError,
          message: (response as { message: string }).message,
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            transactionSubmitted: false,
            message: error.message,
          };
        }
      }
      return responseOnError;
    };

    await signAndSubmitTransactionCall(transaction).then(
      setTransactionResponse
    );
  }

  function clearTransactionResponse() {
    setTransactionResponse(null);
  }

  return {
    submitTransaction,
    transactionInProcess,
    transactionResponse,
    clearTransactionResponse,
  };
};

export default useSubmitTransaction;
