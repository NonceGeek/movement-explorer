"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGetValidators } from "@/hooks/validators/useGetValidators";
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
} from "lucide-react";
import { MyDepositsSection } from "@/components/staking/MyDepositsSection";

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

  const isLoading = isLoadingStakePool;

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

  const totalStake = activeStake + pendingActive + pendingInactive + inactive;

  // Calculate performance
  const rewardsGrowth = validator?.rewards_growth ?? 0;
  const isActive =
    validator !== undefined && BigInt(validator.voting_power || 0) > 0;

  return (
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
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Stake */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Coins className="h-4 w-4" />
                  <span className="text-sm">Total Stake</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatMoveAmount(totalStake)} MOVE
                </p>
              </CardContent>
            </Card>

            {/* Voting Power */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Voting Power</span>
                </div>
                <p className="text-2xl font-bold">
                  {validator?.voting_power
                    ? formatMoveAmount(BigInt(validator.voting_power))
                    : "0"}{" "}
                  MOVE
                </p>
              </CardContent>
            </Card>

            {/* Rewards Growth */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Rewards Growth</span>
                </div>
                <p className="text-2xl font-bold">
                  {rewardsGrowth.toFixed(2)}%
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

          {/* Detail Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Validator Info */}
            <Card>
              <CardHeader>
                <CardTitle>Validator Information</CardTitle>
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

                {/* Voter Address */}
                {stakePoolData?.data?.delegated_voter && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Voter</span>
                    <Link
                      href={`/account/${stakePoolData.data.delegated_voter}`}
                      className="text-primary hover:underline font-mono text-sm"
                    >
                      {stakePoolData.data.delegated_voter.slice(0, 10)}...
                      {stakePoolData.data.delegated_voter.slice(-8)}
                    </Link>
                  </div>
                )}

                {/* Lock Until */}
                {stakePoolData?.data?.locked_until_secs && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Locked Until</span>
                    <span>
                      {new Date(
                        parseInt(stakePoolData.data.locked_until_secs) * 1000
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
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
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Last Epoch Performance */}
                    <div>
                      <p className="text-muted-foreground text-sm mb-2">
                        Last Epoch Performance
                      </p>
                      <p className="text-xl font-bold">
                        {validator.last_epoch_performance || "-"}
                      </p>
                    </div>

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

                    {/* Rewards Distributed */}
                    <div>
                      <p className="text-muted-foreground text-sm mb-2">
                        Rewards Distributed (APT)
                      </p>
                      <p className="text-xl font-bold">
                        {validator.apt_rewards_distributed?.toFixed(2) || "0"}
                      </p>
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
