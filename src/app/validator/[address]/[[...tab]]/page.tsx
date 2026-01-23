"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGetValidators } from "@/hooks/validators/useGetValidators";
import { useGetValidatorSet } from "@/hooks/validators/useGetValidatorSet";
import { useGetStakingRewardsRate } from "@/hooks/validators/useGetStakingRewardsRate";
import { useGetDelegationNodeInfo } from "@/hooks/validators/useGetDelegationNodeInfo";
import { useGetNumberOfDelegators } from "@/hooks/validators/useGetNumberOfDelegators";
import { useGetAccountResource } from "@/hooks/accounts/useGetAccountResource";
import { standardizeAddress } from "@/utils";
import { formatMoveAmount } from "@/utils/transaction";
import {
  CheckCircle2,
  XCircle,
  Users,
  Coins,
  TrendingUp,
  Clock,
  Server,
  Percent,
  Award,
  HelpCircle,
} from "lucide-react";
import { MyDepositsSection } from "../components/MyDepositsSection";
import { TimeDurationIntervalBar } from "../components/TimeDurationIntervalBar";
import { calculateNetworkPercentage, getValidatorStatus } from "../utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const isLoading = isLoadingStakePool || isLoadingDelegationInfo;

  // Find validator in list
  const validator = validators.find((v) => v.owner_address === addressHex);

  const stakePoolData = stakePool as { data: StakePoolData } | undefined;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading validator</p>
            <p className="text-muted-foreground mt-2">{error.message}</p>
          </CardContent>
        </Card>
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

  // Calculate performance
  const rewardsGrowth = validator?.rewards_growth ?? 0;

  // Validator status from chain
  const validatorStatusText = validatorStatusFromChain
    ? getValidatorStatus(Number(validatorStatusFromChain[0]))
    : undefined;

  // Use validator status or fall back to basic active check
  const displayStatus =
    validatorStatusText ||
    (validator && BigInt(validator.voting_power || 0) > 0
      ? "Active"
      : "Inactive");

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "default";
      case "Pending Active":
        return "secondary";
      case "Pending Inactive":
        return "outline";
      case "Inactive":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Network percentage
  const networkPercentage = validator?.voting_power
    ? calculateNetworkPercentage(validator.voting_power, totalVotingPower)
    : "0.00";

  // Rewards earned
  const rewardsEarned = validator?.apt_rewards_distributed ?? 0;

  return (
    <>
      <PageNavigation title="Validator" />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Server className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Validator</h1>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <Badge variant={getStatusVariant(displayStatus)}>
                  {displayStatus}
                </Badge>
              )}
            </div>
            <Link
              href={`/account/${addressHex}`}
              className="text-muted-foreground font-mono text-sm hover:text-primary hover:underline"
            >
              {addressHex}
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Stats Cards - Updated to match source project */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Delegated Stake Amount */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Coins className="h-4 w-4" />
                    <span className="text-sm">Delegated Stake Amount</span>
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
                    {validator?.voting_power
                      ? formatMoveAmount(BigInt(validator.voting_power))
                      : "0"}{" "}
                    MOVE
                  </p>
                </CardContent>
              </Card>

              {/* Of Network */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Percent className="h-4 w-4" />
                    <span className="text-sm">Of Network</span>
                  </div>
                  <p className="text-2xl font-bold">{networkPercentage}%</p>
                </CardContent>
              </Card>

              {/* Rewards Earned So Far */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Award className="h-4 w-4" />
                    <span className="text-sm">Rewards Earned So Far</span>
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
                </CardContent>
              </Card>

              {/* Last Epoch */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Last Active Epoch</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {validator?.last_epoch ?? "-"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detail Cards - Updated structure to match source project */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Validator Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Operator Address */}
                  {stakePoolData?.data?.operator_address && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Operator</span>
                      <Link
                        href={`/account/${stakePoolData.data.operator_address}`}
                        className="text-primary hover:underline font-mono text-sm"
                      >
                        {stakePoolData.data.operator_address.slice(0, 10)}...
                        {stakePoolData.data.operator_address.slice(-8)}
                      </Link>
                    </div>
                  )}

                  {/* Number of Delegators */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">
                        Number of Delegators
                      </span>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Number of owner accounts who have delegated stake to
                            this stake pool + reward account(s)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span>
                      {isLoadingDelegators ? (
                        <Skeleton className="h-4 w-8" />
                      ) : (
                        delegatorBalance
                      )}
                    </span>
                  </div>

                  {/* Compound Rewards */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">
                        Compound Rewards
                      </span>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            The expected APR for staking rewards, compounded
                            daily
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span>{rewardsRateYearly ?? "-"}% APR</span>
                  </div>

                  {/* Operator Commission */}
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">
                        Operator Commission
                      </span>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            % of staking reward paid out to operator as
                            commission
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span>
                      {commission !== undefined ? `${commission}%` : "-"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Right Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Stake Pool Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stake Pool Address */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">
                      Stake Pool Address
                    </span>
                    <Link
                      href={`/account/${addressHex}`}
                      className="text-primary hover:underline font-mono text-sm"
                    >
                      {addressHex.slice(0, 10)}...{addressHex.slice(-8)}
                    </Link>
                  </div>

                  {/* Rewards Performance */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">
                        Rewards Performance
                      </span>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Measures how well a validator has performed compared
                            to the network average
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span>{rewardsGrowth.toFixed(2)}%</span>
                  </div>

                  {/* Last Epoch Performance */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">
                        Last Epoch Performance
                      </span>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Number of successful vs failed proposals in the last
                            epoch
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span>{validator?.last_epoch_performance || "-"}</span>
                  </div>

                  {/* Next Unlock */}
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Next Unlock</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            When tokens will be available for removal from the
                            stake pool
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <TimeDurationIntervalBar
                      timestamp={
                        stakePoolData?.data?.locked_until_secs
                          ? parseInt(stakePoolData.data.locked_until_secs)
                          : undefined
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Staking Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Staking Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Active */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">Active</span>
                    </div>
                    <span className="font-mono">
                      {formatMoveAmount(activeStake)} MOVE
                    </span>
                  </div>

                  {/* Pending Active */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-muted-foreground">
                        Pending Active
                      </span>
                    </div>
                    <span className="font-mono">
                      {formatMoveAmount(pendingActive)} MOVE
                    </span>
                  </div>

                  {/* Pending Inactive */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-muted-foreground">
                        Pending Inactive
                      </span>
                    </div>
                    <span className="font-mono">
                      {formatMoveAmount(pendingInactive)} MOVE
                    </span>
                  </div>

                  {/* Inactive */}
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-muted-foreground">Inactive</span>
                    </div>
                    <span className="font-mono">
                      {formatMoveAmount(inactive)} MOVE
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Performance */}
              {validator && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {/* Liveness */}
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">
                          Liveness
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(validator.liveness || 0) * 100}
                            className="flex-1"
                          />
                          <span className="text-sm font-mono">
                            {((validator.liveness || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* My Deposits Section */}
            <MyDepositsSection validatorAddress={addressHex} />
          </>
        )}
      </div>
    </>
  );
}

export default function ValidatorDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      }
    >
      <ValidatorContent />
    </Suspense>
  );
}
