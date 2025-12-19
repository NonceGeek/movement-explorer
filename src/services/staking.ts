import { AptosClient, Types } from "aptos";
import { withResponseError } from "../utils/api-client";
import { OCTA } from "../constants";

export async function getStake(
  client: AptosClient,
  delegatorAddress: Types.Address,
  validatorAddress: Types.Address
): Promise<Types.MoveValue[]> {
  const payload: Types.ViewRequest = {
    function: "0x1::delegation_pool::get_stake",
    type_arguments: [],
    arguments: [validatorAddress, delegatorAddress],
  };
  return withResponseError(client.view(payload));
}

export async function getValidatorCommission(
  client: AptosClient,
  validatorAddress: Types.Address
): Promise<Types.MoveValue[]> {
  const payload: Types.ViewRequest = {
    function: "0x1::delegation_pool::operator_commission_percentage",
    type_arguments: [],
    arguments: [validatorAddress],
  };
  return withResponseError(client.view(payload));
}

export async function getValidatorCommissionChange(
  client: AptosClient,
  validatorAddress: Types.Address
): Promise<Types.MoveValue[]> {
  const payload: Types.ViewRequest = {
    function:
      "0x1::delegation_pool::operator_commission_percentage_next_lockup_cycle",
    type_arguments: [],
    arguments: [validatorAddress],
  };
  return withResponseError(client.view(payload));
}

// Return whether `pending_inactive` stake can be directly withdrawn from the delegation pool,
// for the edge case when the validator had gone inactive before its lockup expired.
export async function getCanWithdrawPendingInactive(
  client: AptosClient,
  validatorAddress: Types.Address
): Promise<Types.MoveValue[]> {
  const payload: Types.ViewRequest = {
    function: "0x1::delegation_pool::can_withdraw_pending_inactive",
    type_arguments: [],
    arguments: [validatorAddress],
  };
  return withResponseError(client.view(payload));
}

export async function getAddStakeFee(
  client: AptosClient,
  validatorAddress: Types.Address,
  amount: string
): Promise<Types.MoveValue[]> {
  const payload: Types.ViewRequest = {
    function: "0x1::delegation_pool::get_add_stake_fee",
    type_arguments: [],
    arguments: [validatorAddress, (Number(amount) * OCTA).toString()],
  };
  return withResponseError(client.view(payload));
}

export async function getValidatorState(
  client: AptosClient,
  validatorAddress: Types.Address
): Promise<Types.MoveValue[]> {
  const payload: Types.ViewRequest = {
    function: "0x1::stake::get_validator_state",
    type_arguments: [],
    arguments: [validatorAddress],
  };
  return withResponseError(client.view(payload));
}

export async function getValidatorCommissionAndState(
  client: AptosClient,
  validatorAddresses: Types.Address[]
): Promise<Types.MoveValue[]> {
  const payload: Types.ViewRequest = {
    function:
      "0x7a5c34e80f796fe58c336812f80e15a86a2086c75640270a11207b911d512aba::helpers::pool_address_info",
    type_arguments: [],
    arguments: [validatorAddresses],
  };
  return withResponseError(client.view(payload));
}
