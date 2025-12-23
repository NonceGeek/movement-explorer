"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Users,
  Activity,
  TrendingUp,
  Layers,
  Code,
} from "lucide-react";

interface AnalyticsData {
  daily_user_transactions?: Array<{ date: string; value: number }>;
  daily_active_users?: Array<{ date: string; value: number }>;
  daily_max_tps?: Array<{ date: string; value: number }>;
  daily_new_accounts?: Array<{ date: string; value: number }>;
  daily_deployed_contracts?: Array<{ date: string; value: number }>;
}

export default function AnalyticsPage() {
  const { sdk_v2_client } = useGlobalStore();

  // Fetch ledger info for some basic stats
  const { data: ledgerInfo, isLoading } = useQuery({
    queryKey: ["ledgerInfo"],
    queryFn: () => sdk_v2_client.getLedgerInfo(),
  });

  const stats = [
    {
      title: "Ledger Version",
      value: ledgerInfo?.ledger_version?.toLocaleString() ?? "-",
      icon: Layers,
      description: "Current ledger version",
    },
    {
      title: "Block Height",
      value: ledgerInfo?.block_height?.toLocaleString() ?? "-",
      icon: BarChart3,
      description: "Latest block height",
    },
    {
      title: "Epoch",
      value: ledgerInfo?.epoch?.toLocaleString() ?? "-",
      icon: Activity,
      description: "Current epoch",
    },
    {
      title: "Chain ID",
      value: ledgerInfo?.chain_id?.toString() ?? "-",
      icon: TrendingUp,
      description: "Network chain ID",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Network Analytics</h1>

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

      {/* Placeholder for Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Charts Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-2">
              Detailed analytics charts including daily transactions, active
              users, TPS metrics, and gas consumption will be available here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
