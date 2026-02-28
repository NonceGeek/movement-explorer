import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "../../store/useGlobalStore";
import {
  ANALYTICS_DATA_URL,
  TESTNET_ANALYTICS_DATA_URL,
  BARDOCK_ANALYTICS_DATA_URL,
} from "../../constants";

export type AnalyticsData = {
  daily_active_users: DailyActiveUserData[];
  daily_average_gas_unit_price: DailyAvgGasData[];
  daily_gas_from_user_transactions: DailyGasCostData[];
  daily_contract_deployers: DailyContractDeployerData[];
  daily_deployed_contracts: DailyContractData[];
  daily_max_tps_15_blocks: DailyPeakTPSData[];
  daily_new_accounts_created: DailyNewAccountData[];
  daily_user_transactions: DailyUserTxnData[];
  mau_signers: MonthlyActiveUserData[];
  max_tps_15_blocks_in_past_30_days: {
    max_tps_15_blocks_in_past_30_days: number;
  }[];
  cumulative_deployers: TotalDeployers[];
  total_accounts: TotalAccounts[];
  latest_node_count: NodeCountData[];
};

export type DailyAnalyticsData =
  | DailyActiveUserData
  | DailyAvgGasData
  | DailyGasCostData
  | DailyContractDeployerData
  | DailyContractData
  | DailyPeakTPSData
  | DailyNewAccountData
  | DailyUserTxnData
  | MonthlyActiveUserData;

export type DailyActiveUserData = {
  daily_active_user_count: number;
  date: string;
};

export type DailyAvgGasData = {
  avg_gas_unit_price: string;
  date: string;
};

export type DailyGasCostData = {
  gas_cost: string;
  date: string;
};

export type DailyContractDeployerData = {
  distinct_deployers: number;
  date: string;
};

export type DailyContractData = {
  daily_contract_deployed: number;
  date: string;
};

export type DailyPeakTPSData = {
  max_tps_15_blocks: number;
  date: string;
};

export type DailyNewAccountData = {
  new_account_count: number;
  date: string;
};

export type DailyUserTxnData = {
  num_user_transactions: number;
  date: string;
};

export type MonthlyActiveUserData = {
  mau_signer_30: number;
  date: string;
};

export type TotalDeployers = {
  cumulative_contract_deployers: number;
  cumulative_contracts_deployed: number;
};

export type TotalAccounts = {
  total_accounts: number;
};

export type NodeCountData = {
  date: string;
  approx_nodes: number;
};

export function useGetAnalyticsData() {
  const { network_name } = useGlobalStore();

  const urls: Record<string, string | null> = {
    "bardock testnet": BARDOCK_ANALYTICS_DATA_URL,
    testnet: TESTNET_ANALYTICS_DATA_URL,
    mainnet: ANALYTICS_DATA_URL,
    devnet: null,
    local: null,
    mevmdevnet: null,
    custom: null,
  };
  const url = urls[network_name];

  const { data } = useQuery<AnalyticsData>({
    queryKey: ["analyticsData", network_name],
    queryFn: async () => {
      const response = await fetch(url!);
      return response.json();
    },
    enabled: !!url,
  });

  return data;
}
