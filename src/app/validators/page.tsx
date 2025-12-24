"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useGlobalStore } from "@/store/useGlobalStore";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import Link from "next/link";
import { truncateAddress } from "@/utils";
import { useGetValidators } from "@/hooks/validators/useGetValidators";
import { useGetValidatorSet } from "@/hooks/validators/useGetValidatorSet";
import { useGetEpochTime } from "@/hooks/validators/useGetEpochTime";
import { useGetStakingRewardsRate } from "@/hooks/validators/useGetStakingRewardsRate";
import { StakingPromo } from "@/components/validators/StakingPromo";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

export default function ValidatorsPage() {
  const { validators } = useGetValidators();
  const { totalVotingPower, numberOfActiveValidators } = useGetValidatorSet();
  const { curEpoch, lastEpochTime, epochInterval } = useGetEpochTime();
  const { rewardsRateYearly } = useGetStakingRewardsRate();

  // Epoch progress state
  const [epochProgress, setEpochProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState("");

  // Calculate epoch progress from real data
  useEffect(() => {
    if (lastEpochTime && epochInterval) {
      const epochIntervalMs = parseInt(epochInterval) / 1000; // microseconds to ms
      const lastReconfig = parseInt(lastEpochTime) / 1000; // microseconds to ms
      const now = Date.now();
      const timePassed = now - lastReconfig;

      // Calculate percentage complete
      const percentComplete = Math.min(
        100,
        Math.floor((timePassed / epochIntervalMs) * 100)
      );
      setEpochProgress(percentComplete);

      // Calculate time remaining
      const remaining = Math.max(0, epochIntervalMs - timePassed);
      const remainingSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }
  }, [lastEpochTime, epochInterval, curEpoch]);

  // Update time remaining every second
  useEffect(() => {
    if (!lastEpochTime || !epochInterval) return;

    const interval = setInterval(() => {
      const epochIntervalMs = parseInt(epochInterval) / 1000;
      const lastReconfig = parseInt(lastEpochTime) / 1000;
      const now = Date.now();
      const timePassed = now - lastReconfig;

      const percentComplete = Math.min(
        100,
        Math.floor((timePassed / epochIntervalMs) * 100)
      );
      setEpochProgress(percentComplete);

      const remaining = Math.max(0, epochIntervalMs - timePassed);
      const remainingSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastEpochTime, epochInterval]);

  const isLoading =
    validators.length === 0 && numberOfActiveValidators === null;

  // Calculate total stake
  const totalStake = totalVotingPower
    ? (BigInt(totalVotingPower) / BigInt(10 ** 8)).toLocaleString("en-US")
    : "-";

  // Sort validators by voting power
  const sortedValidators = [...validators].sort((a, b) =>
    Number(BigInt(b.voting_power) - BigInt(a.voting_power))
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Validators</h1>

      {/* Staking Promo Banner */}
      <StakingPromo />

      {/* Stats Grid - 3 Cards like source project */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* 1. Nodes */}
        <Card className="h-[120px]">
          <CardContent className="pt-6 flex flex-col justify-center h-full">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {numberOfActiveValidators} Nodes
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Epoch with Progress */}
        <Card className="h-[120px]">
          <CardContent className="pt-4 flex flex-col justify-center h-full space-y-2">
            {!curEpoch ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">
                    Epoch {Number(curEpoch).toLocaleString("en-US")}
                  </span>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-sm text-muted-foreground">
                  {epochProgress}% complete
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={epochProgress} className="h-2 flex-1" />
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                    {timeRemaining || "calculating..."}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 3. Staking */}
        <Card className="h-[120px]">
          <CardContent className="pt-6 flex flex-col justify-center h-full space-y-1">
            {isLoading ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <>
                <div className="text-xl font-bold">
                  {totalStake} MOVE Staked
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{rewardsRateYearly ?? "-"}% APR Reward</span>
                  <Info className="h-4 w-4" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delegation Validators Table */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Delegation Validators</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sortedValidators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No validators found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Staking Pool Address</TableHead>
                    <TableHead>Operator Address</TableHead>
                    <TableHead className="text-right">
                      Delegated Amount
                    </TableHead>
                    <TableHead className="text-right">Network %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedValidators.map((validator, index) => {
                    const votingPower =
                      BigInt(validator.voting_power) / BigInt(10 ** 8);
                    const totalPower = totalVotingPower
                      ? BigInt(totalVotingPower)
                      : BigInt(1);
                    const share =
                      totalVotingPower && BigInt(totalVotingPower) > 0
                        ? (Number(BigInt(validator.voting_power)) /
                            Number(totalPower)) *
                          100
                        : 0;

                    return (
                      <TableRow
                        key={validator.owner_address}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          (window.location.href = `/validator/${validator.owner_address}`)
                        }
                      >
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/account/${validator.owner_address}`}
                            className="text-primary hover:underline font-mono"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {truncateAddress(validator.owner_address)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/account/${validator.operator_address}`}
                            className="text-primary hover:underline font-mono"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {truncateAddress(validator.operator_address)}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {votingPower.toLocaleString("en-US")} MOVE
                        </TableCell>
                        <TableCell className="text-right">
                          {share.toFixed(2)}%
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-green-500/10 text-green-600 border-green-500/20"
                          >
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
