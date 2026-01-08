"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { GraphqlClientProvider } from "@/hooks/common/useGraphqlClient";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { ThemeProvider } from "next-themes";
import dynamic from "next/dynamic";

// Dynamic import with SSR disabled to avoid useSearchParams issues during prerender
const NetworkUrlSync = dynamic(
  () => import("@/components/layout/NetworkUrlSync"),
  { ssr: false }
);

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AptosWalletAdapterProvider
          autoConnect={true}
          dappConfig={{
            network: Network.MAINNET,
          }}
          onError={(error) => {
            console.error("Wallet error:", error);
          }}
        >
          <GraphqlClientProvider>
            <NetworkUrlSync />
            {children}
          </GraphqlClientProvider>
        </AptosWalletAdapterProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
