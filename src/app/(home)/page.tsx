"use client";

import { useQuery } from "@tanstack/react-query";
import { getLedgerInfo } from "@/services/general";
import { useGlobalStore } from "@/store/useGlobalStore";
import { Zap, Users, FileText, Clock } from "lucide-react";
import { SearchBar } from "@/components/search";
import { StatCard } from "./components/StatCard";
import { LatestUserTransactions } from "./components/LatestUserTransactions";

export default function HomePage() {
  const { aptos_client, network_value } = useGlobalStore();

  // Ledger Info (for stats)
  const { data: ledgerInfo, isLoading: ledgerLoading } = useQuery({
    queryKey: ["ledgerInfo", network_value],
    queryFn: () => getLedgerInfo(aptos_client),
    refetchInterval: 5000,
  });

  // Mock stats - in a real app these would come from an API
  const currentTps = 2450;
  const activeValidators = 104;
  const totalTransactions = ledgerInfo?.ledger_version
    ? parseInt(ledgerInfo.ledger_version)
    : 0;
  const avgBlockTime = "400ms";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Gradient Background */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-moveus-marigold-950/20 via-transparent to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Title */}
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Explore the{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-moveus-marigold-400 to-moveus-marigold-600">
                Movement
              </span>{" "}
              Network
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The next-generation high-performance blockchain explorer powered
              by Move
            </p>

            {/* Search Bar */}
            <div className="pt-4 max-w-2xl mx-auto">
              <SearchBar
                variant="hero"
                placeholder="Search by Address / Txn Hash / Block / Token"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Network Stats */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Current TPS"
            value={currentTps}
            icon={<Zap size={20} className="text-moveus-marigold-500" />}
            isLive={true}
            isLoading={ledgerLoading}
          />
          <StatCard
            label="Active Validators"
            value={activeValidators}
            icon={<Users size={20} className="text-moveus-marigold-500" />}
            badge="Global"
            isLoading={ledgerLoading}
          />
          <StatCard
            label="Total Transactions"
            value={totalTransactions}
            icon={<FileText size={20} className="text-moveus-marigold-500" />}
            change="+5.2k"
            isLoading={ledgerLoading}
          />
          <StatCard
            label="Avg Block Time"
            value={avgBlockTime}
            icon={<Clock size={20} className="text-moveus-marigold-500" />}
            badge="Stable"
            isLoading={ledgerLoading}
          />
        </div>
      </div>

      {/* Latest User Transactions */}
      <div className="container mx-auto px-4 pb-12">
        <LatestUserTransactions limit={10} />
      </div>
    </div>
  );
}
