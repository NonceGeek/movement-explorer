import { Types } from "aptos";

interface AccountResourceData {
  locked_until_secs: bigint;
}

// Returns seconds till locked staking funds getting unlocked
export function getLockedUtilSecs(
  accountResource?: Types.MoveResource | undefined,
): bigint | null {
  return accountResource
    ? BigInt((accountResource.data as AccountResourceData).locked_until_secs)
    : null;
}

export type ValidatorStatus =
  | "Pending Active"
  | "Active"
  | "Pending Inactive"
  | "Inactive";

export function getValidatorStatus(
  validatorStatus: number,
): ValidatorStatus | undefined {
  switch (validatorStatus) {
    case 1:
      return "Pending Active";
    case 2:
      return "Active";
    case 3:
      return "Pending Inactive";
    case 4:
      return "Inactive";
    default:
      return undefined;
  }
}

export function calculateNetworkPercentage(
  validatorVotingPower: string,
  totalVotingPower: string | null,
): string {
  if (!totalVotingPower || totalVotingPower === "0") return "0.00";
  return (
    (parseInt(validatorVotingPower, 10) / parseInt(totalVotingPower, 10)) *
    100
  ).toFixed(2);
}
