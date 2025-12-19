import React, { useEffect, useState } from "react";
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { NetworkName } from "../../constants";
import { useGlobalStore, getGraphqlURI } from "../../store/useGlobalStore";

function getIsGraphqlClientSupportedFor(networkName: NetworkName): boolean {
  const graphqlUri = getGraphqlURI(networkName);
  return typeof graphqlUri === "string" && graphqlUri.length > 0;
}

// Note: getGraphqlURI is now imported from ../store/useGlobalStore to avoid duplication

function getGraphqlClient(networkName: NetworkName): ApolloClient {
  // const apiKey = getApiKey(networkName);
  // Middleware to attach the authorization token.
  const authMiddleware = new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        // ...(apiKey ? {authorization: `Bearer ${apiKey}`} : {}),
      },
    }));
    return forward(operation);
  });

  const uri = getGraphqlURI(networkName);

  const httpLink = new HttpLink({
    uri: uri,
  });

  return new ApolloClient({
    link: ApolloLink.from([authMiddleware, httpLink]),
    cache: new InMemoryCache({
      // addTypename: false, // Optional: disable typename if causing issues with some query shapes
    }),
  });
}

export function useGetGraphqlClient() {
  const { network_name } = useGlobalStore();
  const [graphqlClient, setGraphqlClient] = useState<ApolloClient>(
    getGraphqlClient(network_name)
  );

  useEffect(() => {
    setGraphqlClient(getGraphqlClient(network_name));
  }, [network_name]);

  return graphqlClient;
}

type GraphqlClientProviderProps = {
  children: React.ReactNode;
};

export function GraphqlClientProvider({
  children,
}: GraphqlClientProviderProps) {
  const graphqlClient = useGetGraphqlClient();

  return <ApolloProvider client={graphqlClient}>{children}</ApolloProvider>;
}

export function useGetIsGraphqlClientSupported(): boolean {
  const { network_name } = useGlobalStore();
  return getIsGraphqlClientSupportedFor(network_name);
}
