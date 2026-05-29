export const prefix = process.env.NEXT_PUBLIC_PREFIX || "";

export const mainnetUrl =
  process.env.NEXT_PUBLIC_MAINNET_URL ||
  `https://mainnet.movementnetwork.xyz/v1`;

export const testnetUrl =
  process.env.NEXT_PUBLIC_MOVEMENT_TESTNET_URL ||
  `https://testnet.movementnetwork.xyz/v1`;

export const networks = {
  mainnet: mainnetUrl,
  testnet: testnetUrl,
  devnet: "",
  local: "http://localhost:30731",
  mevmdevnet: "",
  custom: "",
};

export const availableNetworks = ["mainnet", "testnet"];

export type NetworkName = keyof typeof networks;

type ApiKeys = {
  [key in NetworkName]: string | undefined;
};

/**
 * Public Client IDs (API keys) from API Gateway.
 */
const apiKeys: ApiKeys = {
  mainnet: undefined,
  testnet: undefined,
  devnet: undefined,
  local: undefined,
  mevmdevnet: undefined,
  custom: undefined,
};

export function getApiKey(network_name: NetworkName): string | undefined {
  return apiKeys[network_name];
}

export function isValidNetworkName(value: string): value is NetworkName {
  return value in networks;
}

export enum Network {
  MAINNET = "mainnet",
  TESTNET = "testnet",
  DEVNET = "devnet",
  LOCAL = "local",
  PREVIEWNET = "mevm-devnet",
  CUSTOM = "custom",
}

// Remove trailing slashes
for (const key of Object.keys(networks)) {
  const networkName = key as NetworkName;
  if (networks[networkName].endsWith("/")) {
    networks[networkName] = networks[networkName].slice(0, -1);
  }
}

export const defaultNetworkName: NetworkName = "mainnet" as const;

if (!(defaultNetworkName in networks)) {
  throw `defaultNetworkName '${defaultNetworkName}' not in Networks!`;
}

export function normalizeNetworkName(
  value: string | null | undefined,
): NetworkName {
  if (value === "bardock testnet" || value === "bardock-testnet") {
    return "testnet";
  }
  if (value && isValidNetworkName(value)) {
    return value;
  }
  return defaultNetworkName;
}
