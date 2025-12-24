"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StakeOperationDialog } from "./StakeOperationDialog";
import { StakeOperation } from "@/hooks/staking/useSubmitStakeOperation";
import { useGetDelegatorStakeInfo } from "@/hooks/staking/useGetDelegatorStakeInfo";
import { formatMoveAmount } from "@/utils/transaction";
import { Coins, Lock, Unlock, ArrowDownToLine } from "lucide-react";

const OCTA = 100_000_000;

interface MyDepositsProps {
  validatorAddress: string;
}

export function MyDepositsSection({ validatorAddress }: MyDepositsProps) {
  const { connected, account } = useWallet();
  const { stakes, isLoading } = useGetDelegatorStakeInfo(
    account?.address?.toString() || "",
    validatorAddress
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<StakeOperation>(
    StakeOperation.STAKE
  );

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            My Deposits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Connect your wallet to view and manage your deposits
          </p>
        </CardContent>
      </Card>
    );
  }

  // stakes[0] = active, stakes[1] = inactive, stakes[2] = pending_inactive
  const activeStake = stakes[0] ? BigInt(stakes[0] as string) : BigInt(0);
  const inactiveStake = stakes[1] ? BigInt(stakes[1] as string) : BigInt(0);
  const pendingInactiveStake = stakes[2]
    ? BigInt(stakes[2] as string)
    : BigInt(0);
  const totalDeposit = activeStake + inactiveStake + pendingInactiveStake;

  const hasDeposit = totalDeposit > BigInt(0);

  const openDialog = (operation: StakeOperation) => {
    setCurrentOperation(operation);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            My Deposits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Deposit Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Lock className="h-4 w-4 text-green-500" />
                    Active Stake
                  </div>
                  <p className="text-xl font-bold">
                    {formatMoveAmount(activeStake)} MOVE
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Unlock className="h-4 w-4 text-yellow-500" />
                    Pending Inactive
                  </div>
                  <p className="text-xl font-bold">
                    {formatMoveAmount(pendingInactiveStake)} MOVE
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <ArrowDownToLine className="h-4 w-4 text-blue-500" />
                    Withdrawable
                  </div>
                  <p className="text-xl font-bold">
                    {formatMoveAmount(inactiveStake)} MOVE
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => openDialog(StakeOperation.STAKE)}>
                  Stake
                </Button>

                {activeStake > BigInt(0) && (
                  <Button
                    variant="outline"
                    onClick={() => openDialog(StakeOperation.UNLOCK)}
                  >
                    Unstake
                  </Button>
                )}

                {pendingInactiveStake > BigInt(0) && (
                  <Button
                    variant="outline"
                    onClick={() => openDialog(StakeOperation.REACTIVATE)}
                  >
                    Reactivate
                  </Button>
                )}

                {inactiveStake > BigInt(0) && (
                  <Button
                    variant="secondary"
                    onClick={() => openDialog(StakeOperation.WITHDRAW)}
                  >
                    Withdraw
                  </Button>
                )}
              </div>

              {!hasDeposit && (
                <p className="text-muted-foreground text-sm">
                  You have no deposits in this validator. Click "Stake" to get
                  started.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <StakeOperationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        operation={currentOperation}
        validatorAddress={validatorAddress}
        maxAmount={
          currentOperation === StakeOperation.UNLOCK
            ? Number(activeStake) / OCTA
            : currentOperation === StakeOperation.REACTIVATE
            ? Number(pendingInactiveStake) / OCTA
            : currentOperation === StakeOperation.WITHDRAW
            ? Number(inactiveStake) / OCTA
            : undefined
        }
      />
    </>
  );
}
