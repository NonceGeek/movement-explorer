import { useGlobalStore } from "../../store/useGlobalStore";
import { useEffect, useState } from "react";
import { useGetAccountResource } from "../accounts/useGetAccountResource";
import { standardizeAddress } from "../../utils";

interface ValidatorSetData {
  active_validators: Validator[];
  total_voting_power: string;
}

export interface Validator {
  addr: string;
  config: {
    consensus_pubkey: string;
    fullnode_addresses: string;
    network_addresses: string;
    validator_index: string;
  };
  voting_power: string;
}

export function useGetValidatorSet() {
  const { network_value } = useGlobalStore();
  const [totalVotingPower, setTotalVotingPower] = useState<string | null>(null);
  const [numberOfActiveValidators, setNumberOfActiveValidators] = useState<
    number | null
  >(null);
  const [activeValidators, setActiveValidators] = useState<Validator[]>([]);

  const { data: validatorSet } = useGetAccountResource(
    "0x1",
    "0x1::stake::ValidatorSet"
  );

  useEffect(() => {
    // Check if data exists and matches expected shape
    if (validatorSet && "active_validators" in validatorSet) {
      // Need to cast to ValidatorSetData because Types.MoveResource is generic
      const data = validatorSet as unknown as ValidatorSetData;
      setTotalVotingPower(data.total_voting_power);
      setNumberOfActiveValidators(data.active_validators.length);
      setActiveValidators(
        data.active_validators.map((validator) => {
          const processedAddr = standardizeAddress(validator.addr);
          return {
            ...validator,
            addr: processedAddr,
          };
        })
      );
    }
  }, [validatorSet, network_value]);

  return { totalVotingPower, numberOfActiveValidators, activeValidators };
}
