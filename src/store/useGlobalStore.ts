import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AptosClient, IndexerClient } from "aptos";
import { Aptos, AptosConfig, NetworkToNetworkName } from "@aptos-labs/ts-sdk";
import {
  FeatureName,
  NetworkName,
  defaultNetworkName,
  defaultFeatureName,
  getApiKey,
  networks,
  isValidNetworkName,
  isValidFeatureName,
  mainnetUrl,
} from "../constants";

const HEADERS = {
  "x-indexer-client": "movement-explorer",
};

export function getGraphqlURI(network: NetworkName): string | undefined {
  switch (network) {
    case "mainnet":
      return "https://indexer.mainnet.movementnetwork.xyz/v1/graphql";
    case "bardock testnet":
      return "https://indexer.testnet.movementnetwork.xyz/v1/graphql";
    default:
      return undefined;
  }
}

type ClientState = {
  network_value: string;
  aptos_client: AptosClient;
  indexer_client?: IndexerClient;
  sdk_v2_client: Aptos;
};

type GlobalState = {
  feature_name: FeatureName;
  network_name: NetworkName;
} & ClientState;

type GlobalActions = {
  selectFeature: (feature: FeatureName) => void;
  selectNetwork: (network: NetworkName) => void;
};

const deriveClients = (network_name: NetworkName): ClientState => {
  const networkUrl = networks[network_name];

  // If network has no URL, fallback to mainnet to prevent crashes
  const safeNetworkName = networkUrl === "" ? defaultNetworkName : network_name;
  const safeNetworkUrl =
    networkUrl === "" ? networks[defaultNetworkName] : networkUrl;

  const indexerUri = getGraphqlURI(safeNetworkName);
  const apiKey = getApiKey(safeNetworkName);
  let indexerClient = undefined;
  if (indexerUri) {
    indexerClient = new IndexerClient(indexerUri, { HEADERS, TOKEN: apiKey });
  }

  return {
    network_value: safeNetworkUrl,
    aptos_client: new AptosClient(safeNetworkUrl, {
      HEADERS,
      TOKEN: apiKey,
    }),
    indexer_client: indexerClient,
    sdk_v2_client: new Aptos(
      new AptosConfig({
        network:
          NetworkToNetworkName[
            safeNetworkName as keyof typeof NetworkToNetworkName
          ] || NetworkToNetworkName[defaultNetworkName],
        // fallback to default if mapping fails (though types should match)
        fullnode: safeNetworkUrl,
        indexer: indexerUri,
        clientConfig: {
          HEADERS,
          API_KEY: apiKey,
        },
      })
    ),
  };
};

export const useGlobalStore = create<GlobalState & GlobalActions>()(
  persist(
    (set, get) => ({
      feature_name: defaultFeatureName,
      network_name: defaultNetworkName,
      ...deriveClients(defaultNetworkName),

      selectFeature: (feature: FeatureName) => {
        if (!isValidFeatureName(feature)) return;
        set({ feature_name: feature });
      },

      selectNetwork: (network: NetworkName) => {
        if (!isValidNetworkName(network)) return;
        const clients = deriveClients(network);
        set({ network_name: network, ...clients });
      },
    }),
    {
      name: "global-storage",
      partialize: (state) => ({
        feature_name: state.feature_name,
        network_name: state.network_name,
      }),
      onRehydrateStorage: () => (state) => {
        // Re-derive clients when state is rehydrated from localStorage
        if (state) {
          const clients = deriveClients(state.network_name);
          useGlobalStore.setState(clients); // Update the store with derived clients
        }
      },
    }
  )
);
