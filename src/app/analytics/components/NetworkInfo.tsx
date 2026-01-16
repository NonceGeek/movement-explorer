"use client";

import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getLedgerInfo } from "@/services";
import { useGetAnalyticsData } from "@/hooks/analytics/useGetAnalyticsData";
import { useGetPeakTPS } from "@/hooks/analytics/useGetTPS";
import MetricCard, { DoubleMetricCard } from "./MetricCard";

function getFormattedTPS(tps: number) {
  const tpsWithDecimal = parseFloat(tps.toFixed(0));
  return tpsWithDecimal.toLocaleString("en-US");
}

export default function NetworkInfo() {
  const { network_value, aptos_client } = useGlobalStore();
  const data = useGetAnalyticsData();
  const { peakTps } = useGetPeakTPS();

  const { data: ledgerData } = useQuery({
    queryKey: ["ledgerInfo", network_value],
    queryFn: () => getLedgerInfo(aptos_client),
    refetchInterval: 10000,
  });

  const ledgerVersion = ledgerData?.ledger_version;

  if (!data) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      <MetricCard
        data={
          ledgerVersion ? parseInt(ledgerVersion).toLocaleString("en-US") : "-"
        }
        label="TOTAL TRANSACTIONS"
        tooltip="Total Transactions on Movement network."
      />
      <DoubleMetricCard
        data1={peakTps ? getFormattedTPS(peakTps) : "-"}
        label1="PEAK LAST 30 DAYS"
        cardLabel="Max TPS"
        tooltip={
          <div>
            <div className="font-bold">Peak Last 30 Days</div>
            <div>
              The highest count of user transactions within any two-block
              interval on a given day, divided by the duration (in seconds) of
              that interval.
            </div>
          </div>
        }
      />
      <MetricCard
        data={
          data.total_accounts?.[0]?.total_accounts?.toLocaleString("en-US") ??
          "-"
        }
        label="TOTAL ACCOUNTS"
        tooltip="Total accounts created on Movement network."
      />
      <MetricCard
        data={
          data.cumulative_deployers?.[0]?.cumulative_contracts_deployed?.toLocaleString(
            "en-US"
          ) ?? "-"
        }
        label="TOTAL DEPLOYED CONTRACTS"
        tooltip="Total move modules deployed on Movement network."
      />
      <MetricCard
        data={
          data.cumulative_deployers?.[0]?.cumulative_contract_deployers?.toLocaleString(
            "en-US"
          ) ?? "-"
        }
        label="TOTAL CONTRACT DEPLOYERS"
        tooltip="Total distinct addresses that have deployed move modules."
      />
    </div>
  );
}
