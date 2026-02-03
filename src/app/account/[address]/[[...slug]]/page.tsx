"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { useState, useEffect } from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useGetAccountResources } from "@/hooks/accounts/useGetAccountResources";
import { useGetAccountTokensCount } from "@/hooks/accounts/useGetAccountTokens";
import { Types } from "aptos";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, ResponsiveTabsList } from "@/components/ui/tabs";

// Components
import AccountTitle from "../components/AccountTitle";
import BalanceCard from "../components/BalanceCard";
import InfoTab from "../components/Tabs/InfoTab";
import NFTsTab from "../components/Tabs/NFTsTab";
import ModulesTab from "../components/Tabs/ModulesTab/ModulesTab";
import TokensTab from "../components/Tabs/TokensTab";
import CoinsTab from "../components/Tabs/CoinsTab";
import TransactionsTab from "../components/Tabs/TransactionsTab";
import ResourcesTab from "../components/Tabs/ResourcesTab";

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const address = params.address as string;

  const {
    data: resources,
    isLoading: resourcesLoading,
    error: resourcesError,
  } = useGetAccountResources(address);

  const { count: tokenCount } = useGetAccountTokensCount(address);

  const accountData = resources?.find((r) => r.type === "0x1::account::Account")
    ?.data as Types.AccountData | undefined;
  const objectData = resources?.find(
    (r) => r.type === "0x1::object::ObjectCore",
  );
  const tokenData = resources?.find((r) => r.type === "0x4::token::Token");

  // Determine if this is an object (for Title)
  const isObject = !!objectData;
  const isToken = !!tokenData;
  const isAccount = !!accountData;
  const isDeleted =
    !resourcesLoading && !!resources && resources.length === 0 && !isAccount;

  // Detect if we're on the /account route
  const isOnAccountRoute = pathname.startsWith("/account/");

  // Auto-redirect from /account to /object if this is an Object but not an Account
  useEffect(() => {
    if (!resourcesLoading && isOnAccountRoute && isObject && !isAccount) {
      // Preserve the slug path when redirecting
      const slug = params.slug as string[] | undefined;
      const slugPath = slug ? `/${slug.join("/")}` : "";
      router.replace(`/object/${address}${slugPath}`);
    }
  }, [
    resourcesLoading,
    isOnAccountRoute,
    isObject,
    isAccount,
    address,
    params.slug,
    router,
  ]);

  // Tabs State
  const [currentTab, setCurrentTab] = useState("transactions");

  // Handle Deep Linking via Slug
  const slug = params.slug as string[] | undefined;

  // Derive initial state from slug
  const initialPackage =
    slug && slug.length > 2 && slug[0] === "modules" && slug[1] === "code"
      ? decodeURIComponent(slug[2])
      : undefined;

  const initialModule =
    slug && slug.length > 3 && slug[0] === "modules" && slug[1] === "code"
      ? decodeURIComponent(slug[3])
      : undefined;

  const initialFunction =
    slug && slug.length > 4 && slug[0] === "modules" && slug[1] === "code"
      ? decodeURIComponent(slug[4])
      : undefined;

  // Handle Tab Change
  const handleTabChange = (value: string) => {
    setCurrentTab(value);

    // Update URL
    const newPath = `/account/${address}/${value}`;
    router.push(newPath);
  };

  const tabItems = [
    { value: "transactions", label: "Transactions" },
    { value: "resources", label: `Resources (${resources?.length || 0})` },
    { value: "modules", label: "Modules" },
    { value: "info", label: "Info" },
    { value: "coins", label: "Coins" },
    { value: "tokens", label: `Tokens (${tokenCount})` },
    { value: "nfts", label: "NFTs" },
  ];

  // Initialize state based on params (only on mount)
  useState(() => {
    if (slug && slug.length > 0) {
      // If slug exists, try to match it with a tab
      // Special case for modules because it can have sub-routes
      if (slug[0] === "modules") {
        setCurrentTab("modules");
      } else {
        // Check if the first slug matches any tab value
        const foundTab = tabItems.find((t) => t.value === slug[0]);
        if (foundTab) {
          setCurrentTab(foundTab.value);
        }
      }
    }
  });

  if (resourcesError && !resources) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load account {address}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine the page title based on route and resource type
  const pageTitle = isObject && !isOnAccountRoute ? "Object" : "Account";

  return (
    <>
      <PageNavigation title={pageTitle} />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col justify-center">
            <AccountTitle
              address={address}
              isAccount={isAccount}
              isObject={isObject}
              isToken={isToken}
              isDeleted={isDeleted}
            />
          </div>
          <div className="lg:col-span-4 xl:col-span-3">
            <BalanceCard address={address} />
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <ResponsiveTabsList
            items={tabItems}
            activeTab={currentTab}
            onTabChange={handleTabChange}
          />

          <TabsContent value="transactions">
            <TransactionsTab address={address} accountData={accountData} />
          </TabsContent>

          <TabsContent value="resources">
            <ResourcesTab resources={resources} isLoading={resourcesLoading} />
          </TabsContent>

          <TabsContent value="modules">
            <ModulesTab
              address={address}
              isObject={!isOnAccountRoute}
              initialTab={
                slug && slug[0] === "modules" && slug.length > 1
                  ? slug[1]
                  : undefined
              }
              initialPackage={initialPackage}
              initialModule={
                slug && slug.length > 2 && slug[0] === "modules"
                  ? decodeURIComponent(slug[2])
                  : initialModule
              }
              initialFunction={
                slug && slug.length > 3 && slug[0] === "modules"
                  ? decodeURIComponent(slug[3])
                  : initialFunction
              }
            />
          </TabsContent>

          <TabsContent value="info">
            <InfoTab
              address={address}
              accountData={accountData}
              objectData={objectData}
            />
          </TabsContent>

          <TabsContent value="coins">
            <CoinsTab address={address} />
          </TabsContent>

          <TabsContent value="nfts">
            <NFTsTab address={address} />
          </TabsContent>
          <TabsContent value="tokens">
            <TokensTab address={address} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
