"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
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
import { Shield, Users, Coins, TrendingUp } from "lucide-react";
import Link from "next/link";
import { truncateAddress } from "@/utils";

interface ValidatorInfo {
  addr: string;
  voting_power: string;
  config?: {
    validator_index: string;
    consensus_pubkey: string;
    fullnode_addresses: string;
    network_addresses: string;
  };
}

export default function ValidatorsPage() {
  const { aptos_client, sdk_v2_client } = useGlobalStore();

  // Fetch validator set
  const { data: validatorSet, isLoading: isLoadingValidators } = useQuery({
    queryKey: ["validatorSet"],
    queryFn: async () => {
      try {
        const resource = await aptos_client.getAccountResource(
          "0x1",
          "0x1::stake::ValidatorSet"
        );
        return resource.data as {
          active_validators: ValidatorInfo[];
          pending_active: ValidatorInfo[];
          pending_inactive: ValidatorInfo[];
          total_voting_power: string;
          total_joining_power: string;
        };
      } catch (error) {
        console.error("Failed to fetch validator set:", error);
        return null;
      }
    },
  });

  // Fetch ledger info
  const { data: ledgerInfo, isLoading: isLoadingLedger } = useQuery({
    queryKey: ["ledgerInfo"],
    queryFn: () => sdk_v2_client.getLedgerInfo(),
  });

  const isLoading = isLoadingValidators || isLoadingLedger;
  const activeValidators = validatorSet?.active_validators ?? [];
  const totalStake = validatorSet?.total_voting_power
    ? (
        BigInt(validatorSet.total_voting_power) / BigInt(10 ** 8)
      ).toLocaleString()
    : "-";

  const stats = [
    {
      title: "Active Validators",
      value: activeValidators.length.toString(),
      icon: Shield,
      description: "Currently active validators",
    },
    {
      title: "Total Stake",
      value: `${totalStake} MOVE`,
      icon: Coins,
      description: "Total staked across all validators",
    },
    {
      title: "Current Epoch",
      value: ledgerInfo?.epoch?.toLocaleString() ?? "-",
      icon: TrendingUp,
      description: "Current network epoch",
    },
    {
      title: "Pending Validators",
      value: (
        (validatorSet?.pending_active?.length ?? 0) +
        (validatorSet?.pending_inactive?.length ?? 0)
      ).toString(),
      icon: Users,
      description: "Validators in transition",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Validators</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Validators Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Validators</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : activeValidators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active validators found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Voting Power</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeValidators
                    .sort((a, b) =>
                      Number(BigInt(b.voting_power) - BigInt(a.voting_power))
                    )
                    .map((validator, index) => {
                      const votingPower =
                        BigInt(validator.voting_power) / BigInt(10 ** 8);
                      const totalPower = validatorSet?.total_voting_power
                        ? BigInt(validatorSet.total_voting_power)
                        : BigInt(1);
                      const share =
                        (Number(BigInt(validator.voting_power)) /
                          Number(totalPower)) *
                        100;

                      return (
                        <TableRow key={validator.addr}>
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/account/${validator.addr}`}
                              className="text-primary hover:underline font-mono"
                            >
                              {truncateAddress(validator.addr)}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {votingPower.toLocaleString()} MOVE
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
