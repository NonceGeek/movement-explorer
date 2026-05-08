"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { WalletModal } from "@movementlabsxyz/movement-design-system";
import { StakeOperationDialog } from "./StakeOperationDialog";
import { StakeOperation } from "@/hooks/staking/useSubmitStakeOperation";
import { useGetDelegatorStakeInfo } from "@/hooks/staking/useGetDelegatorStakeInfo";
import { useGetAccountAPTBalance } from "@/hooks/accounts/useGetAccountAPTBalance";
import { formatMoveAmount } from "@/utils/transaction";
import { OCTA } from "@/constants/addresses";
import {
  Coins,
  Percent,
  Award,
  HelpCircle,
  ArrowUpCircle,
} from "lucide-react";

const MINIMUM_MOVE_IN_POOL = 11;
const NETWORK_LIMIT_PERCENT = 30;

interface StakingBarProps {
  validatorAddress: string;
  delegatedStakeAmount: string;
  networkPercentage: string;
  rewardsEarned: number;
  commission: number | undefined;
  isLoading?: boolean;
}

export function StakingBar({
  validatorAddress,
  delegatedStakeAmount,
  networkPercentage,
  rewardsEarned,
  commission,
  isLoading,
}: StakingBarProps) {
  const { connected, account } = useWallet();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const walletAddress = account?.address?.toString() || "";
  const balance = useGetAccountAPTBalance(walletAddress);
  const userBalance = balance?.data ? BigInt(balance.data) : BigInt(0);

  const { stakes } = useGetDelegatorStakeInfo(walletAddress, validatorAddress);

  const networkPct = parseFloat(networkPercentage);
  const isOverNetworkLimit = networkPct >= NETWORK_LIMIT_PERCENT;
  const isBalanceInsufficient =
    connected && userBalance < BigInt(MINIMUM_MOVE_IN_POOL * OCTA);

  const handleStakeClick = () => {
    if (!connected) {
      setWalletModalOpen(true);
      return;
    }
    setDialogOpen(true);
  };

  const getTooltipText = (): string | null => {
    if (isOverNetworkLimit) {
      return `This validator has ${networkPercentage}% of the network stake, exceeding the ${NETWORK_LIMIT_PERCENT}% limit.`;
    }
    if (isBalanceInsufficient) {
      return `Insufficient balance. Minimum ${MINIMUM_MOVE_IN_POOL} MOVE required.`;
    }
    return null;
  };

  const tooltipText = getTooltipText();
  const isStakeDisabled = isOverNetworkLimit || !!isBalanceInsufficient;

  if (isLoading) {
    return (
      <div className="bg-card backdrop-blur-sm rounded-xl border border-border/50 mb-6 p-5 transition-all duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <EnhancedSkeleton className="h-4 w-24 mb-2" />
                  <EnhancedSkeleton className="h-8 w-32" />
                </div>
              ))}
            </div>
            <EnhancedSkeleton className="h-10 w-20" />
          </div>
      </div>
    );
  }

  const stakeButton = (
    <Button
      onClick={handleStakeClick}
      disabled={isStakeDisabled}
      className="gap-2"
    >
      <ArrowUpCircle className="h-4 w-4" />
      Stake
    </Button>
  );

  return (
    <>
      <div className="bg-card backdrop-blur-sm rounded-xl border border-border/50 mb-6 p-5 transition-all duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Stats */}
            <div className="flex flex-wrap gap-6 md:gap-8">
              {/* Delegated Stake Amount */}
              <div>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                  <Coins className="h-4 w-4" />
                  <span>Delegated Stake Amount</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        The total amount of delegated stake in this stake pool
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold">
                  {delegatedStakeAmount
                    ? formatMoveAmount(BigInt(delegatedStakeAmount))
                    : "0"}{" "}
                  MOVE
                </p>
              </div>

              {/* Of Network */}
              <div>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                  <Percent className="h-4 w-4" />
                  <span>Of Network</span>
                </div>
                <p className="text-2xl font-bold">{networkPercentage}%</p>
              </div>

              {/* Rewards Earned */}
              <div>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                  <Award className="h-4 w-4" />
                  <span>Rewards Earned So Far</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Amount of rewards earned by this stake pool to date
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold">
                  {rewardsEarned.toFixed(0)} MOVE
                </p>
              </div>
            </div>

            {/* Stake Button */}
            <div className="flex-shrink-0">
              {isOverNetworkLimit ? null : tooltipText ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>{stakeButton}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltipText}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                stakeButton
              )}
            </div>
          </div>
      </div>

      {walletModalOpen && (
        <WalletModal onClose={() => setWalletModalOpen(false)} />
      )}

      <StakeOperationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        operation={StakeOperation.STAKE}
        validatorAddress={validatorAddress}
      />
    </>
  );
}
