/**
 * Human-readable descriptions for known contract functions
 * Format: "address::module::function" -> "Short Description"
 *
 * Guidelines:
 * - Keep descriptions to 1-2 words
 * - Use action verbs (Swap, Stake, Claim, etc.)
 * - Be consistent across similar functions
 */

// Meridian AMM
const MERIDIAN_AMM = "0xfbdb3da73efcfa742d542f152d65fc6da7b55dee864cd66475213e4be18c9d54";

// Meridian Farming
const MERIDIAN_FARMING = "0xf1fc2bc72b9eeaa3cc80239d5c00e49ebab0b2c8a5b55227ce47644b3275ff96";

// Meridian CLAMM
const MERIDIAN_CLAMM = "0x88def51006db6ae8f90051a1531d1b43877eeb233f4c0d99dcb24f49cd27ad5b";

// Meridian CLAMM Farming
const MERIDIAN_CLAMM_FARMING = "0x4c5da52eaa510af14e93e7b16dddf3c5d6a9b3f847d18dc8e7499fc71a5a0a24";

// MovePosition Core
const MOVEPOSITION_CORE = "0xccd2621d2897d407e06d18e6ebe3be0e6d9b61f1e809dd49360522b9105812cf";

// Echelon
const ECHELON = "0x6a01d5761d43a5b5a0ccbfc42edf2d02c0611464aae99a2ea0e0d4819f0550b5";

// Yuzu
const YUZU = "0x46566b4a16a1261ab400ab5b9067de84ba152b5eb4016b217187f2a2ca980c5a";

// Mosaic Aggregator
const MOSAIC_AGGREGATOR = "0x03f7399a0d3d646ce94ee0badf16c4c3f3c656fe3a5e142e83b5ebc011aa8b3d";

// Mosaic AMM
const MOSAIC_AMM = "0x26a95d4bd7d7fc3debf6469ff94837e03e887088bef3a3f2d08d1131141830d3";

export const CONTRACT_FUNCTION_DESCRIPTIONS: Record<string, string> = {
  // ============================================
  // MERIDIAN AMM
  // ============================================
  [`${MERIDIAN_AMM}::pool::add_liquidity_metastable_entry`]: "Add Liquidity",
  [`${MERIDIAN_AMM}::pool::add_liquidity_stable_entry`]: "Add Liquidity",
  [`${MERIDIAN_AMM}::pool::add_liquidity_weighted_entry`]: "Add Liquidity",
  [`${MERIDIAN_AMM}::pool::create_oracle`]: "Create Oracle",
  [`${MERIDIAN_AMM}::pool::create_pool_metastable_entry`]: "Create Pool",
  [`${MERIDIAN_AMM}::pool::create_pool_stable_entry`]: "Create Pool",
  [`${MERIDIAN_AMM}::pool::create_pool_weighted_entry`]: "Create Pool",
  [`${MERIDIAN_AMM}::pool::enable_rate_limit_feature`]: "Enable Rate Limit",
  [`${MERIDIAN_AMM}::pool::init_pause_flag`]: "Init Pause",
  [`${MERIDIAN_AMM}::pool::remove_liquidity_entry`]: "Remove Liquidity",
  [`${MERIDIAN_AMM}::pool::remove_oracle`]: "Remove Oracle",
  [`${MERIDIAN_AMM}::pool::set_asset_rate_limit`]: "Set Rate Limit",
  [`${MERIDIAN_AMM}::pool::set_flashloan_fee_bps`]: "Set Flash Fee",
  [`${MERIDIAN_AMM}::pool::set_pause_flashloan`]: "Pause Flashloan",
  [`${MERIDIAN_AMM}::pool::set_pause_liquidity`]: "Pause Liquidity",
  [`${MERIDIAN_AMM}::pool::set_pause_meridian_amm`]: "Pause AMM",
  [`${MERIDIAN_AMM}::pool::set_pause_pool_add_liquidity`]: "Pause Add",
  [`${MERIDIAN_AMM}::pool::set_pause_pool_flashloan`]: "Pause Flash",
  [`${MERIDIAN_AMM}::pool::set_pause_pool_remove_liquidity`]: "Pause Remove",
  [`${MERIDIAN_AMM}::pool::set_pause_pool_swap`]: "Pause Swap",
  [`${MERIDIAN_AMM}::pool::set_pause_swap`]: "Pause Swap",
  [`${MERIDIAN_AMM}::pool::set_stable_pool_amp_factor`]: "Set Amp Factor",
  [`${MERIDIAN_AMM}::pool::set_swap_fee_multipliers`]: "Set Swap Fee",
  [`${MERIDIAN_AMM}::pool::set_swap_fee_protocol_allocation_bps`]: "Set Protocol Fee",
  [`${MERIDIAN_AMM}::pool::swap_exact_in_metastable_entry`]: "Swap",
  [`${MERIDIAN_AMM}::pool::swap_exact_in_stable_entry`]: "Swap",
  [`${MERIDIAN_AMM}::pool::swap_exact_in_weighted_entry`]: "Swap",
  [`${MERIDIAN_AMM}::pool::swap_exact_out_metastable_entry`]: "Swap",
  [`${MERIDIAN_AMM}::pool::swap_exact_out_stable_entry`]: "Swap",
  [`${MERIDIAN_AMM}::pool::swap_exact_out_weighted_entry`]: "Swap",
  [`${MERIDIAN_AMM}::pool::update_rate_limit_whitelist_users`]: "Update Whitelist",
  [`${MERIDIAN_AMM}::pool::update_twap_oracle`]: "Update Oracle",

  // ============================================
  // MERIDIAN FARMING
  // ============================================
  [`${MERIDIAN_FARMING}::farming::add_pool`]: "Add Pool",
  [`${MERIDIAN_FARMING}::farming::enable_rate_limit_feature`]: "Enable Rate Limit",
  [`${MERIDIAN_FARMING}::farming::init`]: "Initialize",
  [`${MERIDIAN_FARMING}::farming::init_pause_flag`]: "Init Pause",
  [`${MERIDIAN_FARMING}::farming::initialize_boosted_farming`]: "Init Boost Farm",
  [`${MERIDIAN_FARMING}::farming::initialize_farming_v2`]: "Init Farm V2",
  [`${MERIDIAN_FARMING}::farming::initialize_vemeridian_gated_farming`]: "Init Gated Farm",
  [`${MERIDIAN_FARMING}::farming::new_meridian_epoch`]: "New Epoch",
  [`${MERIDIAN_FARMING}::farming::set_boost_scaling_factor_bps`]: "Set Boost Factor",
  [`${MERIDIAN_FARMING}::farming::set_coin_rate_limit`]: "Set Rate Limit",
  [`${MERIDIAN_FARMING}::farming::set_max_boost_multiplier_bps`]: "Set Max Boost",
  [`${MERIDIAN_FARMING}::farming::set_pause`]: "Pause",
  [`${MERIDIAN_FARMING}::farming::set_rate_limit_window_duration`]: "Set Rate Window",
  [`${MERIDIAN_FARMING}::farming::set_v2_only_mode`]: "Set V2 Mode",
  [`${MERIDIAN_FARMING}::farming::set_vemeridian_gated_farming_exempt_pools`]: "Set Exempt Pools",
  [`${MERIDIAN_FARMING}::farming::set_vemeridian_gated_farming_threshold_bps`]: "Set Gate Threshold",
  [`${MERIDIAN_FARMING}::farming::update_extra_reward`]: "Update Reward",
  [`${MERIDIAN_FARMING}::farming::update_meridian_reward`]: "Update Reward",
  [`${MERIDIAN_FARMING}::scripts::claim`]: "Claim",
  [`${MERIDIAN_FARMING}::scripts::claim_all_meridian`]: "Claim All",
  [`${MERIDIAN_FARMING}::scripts::stake`]: "Stake",
  [`${MERIDIAN_FARMING}::scripts::unstake`]: "Unstake",
  [`${MERIDIAN_FARMING}::package::publish_package`]: "Deploy",

  // ============================================
  // MERIDIAN CLAMM
  // ============================================
  [`${MERIDIAN_CLAMM}::fees::transfer_fee`]: "Transfer Fee",
  [`${MERIDIAN_CLAMM}::fees::transfer_fees`]: "Transfer Fees",
  [`${MERIDIAN_CLAMM}::pool::approve_remove_liquidity_request`]: "Approve Withdraw",
  [`${MERIDIAN_CLAMM}::pool::batch_approve_remove_liquidity_request`]: "Batch Approve",
  [`${MERIDIAN_CLAMM}::pool::batch_reject_remove_liquidity_request`]: "Batch Reject",
  [`${MERIDIAN_CLAMM}::pool::cancel_remove_liquidity_request`]: "Cancel Withdraw",
  [`${MERIDIAN_CLAMM}::pool::reject_remove_liquidity_request`]: "Reject Withdraw",
  [`${MERIDIAN_CLAMM}::pool::set_asset_remove_liquidity_rate_limit`]: "Set Withdraw Limit",
  [`${MERIDIAN_CLAMM}::pool::set_collect_fees_rate_limit`]: "Set Fee Limit",
  [`${MERIDIAN_CLAMM}::pool::set_pause_flashloan`]: "Pause Flashloan",
  [`${MERIDIAN_CLAMM}::pool::set_pause_liquidity`]: "Pause Liquidity",
  [`${MERIDIAN_CLAMM}::pool::set_pause_swap`]: "Pause Swap",
  [`${MERIDIAN_CLAMM}::pool::set_pool_collection_description`]: "Set Description",
  [`${MERIDIAN_CLAMM}::pool::set_pool_collection_name`]: "Set Name",
  [`${MERIDIAN_CLAMM}::pool::set_pool_collection_uri`]: "Set URI",
  [`${MERIDIAN_CLAMM}::pool::set_swap_fee_multipliers`]: "Set Swap Fee",
  [`${MERIDIAN_CLAMM}::pool::set_swap_fee_protocol_allocation_bps`]: "Set Protocol Fee",
  [`${MERIDIAN_CLAMM}::pool::update_rate_limit_exempt_addresses`]: "Update Exempt",
  [`${MERIDIAN_CLAMM}::pool::update_whitelisted_lps`]: "Update Whitelist",

  // ============================================
  // MERIDIAN CLAMM FARMING
  // ============================================
  [`${MERIDIAN_CLAMM_FARMING}::farming::withdraw`]: "Withdraw",
  [`${MERIDIAN_CLAMM_FARMING}::farming::cancel_incentive`]: "Cancel Incentive",
  [`${MERIDIAN_CLAMM_FARMING}::farming::claim_reward_entry`]: "Claim Reward",
  [`${MERIDIAN_CLAMM_FARMING}::farming::claim_token_reward_entry`]: "Claim Token",
  [`${MERIDIAN_CLAMM_FARMING}::farming::create_incentive_entry`]: "Create Incentive",
  [`${MERIDIAN_CLAMM_FARMING}::farming::end_incentive_entry`]: "End Incentive",
  [`${MERIDIAN_CLAMM_FARMING}::farming::migrate_incentive`]: "Migrate Incentive",
  [`${MERIDIAN_CLAMM_FARMING}::farming::restake_batch_tokens_to_new_incentive`]: "Restake Batch",
  [`${MERIDIAN_CLAMM_FARMING}::farming::stake_entry`]: "Stake",
  [`${MERIDIAN_CLAMM_FARMING}::farming::stake_token_to_all_viable_incentives`]: "Stake All",
  [`${MERIDIAN_CLAMM_FARMING}::farming::unstake`]: "Unstake",
  [`${MERIDIAN_CLAMM_FARMING}::farming::unstake_all_tokens_from_incentive`]: "Unstake All",
  [`${MERIDIAN_CLAMM_FARMING}::farming::unstake_batch_tokens_from_incentive`]: "Unstake Batch",
  [`${MERIDIAN_CLAMM_FARMING}::farming::unstake_then_withdraw`]: "Unstake & Withdraw",
  [`${MERIDIAN_CLAMM_FARMING}::farming::unstake_token_from_all_viable_incentives`]: "Unstake All",
  [`${MERIDIAN_CLAMM_FARMING}::farming::unstake_tokens_from_incentive_entry`]: "Unstake",
  [`${MERIDIAN_CLAMM_FARMING}::package::publish_package`]: "Deploy",

  // ============================================
  // MOVEPOSITION
  // ============================================
  [`${MOVEPOSITION_CORE}::map::add`]: "Add",
  [`${MOVEPOSITION_CORE}::map::remove`]: "Remove",
  [`${MOVEPOSITION_CORE}::admin_api::add_signer`]: "Add Signer",
  [`${MOVEPOSITION_CORE}::admin_api::remove_signer`]: "Remove Signer",

  // ============================================
  // ECHELON
  // ============================================
  [`${ECHELON}::farming::init_alloc_point`]: "Init Allocation",
  [`${ECHELON}::farming::new_epoch`]: "New Epoch",
  [`${ECHELON}::farming::new_epoch_fa`]: "New Epoch",
  [`${ECHELON}::farming::new_pool`]: "New Pool",
  [`${ECHELON}::farming::new_reward`]: "New Reward",
  [`${ECHELON}::farming::new_reward_fa`]: "New Reward",
  [`${ECHELON}::farming::update_alloc_point`]: "Update Allocation",
  [`${ECHELON}::lending::clear_bad_debt`]: "Clear Debt",
  [`${ECHELON}::lending::clear_bad_debt_batch`]: "Clear Debt Batch",
  [`${ECHELON}::lending::create_efficiency_mode`]: "Create E-Mode",
  [`${ECHELON}::lending::create_efficiency_mode_v2`]: "Create E-Mode",
  [`${ECHELON}::lending::deposit_reserve`]: "Deposit",
  [`${ECHELON}::lending::deposit_reserve_fa`]: "Deposit",
  [`${ECHELON}::lending::init_pause_flag`]: "Init Pause",

  // ============================================
  // YUZU
  // ============================================
  [`${YUZU}::config::set_emergency_admin`]: "Set Admin",
  [`${YUZU}::config::set_pool_admin`]: "Set Pool Admin",
  [`${YUZU}::config::set_protocol_fee`]: "Set Protocol Fee",
  [`${YUZU}::config::set_reward_admin`]: "Set Reward Admin",
  [`${YUZU}::config::set_trader_fee_multipliers`]: "Set Trader Fee",
  [`${YUZU}::config::set_treasury`]: "Set Treasury",
  [`${YUZU}::scripts::add_liquidity`]: "Add Liquidity",
  [`${YUZU}::scripts::add_liquidity_both_coins`]: "Add Liquidity",
  [`${YUZU}::scripts::add_liquidity_one_coin`]: "Add Liquidity",
  [`${YUZU}::scripts::burn_position`]: "Burn Position",
  [`${YUZU}::scripts::collect_fee`]: "Collect Fee",
  [`${YUZU}::scripts::collect_multi_rewards`]: "Collect Rewards",
  [`${YUZU}::scripts::collect_reward`]: "Collect Reward",
  [`${YUZU}::scripts::create_pool`]: "Create Pool",
  [`${YUZU}::scripts::create_pool_both_coins`]: "Create Pool",
  [`${YUZU}::scripts::create_pool_one_coin`]: "Create Pool",
  [`${YUZU}::scripts::create_pool_with_liquidity`]: "Create Pool",
  [`${YUZU}::scripts::create_pool_with_liquidity_both_coins`]: "Create Pool",
  [`${YUZU}::scripts::create_pool_with_liquidity_one_coin`]: "Create Pool",
  [`${YUZU}::scripts::remove_liquidity`]: "Remove Liquidity",
  [`${YUZU}::scripts::swap_coin_for_exact_fa`]: "Swap",
  [`${YUZU}::scripts::swap_coin_for_exact_fa_multi_hops`]: "Swap",
  [`${YUZU}::scripts::swap_exact_coin_for_fa`]: "Swap",
  [`${YUZU}::scripts::swap_exact_coin_for_fa_multi_hops`]: "Swap",
  [`${YUZU}::scripts::swap_exact_fa_for_fa`]: "Swap",
  [`${YUZU}::scripts::swap_exact_fa_for_fa_multi_hops`]: "Swap",
  [`${YUZU}::scripts::swap_fa_for_exact_fa`]: "Swap",
  [`${YUZU}::scripts::swap_fa_for_exact_fa_multi_hops`]: "Swap",
  [`${YUZU}::fee_tier::add_fee_tier`]: "Add Fee Tier",
  [`${YUZU}::fee_tier::delete_fee_tier`]: "Delete Fee Tier",
  [`${YUZU}::emergency::disable_forever`]: "Disable Forever",
  [`${YUZU}::emergency::pause`]: "Pause",
  [`${YUZU}::emergency::resume`]: "Resume",

  // ============================================
  // MOSAIC AGGREGATOR
  // ============================================
  [`${MOSAIC_AGGREGATOR}::config::create_partner`]: "Create Partner",
  [`${MOSAIC_AGGREGATOR}::config::remove_pair_protocol_fee_config`]: "Remove Fee Config",
  [`${MOSAIC_AGGREGATOR}::config::set_admin`]: "Set Admin",
  [`${MOSAIC_AGGREGATOR}::config::set_default_protocol_fee_config`]: "Set Default Fee",
  [`${MOSAIC_AGGREGATOR}::config::set_max_ps`]: "Set Max PS",
  [`${MOSAIC_AGGREGATOR}::config::set_pair_protocol_fee_config`]: "Set Pair Fee",
  [`${MOSAIC_AGGREGATOR}::config::set_protocol_fee_flag`]: "Set Fee Flag",
  [`${MOSAIC_AGGREGATOR}::config::set_ps_flag`]: "Set PS Flag",
  [`${MOSAIC_AGGREGATOR}::config::update_default_fee_share`]: "Update Fee Share",
  [`${MOSAIC_AGGREGATOR}::config::update_partner_fee_share`]: "Update Partner Fee",
  [`${MOSAIC_AGGREGATOR}::config::update_partner_ps`]: "Update Partner PS",
  [`${MOSAIC_AGGREGATOR}::router::swap`]: "Swap",
  [`${MOSAIC_AGGREGATOR}::treasury::withdraw_coin`]: "Withdraw",
  [`${MOSAIC_AGGREGATOR}::treasury::withdraw_coin_all`]: "Withdraw All",
  [`${MOSAIC_AGGREGATOR}::treasury::withdraw_fa`]: "Withdraw",
  [`${MOSAIC_AGGREGATOR}::treasury::withdraw_multiple_fas_all`]: "Withdraw All",

  // ============================================
  // MOSAIC AMM
  // ============================================
  [`${MOSAIC_AMM}::scripts::add_liquidity_both_assets`]: "Add Liquidity",
  [`${MOSAIC_AMM}::scripts::add_liquidity_both_coins`]: "Add Liquidity",
  [`${MOSAIC_AMM}::scripts::add_liquidity_one_coin`]: "Add Liquidity",
  [`${MOSAIC_AMM}::scripts::create_pool_both_assets`]: "Create Pool",
  [`${MOSAIC_AMM}::scripts::create_pool_both_coins`]: "Create Pool",
  [`${MOSAIC_AMM}::scripts::create_pool_one_coin`]: "Create Pool",
  [`${MOSAIC_AMM}::scripts::remove_liquidity_both_assets`]: "Remove Liquidity",
  [`${MOSAIC_AMM}::scripts::remove_liquidity_both_coins`]: "Remove Liquidity",
  [`${MOSAIC_AMM}::scripts::remove_liquidity_one_coin`]: "Remove Liquidity",
  [`${MOSAIC_AMM}::scripts::swap_asset_for_exact_asset`]: "Swap",
  [`${MOSAIC_AMM}::scripts::swap_asset_for_exact_coin`]: "Swap",
  [`${MOSAIC_AMM}::scripts::swap_coin_for_exact_asset`]: "Swap",
  [`${MOSAIC_AMM}::scripts::swap_coin_for_exact_coin`]: "Swap",
  [`${MOSAIC_AMM}::scripts::swap_exact_asset_for_asset`]: "Swap",
  [`${MOSAIC_AMM}::scripts::swap_exact_asset_for_coin`]: "Swap",
  [`${MOSAIC_AMM}::scripts::swap_exact_coin_for_asset`]: "Swap",
  [`${MOSAIC_AMM}::scripts::swap_exact_coin_for_coin`]: "Swap",
  [`${MOSAIC_AMM}::treasury::withdraw_all_assets`]: "Withdraw All",
  [`${MOSAIC_AMM}::treasury::withdraw_both_assets`]: "Withdraw",
  [`${MOSAIC_AMM}::treasury::withdraw_both_coins`]: "Withdraw",
  [`${MOSAIC_AMM}::treasury::withdraw_one_coin`]: "Withdraw",
  [`${MOSAIC_AMM}::emergency::disable_forever`]: "Disable Forever",
  [`${MOSAIC_AMM}::emergency::pause`]: "Pause",
  [`${MOSAIC_AMM}::emergency::resume`]: "Resume",
  [`${MOSAIC_AMM}::global_config::set_default_fee`]: "Set Default Fee",
  [`${MOSAIC_AMM}::global_config::set_default_protocol_fee`]: "Set Protocol Fee",
  [`${MOSAIC_AMM}::global_config::set_emergency_admin`]: "Set Admin",
  [`${MOSAIC_AMM}::global_config::set_fee_admin`]: "Set Fee Admin",
  [`${MOSAIC_AMM}::global_config::set_protocol_admin`]: "Set Protocol Admin",
  [`${MOSAIC_AMM}::liquidity_pool::set_default_price_oracle_update_period_threshold`]: "Set Oracle Period",
  [`${MOSAIC_AMM}::liquidity_pool::set_fee`]: "Set Fee",
  [`${MOSAIC_AMM}::liquidity_pool::set_price_oracle_update_period_threshold_for_pool`]: "Set Pool Oracle",
  [`${MOSAIC_AMM}::liquidity_pool::set_protocol_fee`]: "Set Protocol Fee",
};

/**
 * Normalize an address to full 64-character format (with leading zeros)
 * @param address - Address string (with or without 0x prefix)
 * @returns Normalized address with 0x prefix and 64 hex characters
 */
function normalizeAddress(address: string): string {
  // Remove 0x prefix if present
  const withoutPrefix = address.startsWith("0x") ? address.slice(2) : address;
  // Pad to 64 characters with leading zeros
  const padded = withoutPrefix.padStart(64, "0");
  return `0x${padded}`;
}

/**
 * Get human-readable description for a function
 * @param functionFullStr - Full function string in format "address::module::function"
 * @returns Human-readable description or null if not found
 */
export function getFunctionDescription(functionFullStr: string): string | null {
  // First try direct match
  if (CONTRACT_FUNCTION_DESCRIPTIONS[functionFullStr]) {
    return CONTRACT_FUNCTION_DESCRIPTIONS[functionFullStr];
  }

  // Try with normalized address (handles addresses with/without leading zeros)
  const parts = functionFullStr.split("::");
  if (parts.length >= 3) {
    const [address, module, func] = parts;
    const normalizedKey = `${normalizeAddress(address)}::${module}::${func}`;
    return CONTRACT_FUNCTION_DESCRIPTIONS[normalizedKey] ?? null;
  }

  return null;
}
