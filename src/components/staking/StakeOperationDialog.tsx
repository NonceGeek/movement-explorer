"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useSubmitStakeOperation, {
  StakeOperation,
} from "@/hooks/staking/useSubmitStakeOperation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const OCTA = 100_000_000; // 1 MOVE = 10^8 OCTA

interface StakeOperationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  operation: StakeOperation;
  validatorAddress: string;
  maxAmount?: number; // in MOVE, not OCTA
}

export function StakeOperationDialog({
  isOpen,
  onClose,
  operation,
  validatorAddress,
  maxAmount,
}: StakeOperationDialogProps) {
  const [amount, setAmount] = useState("");
  const { connected } = useWallet();
  const {
    submitStakeOperation,
    transactionInProcess,
    transactionResponse,
    clearTransactionResponse,
  } = useSubmitStakeOperation();

  const operationLabels: Record<
    StakeOperation,
    { title: string; button: string }
  > = {
    [StakeOperation.STAKE]: { title: "Stake MOVE", button: "Stake" },
    [StakeOperation.UNLOCK]: { title: "Unstake MOVE", button: "Unstake" },
    [StakeOperation.REACTIVATE]: {
      title: "Reactivate Stake",
      button: "Reactivate",
    },
    [StakeOperation.WITHDRAW]: { title: "Withdraw MOVE", button: "Withdraw" },
  };

  const handleSubmit = async () => {
    if (!amount || !connected) return;
    const amountInOcta = Math.floor(parseFloat(amount) * OCTA);
    await submitStakeOperation(validatorAddress, amountInOcta, operation);
  };

  const handleClose = () => {
    setAmount("");
    clearTransactionResponse();
    onClose();
  };

  const isSuccess =
    transactionResponse?.transactionSubmitted && transactionResponse.success;
  const isError =
    transactionResponse &&
    (!transactionResponse.transactionSubmitted || !transactionResponse.success);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{operationLabels[operation].title}</DialogTitle>
          <DialogDescription>
            Enter the amount of MOVE to{" "}
            {operation === StakeOperation.STAKE
              ? "stake"
              : operation === StakeOperation.UNLOCK
              ? "unstake"
              : operation === StakeOperation.REACTIVATE
              ? "reactivate"
              : "withdraw"}
            .
          </DialogDescription>
        </DialogHeader>

        {isSuccess && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Transaction successful!{" "}
              <a
                href={`/txn/${transactionResponse.transactionHash}`}
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View transaction
              </a>
            </AlertDescription>
          </Alert>
        )}

        {isError && (
          <Alert className="border-red-500 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {transactionResponse.message || "Transaction failed"}
            </AlertDescription>
          </Alert>
        )}

        {!isSuccess && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (MOVE)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAmount(e.target.value)
                  }
                  disabled={transactionInProcess}
                  min="0"
                  step="0.01"
                />
              </div>

              {maxAmount !== undefined && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount((maxAmount * 0.25).toFixed(2))}
                  >
                    25%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount((maxAmount * 0.5).toFixed(2))}
                  >
                    50%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount((maxAmount * 0.75).toFixed(2))}
                  >
                    75%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(maxAmount.toFixed(2))}
                  >
                    MAX
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!amount || transactionInProcess || !connected}
              >
                {transactionInProcess ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  operationLabels[operation].button
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {isSuccess && (
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
