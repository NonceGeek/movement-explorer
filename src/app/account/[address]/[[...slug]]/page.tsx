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
import { AccountHeader, StatsCard, SectionCard, InfoItem, type AccountType } from "@/components/account";
import { Wallet, Activity, Coins, Image, User, Database, LayoutDashboard, Code, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useGetUnifiedMOVEBalance } from "@/hooks/accounts/useGetAccountAPTBalance";
import { useGetPrice } from "@/hooks/useGetPrice";
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
  const { data: balance, isLoading: balanceLoading } = useGetUnifiedMOVEBalance(address);
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
    const newPath = `/account/${address}/${value}`;

    // Use window.history.pushState to avoid Next.js navigation behavior
    window.history.pushState(null, '', newPath);

    // Restore scroll position after a brief delay to ensure layout is complete
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  const tabItems = [
    {
      value: "transactions",
      label: "Transactions",
      icon: <Activity className="h-4 w-4" />,
      badge: accountData?.sequence_number ? Number(accountData.sequence_number) : undefined,
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
    {
      value: "info",
      label: "Info",
      icon: <Info className="h-4 w-4" />,
    },
    {
      value: "coins",
      label: "Coins",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      value: "tokens",
      label: "Tokens",
      icon: <Coins className="h-4 w-4" />,
      badge: tokenCount || undefined,
    },
    {
      value: "nfts",
      label: "NFTs",
      icon: <Image className="h-4 w-4" />,
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

  // Determine the page title based on route and resource type
  const pageTitle = isObject && !isOnAccountRoute ? "Object" : "Account";

  return (
    <>
      <PageNavigation title={pageTitle} />
      <div className="container max-w-[1440px] mx-auto px-4 py-8">
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

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* MOVE Balance Card */}
          <StatsCard
            icon={<Wallet className="h-5 w-5" />}
            label="MOVE Balance"
            value={`${formattedBalance} MOVE`}
            subValue={balanceUSD ? `~${balanceUSD}` : undefined}
            tooltip="Total MOVE tokens in this account"
            loading={balanceLoading || priceLoading}
          />

          {/* Transaction Count Card */}
          <StatsCard
            icon={<Activity className="h-5 w-5" />}
            label="Transactions"
            value={accountData?.sequence_number ? Number(accountData.sequence_number).toLocaleString() : "0"}
            tooltip="Total number of transactions from this account"
            loading={resourcesLoading}
          />

          {/* Tokens Held Card */}
          <StatsCard
            icon={<Coins className="h-5 w-5" />}
            label="Tokens Held"
            value={tokenCount || 0}
            subValue="View collection →"
            link={`/account/${address}/tokens`}
            loading={false}
          />

          {/* NFTs Owned Card */}
          <StatsCard
            icon={<Image className="h-5 w-5" />}
            label="NFTs Owned"
            value={0}
            subValue="View gallery →"
            link={`/account/${address}/nfts`}
            loading={false}
          />
        </div>

        {/* Account Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left: Account Details */}
          <SectionCard title="Account Details">
            <div className="space-y-3">
              <InfoItem
                label="Account Type"
                value={
                  accountType === "token"
                    ? "Token Object"
                    : accountType === "object"
                      ? "Object"
                      : "Account"
                }
                icon={<User className="h-4 w-4" />}
              />
              {accountData?.sequence_number && (
                <InfoItem
                  label="Sequence Number"
                  value={accountData.sequence_number}
                  mono
                  tooltip="Number of transactions sent from this account"
                />
              )}
              {accountData?.authentication_key && (
                <InfoItem
                  label="Authentication Key"
                  value={accountData.authentication_key}
                  mono
                  truncate
                  copyable
                  tooltip="Key used to authenticate transactions"
                />
              )}
            </div>
          </SectionCard>

          {/* Right: Resources Summary */}
          <SectionCard
            title={`Resources (${resources?.length || 0})`}
            headerAction={
              <Button variant="ghost" size="sm" asChild>
                <Link href={`#resources`} onClick={() => setCurrentTab("resources")}>
                  View All →
                </Link>
              </Button>
            }
          >
            {resources && resources.length > 0 ? (
              <div className="space-y-2">
                {resources.slice(0, 3).map((resource) => (
                  <div
                    key={resource.type}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <code className="text-xs font-mono truncate flex-1">
                      {resource.type}
                    </code>
                  </div>
                ))}
                {resources.length > 3 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setCurrentTab("resources")}
                  >
                    + {resources.length - 3} more resources
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No resources found
              </p>
            )}
          </SectionCard>
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
