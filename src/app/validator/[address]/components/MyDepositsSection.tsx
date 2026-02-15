"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { StakeOperationDialog } from "./StakeOperationDialog";
import { StakeOperation } from "@/hooks/staking/useSubmitStakeOperation";
import { useGetDelegatorStakeInfo } from "@/hooks/staking/useGetDelegatorStakeInfo";
import { formatMoveAmount } from "@/utils/transaction";
import { Coins, Lock, Unlock, ArrowDownToLine } from "lucide-react";
import { OCTA } from "@/constants/addresses";

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
      <Card className="bg-card border-border mb-6">
        <div className="border-b border-border/50 py-4 px-6">
          <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            My Deposits
          </h2>
        </div>
        <div className="px-6 py-8">
          <p className="text-muted-foreground text-center text-sm">
            Connect your wallet to view and manage your deposits
          </p>
        </div>
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
      <Card className="bg-card border-border mb-6">
        {/* Header with title and action buttons */}
        <div className="border-b border-border/50 py-4 px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              My Deposits
            </h2>
            {!isLoading && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => openDialog(StakeOperation.STAKE)}
                >
                  Stake
                </Button>
                {activeStake > BigInt(0) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDialog(StakeOperation.UNLOCK)}
                  >
                    Unstake
                  </Button>
                )}
                {pendingInactiveStake > BigInt(0) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDialog(StakeOperation.REACTIVATE)}
                  >
                    Reactivate
                  </Button>
                )}
                {inactiveStake > BigInt(0) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openDialog(StakeOperation.WITHDRAW)}
                  >
                    Withdraw
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Deposit Summary - 3-column grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/40">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <EnhancedSkeleton className="h-3.5 w-3.5 rounded-full" />
                  <EnhancedSkeleton className="h-3 w-20" />
                </div>
                <EnhancedSkeleton className="h-6 w-28 mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/40">
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    Active Stake
                  </span>
                </div>
                <p className="text-lg font-semibold font-mono tabular-nums">
                  {formatMoveAmount(activeStake)} MOVE
                </p>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <Unlock className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">
                    Pending Inactive
                  </span>
                </div>
                <p className="text-lg font-semibold font-mono tabular-nums">
                  {formatMoveAmount(pendingInactiveStake)} MOVE
                </p>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownToLine className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs text-muted-foreground">
                    Withdrawable
                  </span>
                </div>
                <p className="text-lg font-semibold font-mono tabular-nums">
                  {formatMoveAmount(inactiveStake)} MOVE
                </p>
              </div>
            </div>

            {!hasDeposit && (
              <div className="px-5 py-3 border-t border-border/40">
                <p className="text-muted-foreground text-sm">
                  You have no deposits in this validator. Click &quot;Stake&quot;
                  to get started.
                </p>
              </div>
            )}
          </>
        )}
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
