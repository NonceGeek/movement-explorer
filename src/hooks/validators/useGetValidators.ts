import { useGlobalStore } from "../../store/useGlobalStore";
import { useEffect, useState } from "react";
import { useGetValidatorSet } from "./useGetValidatorSet";
import { standardizeAddress } from "../../utils";

// Removed hardcoded URLs and network logic for now as it was commented out in original source or specific to mainnet/testnet explorer analytics
// Can be re-enabled if valid URLs are provided

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
  const [validatorsRawData, setValidatorsRawData] = useState<ValidatorData[]>(
    []
  );

  useEffect(() => {
    // Original logic had fetches for MAINNET/TESTNET analytics data
    // Currently disabled/mocked as per original file's behavior (most lines commented out)
    // If needed, implement fetch logic here using network_name
    setValidatorsRawData([]);
  }, [network_name]);

  return { validatorsRawData };
}

export function useGetValidators() {
  const { activeValidators } = useGetValidatorSet();
  const { validatorsRawData } = useGetValidatorsRawData();

  const [validators, setValidators] = useState<ValidatorData[]>([]);

  useEffect(() => {
    if (activeValidators.length > 0 && validatorsRawData.length > 0) {
      const validatorsCopy = JSON.parse(JSON.stringify(validatorsRawData));

      validatorsCopy.forEach((validator: ValidatorData) => {
        const activeValidator = activeValidators.find(
          (activeValidator) => activeValidator.addr === validator.owner_address
        );
        validator.voting_power = activeValidator?.voting_power ?? "0";
      });

      setValidators(validatorsCopy);
    }
  }, [activeValidators, validatorsRawData]);

  return { validators };
}
