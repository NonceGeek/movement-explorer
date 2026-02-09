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
import { PageContainer } from "@/components/layout";
import {
  Tabs,
  TabsContent,
  PillTabsList,
  CompactTabsList,
} from "@/components/ui/tabs";

// Components
import {
  AccountHeader,
  AccountOverview,
  type AccountType,
} from "../components";
import { Wallet, Activity, Image, Database, Code } from "lucide-react";
import { useGetUnifiedMOVEBalance } from "@/hooks/accounts/useGetAccountAPTBalance";
import { useGetPrice } from "@/hooks/useGetPrice";
import NFTsTab from "../components/Tabs/NFTsTab";
import ModulesTab from "../components/Tabs/ModulesTab/ModulesTab";
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
  const { data: balance, isLoading: balanceLoading } =
    useGetUnifiedMOVEBalance(address);
  const { data: price, isLoading: priceLoading } = useGetPrice();

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

  // Determine account type for AccountHeader
  const accountType: AccountType = isToken
    ? "token"
    : isObject && !isAccount
      ? "object"
      : "account";

  // Format balance
  const formattedBalance = balance
    ? (Number(balance) / 100000000).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })
    : "0";

  const balanceUSD =
    balance && price
      ? ((Number(balance) / 100000000) * price).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      : null;

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
    // Save current scroll position
    const scrollY = window.scrollY;

    setCurrentTab(value);

    // Update URL without scrolling to top
    const basePath = isObject && !isAccount ? "object" : "account";
    const newPath = `/${basePath}/${address}/${value}`;

    // Use window.history.pushState to avoid Next.js navigation behavior
    window.history.pushState(null, "", newPath);

    // Restore scroll position after a brief delay to ensure layout is complete
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  // Tab order: Transactions → Coins → NFTs → Resources → Modules
  const tabItems = [
    {
      value: "transactions",
      label: "Transactions",
      icon: <Activity className="h-4 w-4" />,
      badge: accountData?.sequence_number
        ? Number(accountData.sequence_number)
        : undefined,
    },
    {
      value: "coins",
      label: "Coins",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      value: "nfts",
      label: "NFTs",
      icon: <Image className="h-4 w-4" />,
      badge: tokenCount || undefined,
    },
    {
      value: "resources",
      label: "Resources",
      icon: <Database className="h-4 w-4" />,
      badge: resources?.length || 0,
    },
    {
      value: "modules",
      label: "Modules",
      icon: <Code className="h-4 w-4" />,
    },
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

  return (
    <>
      <PageNavigation />
      <PageContainer>
        {/* Hero Header Section */}
        <div className="mb-6">
          <AccountHeader
            address={address}
            accountType={accountType}
            isAccount={isAccount}
            isObject={isObject}
            isToken={isToken}
            isDeleted={isDeleted}
          />
        </div>

        {/* Account Overview - Etherscan Style Three Columns */}
        <AccountOverview
          address={address}
          balance={balance}
          balanceUSD={balanceUSD}
          formattedBalance={formattedBalance}
          accountData={accountData}
          objectData={objectData}
          tokenCount={tokenCount || 0}
          resourceCount={resources?.length || 0}
          isLoading={balanceLoading || priceLoading || resourcesLoading}
          onTabChange={handleTabChange}
        />

        {/* Tabs */}
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="space-y-3"
        >
          {/* <PillTabsList
            items={tabItems}
            activeTab={currentTab}
            onTabChange={handleTabChange}
          /> */}
          <CompactTabsList
            items={tabItems}
            activeTab={currentTab}
            onTabChange={handleTabChange}
          />

          <TabsContent value="transactions">
            <TransactionsTab address={address} accountData={accountData} />
          </TabsContent>

          <TabsContent value="coins">
            <CoinsTab address={address} />
          </TabsContent>

          <TabsContent value="nfts">
            <NFTsTab address={address} />
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
        </Tabs>
      </PageContainer>
    </>
  );
}
