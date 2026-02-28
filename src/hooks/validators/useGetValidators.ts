import { useGlobalStore } from "../../store/useGlobalStore";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetValidatorSet } from "./useGetValidatorSet";
import {
  MAINNET_EPOCH_STATS_URL,
  TESTNET_EPOCH_STATS_URL,
} from "../../constants";

export interface ValidatorData {
  owner_address: string;
  operator_address: string;
  voting_power: string;
  governance_voting_record: string;
  last_epoch: number;
  last_epoch_performance: string;
  liveness: number;
  rewards_growth: number;
  location_stats?: GeoData;
  apt_rewards_distributed: number;
}

export interface GeoData {
  peer_id: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  region: string;
  epoch: number;
}

function useGetValidatorsRawData() {
  const { network_name } = useGlobalStore();

  const urls: Record<string, string | null> = {
    mainnet: MAINNET_EPOCH_STATS_URL,
    "bardock testnet": null,
    testnet: TESTNET_EPOCH_STATS_URL,
    devnet: null,
    local: null,
    mevmdevnet: null,
    custom: null,
  };

  const url = urls[network_name];

  return useQuery<ValidatorData[]>({
    queryKey: ["validatorsRawData", network_name],
    queryFn: async () => {
      const response = await fetch(url!);
      const data: ValidatorData[] = await response.json();
      // Normalize null values from JSON to match interface defaults
      return data.map((v) => ({
        owner_address: v.owner_address,
        operator_address: v.operator_address,
        voting_power: v.voting_power ?? "0",
        governance_voting_record: v.governance_voting_record ?? "",
        last_epoch: v.last_epoch ?? 0,
        last_epoch_performance: v.last_epoch_performance ?? "",
        liveness: v.liveness ?? 0,
        rewards_growth: v.rewards_growth ?? 0,
        location_stats: v.location_stats ?? undefined,
        apt_rewards_distributed: v.apt_rewards_distributed ?? 0,
      }));
    },
    enabled: !!url,
  });
}

export function useGetValidators() {
  const { aptos_client } = useGlobalStore();
  const { activeValidators } = useGetValidatorSet();
  const { data: validatorsRawData = [], fetchStatus } =
    useGetValidatorsRawData();

  const [validators, setValidators] = useState<ValidatorData[]>([]);
  const [hasJsonStats, setHasJsonStats] = useState<boolean>(false);

  useEffect(() => {
    // Wait for raw data query to settle before proceeding
    if (fetchStatus === "fetching") return;

    if (activeValidators.length > 0 && validatorsRawData.length > 0) {
      // If we have JSON stats data, merge it with active validators
      const validatorsCopy = JSON.parse(JSON.stringify(validatorsRawData));

      validatorsCopy.forEach((validator: ValidatorData) => {
        const activeValidator = activeValidators.find(
          (activeValidator) => activeValidator.addr === validator.owner_address
        );
        validator.voting_power = activeValidator?.voting_power ?? "0";
      });

      setValidators(validatorsCopy);
      setHasJsonStats(true);
    } else if (activeValidators.length > 0) {
      // Fallback: use active validators directly when JSON stats are not available
      // Fetch operator addresses from StakePool resources
      const fetchOperatorAddresses = async () => {
        const validatorsWithOperators: ValidatorData[] = await Promise.all(
          activeValidators.map(async (v) => {
            let operatorAddress = v.addr; // Default to owner address
            try {
              const response = await aptos_client.getAccountResource(
                v.addr,
                "0x1::stake::StakePool"
              );
              if (response?.data) {
                const data = response.data as { operator_address: string };
                operatorAddress = data.operator_address;
              }
            } catch (e) {
              // If fetch fails, use owner address as fallback
              console.warn(`Failed to fetch StakePool for ${v.addr}:`, e);
            }
            return {
              owner_address: v.addr,
              operator_address: operatorAddress,
              voting_power: v.voting_power,
              governance_voting_record: "",
              last_epoch: 0,
              last_epoch_performance: "",
              liveness: 0,
              rewards_growth: 0,
              apt_rewards_distributed: 0,
            };
          })
        );
        setValidators(validatorsWithOperators);
      };

      fetchOperatorAddresses();
      setHasJsonStats(false);
    }
  }, [activeValidators, validatorsRawData, fetchStatus, aptos_client]);

  return { validators, hasJsonStats };
}
