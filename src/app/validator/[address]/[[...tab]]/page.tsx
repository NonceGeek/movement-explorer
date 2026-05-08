"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { useParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
// import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useGetValidators,
  ValidatorData,
} from "@/hooks/validators/useGetValidators";
import { useGetValidatorSet } from "@/hooks/validators/useGetValidatorSet";
import { useGetStakingRewardsRate } from "@/hooks/validators/useGetStakingRewardsRate";
import { useGetDelegationNodeInfo } from "@/hooks/validators/useGetDelegationNodeInfo";
import { useGetNumberOfDelegators } from "@/hooks/validators/useGetNumberOfDelegators";
import { useGetDelegatedStakingPoolList } from "@/hooks/validators/useGetDelegatedStakingPoolList";
import { useGetAccountResource } from "@/hooks/accounts/useGetAccountResource";
// TODO: temporarily disabled staking
// import { useGetAccountAPTBalance } from "@/hooks/accounts/useGetAccountAPTBalance";
// import { useGetDelegatorStakeInfo } from "@/hooks/staking/useGetDelegatorStakeInfo";
// import { StakeOperation } from "@/hooks/staking/useSubmitStakeOperation";
// import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { standardizeAddress } from "@/utils";
import { formatMoveAmount } from "@/utils/transaction";
// import { OCTA } from "@/constants/addresses";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { ValidatorStatusBadge } from "@/app/validators/components/ValidatorStatusBadge";
// TODO: temporarily disabled staking
// import { WalletModal } from "@movementlabsxyz/movement-design-system";
// import { StakeOperationDialog } from "../components/StakeOperationDialog";
// import { MyDepositsSection } from "../components/MyDepositsSection";
import { CommissionChangeBanner } from "../components/CommissionChangeBanner";
// import { StakeOperationActivities } from "../components/StakeOperationActivities";
import { TimeDurationIntervalBar } from "../components/TimeDurationIntervalBar";
import { calculateNetworkPercentage, getValidatorStatus } from "../utils";
import {
  Server,
  Coins,
  Percent,
  Award,
  Users,
  TrendingUp,
  Database,
  BarChart3,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  // ArrowUpCircle,
  HelpCircle,
} from "lucide-react";

// const MINIMUM_MOVE_IN_POOL = 11;
// const NETWORK_LIMIT_PERCENT = 30;

interface StakePoolData {
  active: { value: string };
  inactive: { value: string };
  pending_active: { value: string };
  pending_inactive: { value: string };
  locked_until_secs: string;
  operator_address: string;
  delegated_voter: string;
}

function ValidatorContent() {
  const params = useParams();
  const address = params.address as string;

  const addressHex = useMemo(() => {
    try {
      return standardizeAddress(address);
    } catch {
      return address;
    }
  }, [address]);

  // TODO: temporarily disabled staking
  // const { connected, account } = useWallet();
  // const [dialogOpen, setDialogOpen] = useState(false);
  // const [walletModalOpen, setWalletModalOpen] = useState(false);
  // const walletAddress = account?.address?.toString() || "";
  // const balance = useGetAccountAPTBalance(walletAddress);
  // const userBalance = balance?.data ? BigInt(balance.data) : BigInt(0);

  // Fetch validators list
  const { validators } = useGetValidators();

  // Fetch stake pool resource
  const {
    data: stakePool,
    isLoading: isLoadingStakePool,
    error,
  } = useGetAccountResource(addressHex, "0x1::stake::StakePool");

  // Fetch validator set for total voting power
  const { totalVotingPower } = useGetValidatorSet();

  // Fetch staking rewards rate
  const { rewardsRateYearly } = useGetStakingRewardsRate();

  // Fetch commission and validator status
  const {
    commission,
    validatorStatus: validatorStatusFromChain,
    isQueryLoading: isLoadingDelegationInfo,
  } = useGetDelegationNodeInfo({ validatorAddress: addressHex });

  // Fetch number of delegators
  const { delegatorBalance, loading: isLoadingDelegators } =
    useGetNumberOfDelegators(addressHex);

  // Fetch delegated staking pool list for non-active validator fallback
  const { delegatedStakingPools, loading: isLoadingPools } =
    useGetDelegatedStakingPoolList();

  const isLoading = isLoadingStakePool || isLoadingDelegationInfo || isLoadingPools;

  // Find validator in active validator list
  const validator = validators.find((v) => v.owner_address === addressHex);

  // Non-active validator fallback
  const delegationValidator = useMemo((): ValidatorData | undefined => {
    if (validator) return validator;

    const pool = delegatedStakingPools.find(
      (p) => standardizeAddress(p.staking_pool_address) === addressHex,
    );

    if (pool) {
      return {
        owner_address: addressHex,
        operator_address:
          pool.current_staking_pool?.operator_address || addressHex,
        voting_power: "0",
        governance_voting_record: "",
        last_epoch: 0,
        last_epoch_performance: "",
        liveness: 0,
        rewards_growth: 0,
        apt_rewards_distributed: 0,
      };
    }

    return undefined;
  }, [validator, delegatedStakingPools, addressHex]);

  const stakePoolData = stakePool as { data: StakePoolData } | undefined;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card backdrop-blur-sm rounded-xl border border-destructive/50 p-6">
          <p className="text-destructive">Error loading validator</p>
          <p className="text-muted-foreground mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  // Calculate staking info
  const activeStake = stakePoolData?.data?.active?.value
    ? BigInt(stakePoolData.data.active.value)
    : BigInt(0);
  const pendingInactive = stakePoolData?.data?.pending_inactive?.value
    ? BigInt(stakePoolData.data.pending_inactive.value)
    : BigInt(0);
  const pendingActive = stakePoolData?.data?.pending_active?.value
    ? BigInt(stakePoolData.data.pending_active.value)
    : BigInt(0);
  const inactive = stakePoolData?.data?.inactive?.value
    ? BigInt(stakePoolData.data.inactive.value)
    : BigInt(0);

  // Performance
  const rewardsGrowth = delegationValidator?.rewards_growth ?? 0;

  // Validator status
  const validatorStatusText = validatorStatusFromChain
    ? getValidatorStatus(Number(validatorStatusFromChain[0]))
    : undefined;

  const displayStatus =
    validatorStatusText ||
    (delegationValidator && BigInt(delegationValidator.voting_power || 0) > 0
      ? "Active"
      : "Inactive");

  // Network percentage
  const networkPercentage = delegationValidator?.voting_power
    ? calculateNetworkPercentage(
      delegationValidator.voting_power,
      totalVotingPower,
    )
    : "0.00";

  // Rewards earned
  const rewardsEarned = delegationValidator?.apt_rewards_distributed ?? 0;

  // TODO: temporarily disabled staking
  // const networkPct = parseFloat(networkPercentage);
  // const isOverNetworkLimit = networkPct >= NETWORK_LIMIT_PERCENT;
  // const isBalanceInsufficient =
  //   connected && userBalance < BigInt(MINIMUM_MOVE_IN_POOL * OCTA);
  // const handleStakeClick = () => {
  //   if (!connected) { setWalletModalOpen(true); return; }
  //   setDialogOpen(true);
  // };
  // const getTooltipText = (): string | null => {
  //   if (isOverNetworkLimit) return `This validator has ${networkPercentage}% ...`;
  //   if (isBalanceInsufficient) return `Insufficient balance...`;
  //   return null;
  // };
  // const tooltipText = getTooltipText();
  // const isStakeDisabled = isOverNetworkLimit || !!isBalanceInsufficient;
  // const stakeButton = (...);
  // const renderStakeButton = () => { ... };

  return (
    <>
      <PageNavigation />
      <PageContainer>
        {/* Commission Change Banner */}
        <CommissionChangeBanner
          validatorAddress={addressHex}
          currentCommission={commission}
        />

        {isLoading ? (
          <div className="space-y-6">
            {/* Overview Card Skeleton */}
            <div className="bg-card backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <EnhancedSkeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <EnhancedSkeleton className="h-6 w-24" />
                      <EnhancedSkeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <EnhancedSkeleton className="h-4 w-48" />
                  </div>
                </div>
                <EnhancedSkeleton className="h-8 w-20 rounded-md" />
              </div>
              {/* 3-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/30">
                {Array.from({ length: 3 }).map((_, col) => (
                  <div key={col} className="px-5 py-4 space-y-3">
                    <EnhancedSkeleton className="h-3 w-28" />
                    <div className="space-y-2.5">
                      {Array.from({ length: 3 }).map((_, row) => (
                        <div key={row} className="flex items-center justify-between">
                          <EnhancedSkeleton className="h-3 w-20" />
                          <EnhancedSkeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staking Breakdown Skeleton */}
            <div className="bg-card backdrop-blur-sm rounded-xl border border-border/50">
              <div className="border-b border-border/30 py-4 px-5">
                <EnhancedSkeleton className="h-5 w-40" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/30">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <EnhancedSkeleton className="h-3.5 w-3.5 rounded-full" />
                      <EnhancedSkeleton className="h-3 w-20" />
                    </div>
                    <EnhancedSkeleton className="h-6 w-28 mt-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Card */}
            <div className="bg-card backdrop-blur-sm rounded-xl border border-border/50 mb-6 overflow-hidden transition-all duration-300">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Server className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-heading font-bold">
                        Validator
                      </h1>
                      <ValidatorStatusBadge status={displayStatus} />
                    </div>
                    <CopyableAddress
                      address={addressHex}
                      href={`/account/${addressHex}`}
                      showCopyButton
                      truncateLength={{ start: 10, end: 8 }}
                      className="text-sm"
                    />
                  </div>
                </div>
                {/* TODO: temporarily disabled staking
                <div className="shrink-0">{renderStakeButton()}</div>
                */}
              </div>

              {/* 3-Column Grid Body */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/30">
                {/* Column 1: Staking Overview */}
                <div className="px-5 py-4 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Staking Overview
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Coins className="h-3.5 w-3.5" />
                        Delegated Stake
                      </span>
                      <span className="text-base font-medium tabular-nums">
                        {formatMoveAmount(
                          BigInt(delegationValidator?.voting_power || "0"),
                        )}{" "}
                        MOVE
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Percent className="h-3.5 w-3.5" />
                        Network Share
                      </span>
                      <span className="text-base font-medium tabular-nums">
                        {networkPercentage}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Award className="h-3.5 w-3.5" />
                        Rewards Earned
                      </span>
                      <span className="text-base font-medium tabular-nums">
                        {rewardsEarned.toFixed(0)} MOVE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Validator Details */}
                <div className="px-5 py-4 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Validator Details
                  </h3>
                  <div className="space-y-2.5">
                    {stakePoolData?.data?.operator_address && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                          <Users className="h-3.5 w-3.5" />
                          Operator
                        </span>
                        <CopyableAddress
                          address={stakePoolData.data.operator_address}
                          href={`/account/${stakePoolData.data.operator_address}`}
                          showCopyButton
                          truncateLength={{ start: 6, end: 4 }}
                          className="text-sm"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        Delegators
                      </span>
                      <span className="text-base font-medium tabular-nums">
                        {isLoadingDelegators ? (
                          <EnhancedSkeleton className="h-4 w-8" />
                        ) : (
                          delegatorBalance
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Percent className="h-3.5 w-3.5" />
                        Commission
                      </span>
                      <span className="text-base font-medium tabular-nums">
                        {commission !== undefined ? `${commission}%` : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Compound Rewards
                      </span>
                      <span className="text-base font-medium tabular-nums">
                        {rewardsRateYearly ?? "-"}% APR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Stake Pool Info */}
                <div className="px-5 py-4 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Stake Pool Info
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                        <Database className="h-3.5 w-3.5" />
                        Pool Address
                      </span>
                      <CopyableAddress
                        address={addressHex}
                        href={`/account/${addressHex}`}
                        showCopyButton
                        truncateLength={{ start: 6, end: 4 }}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Rewards Perf.
                      </span>
                      <span className="text-base font-medium tabular-nums">
                        {rewardsGrowth.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Activity className="h-3.5 w-3.5" />
                        Last Epoch Perf.
                      </span>
                      <span className="text-base font-medium tabular-nums">
                        {delegationValidator?.last_epoch_performance || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Last Active Epoch
                      </span>
                      <span className="text-base font-medium tabular-nums">
                        {delegationValidator?.last_epoch ?? "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Staking Breakdown */}
            <div className="bg-card backdrop-blur-sm rounded-xl border border-border/50 mb-6 transition-all duration-300">
              <div className="border-b border-border/30 py-4 px-5">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Staking Breakdown
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/30">
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-sm text-muted-foreground">
                      Active
                    </span>
                  </div>
                  <p className="text-lg font-semibold font-mono tabular-nums">
                    {formatMoveAmount(activeStake)} MOVE
                  </p>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3.5 w-3.5 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">
                      Pending Active
                    </span>
                  </div>
                  <p className="text-lg font-semibold font-mono tabular-nums">
                    {formatMoveAmount(pendingActive)} MOVE
                  </p>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-sm text-muted-foreground">
                      Pending Inactive
                    </span>
                  </div>
                  <p className="text-lg font-semibold font-mono tabular-nums">
                    {formatMoveAmount(pendingInactive)} MOVE
                  </p>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-sm text-muted-foreground">
                      Inactive
                    </span>
                  </div>
                  <p className="text-lg font-semibold font-mono tabular-nums">
                    {formatMoveAmount(inactive)} MOVE
                  </p>
                </div>
              </div>
              {stakePoolData?.data?.locked_until_secs && (
                <div className="border-t border-border/30 px-5 py-3 flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    Next Unlock
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3.5 w-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          When tokens will be available for removal from the
                          stake pool
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <TimeDurationIntervalBar
                    timestamp={parseInt(stakePoolData.data.locked_until_secs)}
                  />
                </div>
              )}
            </div>

            {/* TODO: temporarily disabled staking
            <MyDepositsSection validatorAddress={addressHex} />
            <StakeOperationActivities validatorAddress={addressHex} />
            */}
          </>
        )}
      </PageContainer>

      {/* TODO: temporarily disabled staking
      {walletModalOpen && (
        <WalletModal onClose={() => setWalletModalOpen(false)} />
      )}
      <StakeOperationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        operation={StakeOperation.STAKE}
        validatorAddress={addressHex}
      />
      */}
    </>
  );
}

export default function ValidatorDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Overview Card Skeleton */}
          <div className="bg-card backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <EnhancedSkeleton className="w-10 h-10 rounded-full" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <EnhancedSkeleton className="h-6 w-24" />
                    <EnhancedSkeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <EnhancedSkeleton className="h-4 w-48" />
                </div>
              </div>
              <EnhancedSkeleton className="h-8 w-20 rounded-md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/30">
              {Array.from({ length: 3 }).map((_, col) => (
                <div key={col} className="px-5 py-4 space-y-3">
                  <EnhancedSkeleton className="h-3 w-28" />
                  <div className="space-y-2.5">
                    {Array.from({ length: 3 }).map((_, row) => (
                      <div key={row} className="flex items-center justify-between">
                        <EnhancedSkeleton className="h-3 w-20" />
                        <EnhancedSkeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Staking Breakdown Skeleton */}
          <div className="bg-card backdrop-blur-sm rounded-xl border border-border/50">
            <div className="border-b border-border/30 py-4 px-5">
              <EnhancedSkeleton className="h-5 w-40" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/30">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <EnhancedSkeleton className="h-3.5 w-3.5 rounded-full" />
                    <EnhancedSkeleton className="h-3 w-20" />
                  </div>
                  <EnhancedSkeleton className="h-6 w-28 mt-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ValidatorContent />
    </Suspense>
  );
}
