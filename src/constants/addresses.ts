import { CoinDescription } from "@/types/coin";

/**
 * Delegation Service
 */
export const OCTA = 100000000;

/**
 * Core Address
 */
export const objectCoreResource = "0x1::object::ObjectCore";
export const faMetadataResource = "0x1::fungible_asset::Metadata";
export const tokenV2Address = "0x4::token::Token";
export const collectionV2Address = "0x4::collection::Collection";

/**
 * Address overrides
 */
export const knownAddresses: Record<string, string> = {
  "0x0000000000000000000000000000000000000000000000000000000000000001":
    "Framework (0x1)",
  "0x0000000000000000000000000000000000000000000000000000000000000003":
    "Legacy Token (0x3)",
  "0x0000000000000000000000000000000000000000000000000000000000000004":
    "Digital Assets (0x4)",
  "0x000000000000000000000000000000000000000000000000000000000000000A":
    "MOVE Coin Fungible Asset",
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff":
    "Burn Address",
  "0x84b1675891d370d5de8f169031f9c3116d7add256ecf50a4bc71e3135ddba6e0":
    "Bybit 1",
  "0xbeda85a0a4e68adb980382a7182019a7b9a2ad4bba36f41024338dea5ff1eaac":
    "Kucoin 1",
  "0x0cf869189c785beaaad2f5c636ced4805aeae9cbf49070dc93aed2f16b99012a":
    "Gate 1",
  "0x31d0a30ae53e2ae852fcbdd1fce75a4ea6ad81417739ef96883eba9574ffe31e":
    "MovePosition Vault 1",
  "0x58739edcac2f86e62342466f20809b268430aedf32937eba32eaac7e0bbf5233":
    "Echelon Vault 1",
  "0x574ecf25ca263b4d9cbd43ded90bba6a52309e0cba2213f9606e4b4a3a20ffae":
    "Layerbank Vault 1",
  "0x79eb0f69a65a088d40776e1789bbc36f247bc5ec0eb2fa5fdbeaa1b1bb3a965a":
    "MEXC 1",
  "0x03f7399a0d3d646ce94ee0badf16c4c3f3c656fe3a5e142e83b5ebc011aa8b3d":
    "Mosaic",
  "0x26a95d4bd7d7fc3debf6469ff94837e03e887088bef3a3f2d08d1131141830d3":
    "Mosaic AMM",
  "0x373aab3f20ef3c31fc4caa287b0f18170f4a0b4a28c80f7ee79434458f70f241":
    "Interest DEX",
  "0x46566b4a16a1261ab400ab5b9067de84ba152b5eb4016b217187f2a2ca980c5a": "YUZU",
  "0x4c5058bc4cd77fe207b8b9990e8af91e1055b814073f0596068e3b95a7ccd31a":
    "Move.Fun",
  "0x4877ee1d4970d17283fb9477094fd9b203e2c93ec6d6886e5d831c0b84c2ecf7":
    "Binance",
  "0xfbdb3da73efcfa742d542f152d65fc6da7b55dee864cd66475213e4be18c9d54":
    "Meridian AMM",
  "0xf1fc2bc72b9eeaa3cc80239d5c00e49ebab0b2c8a5b55227ce47644b3275ff96":
    "Meridian Farming",
  "0x88def51006db6ae8f90051a1531d1b43877eeb233f4c0d99dcb24f49cd27ad5b":
    "Meridian CLAMM",
  "0x4c5da52eaa510af14e93e7b16dddf3c5d6a9b3f847d18dc8e7499fc71a5a0a24":
    "Meridian CLAMM Farming",
  "0xccd2621d2897d407e06d18e6ebe3be0e6d9b61f1e809dd49360522b9105812cf":
    "MovePosition",
  "0x6a01d5761d43a5b5a0ccbfc42edf2d02c0611464aae99a2ea0e0d4819f0550b5":
    "Echelon",
};

export const scamAddresses: Record<string, string> = {
  // Known Scammers
};

export const EMOJICOIN_REGISTRY_ADDRESS =
  "0x4b947ed016c64bde81972d69ea7d356de670d57fd2608b129f4d94ac0d0ee61";

export const MARKED_AS_SCAM = "Marked as scam";
export const MARKED_AS_POSSIBLE_SCAM = "Marked as possible scam";
export const labsBannedTokens: Record<string, string> = {};
export const labsBannedAddresses: Record<string, string> = {};

export const labsBannedTokenSymbols: Record<string, string> = {};
