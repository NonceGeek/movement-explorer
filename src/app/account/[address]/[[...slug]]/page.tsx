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
import { useGetAccountTransactions } from "@/hooks/accounts/useGetAccountTransactions";
import { useGetAccountTokensCount } from "@/hooks/accounts/useGetAccountTokens";
import { Types } from "aptos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TableBody,
  TableCell,
  StyledTableRow as TableRow,
  StyledTable as Table,
  StyledTableHead as TableHead,
  StyledTableHeader as TableHeader,
  StyledTableHeaderRow as HeaderRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, ResponsiveTabsList } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import {
  formatMoveAmount,
  getCoinBalanceChangeForAccount,
  getGasInfo,
  getTransactionCounterparty,
  getTransactionFunction,
  getTransactionSender,
  getTransactionTypeName,
  formatTimestamp as formatTxTimestamp,
} from "@/utils/transaction";

// Components
import AccountTitle from "../components/AccountTitle";
import BalanceCard from "../components/BalanceCard";
import InfoTab from "../components/Tabs/InfoTab";
import NFTsTab from "../components/Tabs/NFTsTab";
import ModulesTab from "../components/Tabs/ModulesTab/ModulesTab";
import TokensTab from "../components/Tabs/TokensTab";
import CoinsTab from "../components/Tabs/CoinsTab";

const TXN_PER_PAGE = 25;

function getPageStartSequenceNumbers(sequenceNum: number): number[] {
  const pageStarts: number[] = [];
  const numOfPages = Math.ceil(sequenceNum / TXN_PER_PAGE);
  let num = sequenceNum;
  for (let i = 0; i < numOfPages; i++) {
    num = num - TXN_PER_PAGE;
    num = num >= 0 ? num : 0;
    pageStarts.push(num);
  }
  return pageStarts;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const pages: (number | "ellipsis")[] = [];
  const showPages = 5;
  const halfShow = Math.floor(showPages / 2);

  let startPage = Math.max(1, currentPage - halfShow);
  let endPage = Math.min(totalPages, currentPage + halfShow);

  if (currentPage <= halfShow) {
    endPage = Math.min(totalPages, showPages);
  } else if (currentPage >= totalPages - halfShow) {
    startPage = Math.max(1, totalPages - showPages + 1);
  }

  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) pages.push("ellipsis");
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return pages;
}

export default function AccountDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
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

  const currentTxPage = parseInt(searchParams.get("txPage") ?? "1", 10);
  const sequenceNum = accountData
    ? parseInt(accountData.sequence_number, 10)
    : 0;
  const totalTxPages = Math.max(1, Math.ceil(sequenceNum / TXN_PER_PAGE));
  const pageStarts = sequenceNum
    ? getPageStartSequenceNumbers(sequenceNum)
    : [];
  const txStart = pageStarts[currentTxPage - 1];
  const txLimit =
    currentTxPage > 1 && currentTxPage === totalTxPages
      ? pageStarts[currentTxPage - 2]
      : TXN_PER_PAGE;

  const { data: transactions, isLoading: transactionsLoading } =
    useGetAccountTransactions(address, txStart, txLimit);

  const txVisiblePages = getVisiblePages(currentTxPage, totalTxPages);
  const handleTxPageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("txPage", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Determine if this is an object (for Title)
  // This logic is simplified; real logic might need checking specific resources
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
  // Route: /account/[address]/[[...slug]]
  // Possible patterns:
  // - /modules
  // - /modules/code/[package]/[module]
  // - /modules/code/[package]/[module]/[function]
  const slug = params.slug as string[] | undefined;

  // Derive initial state from slug
  const initialPackage =
    slug && slug.length > 2 && slug[0] === "modules" && slug[1] === "code"
      ? decodeURIComponent(slug[2])
      : undefined;
  // Module name is just the name, not full path, but let's assume we might get partial or full.
  // Actually, usually it's just module name if we know the package.
  // If the link is .../code/0x1::coin/transfer, then package is 0x1::coin (wrong)
  // Usually link is .../code/package/module/function

  // Let's assume structure: /modules/code/package_name/module_name/function_name
  const initialModule =
    slug && slug.length > 3 && slug[0] === "modules" && slug[1] === "code"
      ? decodeURIComponent(slug[3])
      : undefined;
  const initialFunction =
    slug && slug.length > 4 && slug[0] === "modules" && slug[1] === "code"
      ? decodeURIComponent(slug[4])
      : undefined;

  // Set initial tab if slug dictates it
  if (slug && slug[0] === "modules" && currentTab !== "modules") {
    // We use a simple check to avoid infinite loops or re-renders if likely
    // But better to use useEffect or initialize state lazily if possible.
    // Since this is a Client Component, we can use useEffect (as done below) or just initialize state.
  }

  // Better: Initialize state based on params (only on mount)
  useState(() => {
    if (slug && slug[0] === "modules") {
      setCurrentTab("modules");
    } else if (slug && slug[0]) {
      // Handle other tabs if they were mapped (e.g. /resources)
      // For now only modules is explicitly required deep linking
      const tab = slug[0];
      if (tabItems.some((t) => t.value === tab)) {
        setCurrentTab(tab);
      }
    }
  });

  const tabItems = [
    { value: "transactions", label: "Transactions" },
    { value: "resources", label: `Resources (${resources?.length || 0})` },
    { value: "modules", label: "Modules" },
    { value: "info", label: "Info" },
    { value: "coins", label: "Coins" },
    { value: "tokens", label: `Tokens (${tokenCount})` },
    { value: "nfts", label: "NFTs" },
  ];

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
          onValueChange={setCurrentTab}
          className="space-y-6"
        >
          <ResponsiveTabsList
            items={tabItems}
            activeTab={currentTab}
            onTabChange={setCurrentTab}
          />

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <EnhancedSkeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : !transactions || transactions.length === 0 ? (
                  <p className="text-muted-foreground">No transactions found</p>
                ) : (
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <HeaderRow>
                            <TableHead>Version</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Sender</TableHead>
                            <TableHead>Receiver</TableHead>
                            <TableHead>Function</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Gas</TableHead>
                          </HeaderRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((tx: Types.Transaction) => {
                            const version = "version" in tx ? tx.version : null;
                            const timestamp =
                              "timestamp" in tx ? tx.timestamp : null;
                            const status = "success" in tx ? tx.success : true;
                            const sender = getTransactionSender(tx);
                            const counterparty = getTransactionCounterparty(tx);
                            const functionName = getTransactionFunction(tx);
                            const amountDelta = getCoinBalanceChangeForAccount(
                              tx,
                              address,
                            );
                            const gasInfo = getGasInfo(tx);

                            return (
                              <TableRow key={tx.hash}>
                                <TableCell>
                                  {version && (
                                    <a
                                      href={`/txn/${version}`}
                                      className="text-primary hover:underline font-mono text-sm"
                                    >
                                      {version}
                                    </a>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      status ? "secondary" : "destructive"
                                    }
                                  >
                                    {status ? "Success" : "Fail"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="capitalize"
                                  >
                                    {getTransactionTypeName(tx)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                  {timestamp
                                    ? formatTxTimestamp(timestamp)
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {sender ? (
                                    <CopyableAddress
                                      address={sender}
                                      truncateLength={{ start: 6, end: 4 }}
                                      showCopyButton={false}
                                    />
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {counterparty ? (
                                    <CopyableAddress
                                      address={counterparty.address}
                                      truncateLength={{ start: 6, end: 4 }}
                                      showCopyButton={false}
                                    />
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {functionName || "-"}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {amountDelta !== undefined ? (
                                    <span
                                      className={
                                        amountDelta > 0
                                          ? "text-guild-green-500"
                                          : amountDelta < 0
                                            ? "text-oracle-orange-500"
                                            : ""
                                      }
                                    >
                                      {amountDelta > 0
                                        ? "+"
                                        : amountDelta < 0
                                          ? "-"
                                          : ""}
                                      {formatMoveAmount(
                                        amountDelta < 0
                                          ? BigInt(-amountDelta)
                                          : BigInt(amountDelta),
                                      )}
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                  {gasInfo
                                    ? formatMoveAmount(gasInfo.gasFee)
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {totalTxPages > 1 && (
                      <div className="flex justify-center">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (currentTxPage > 1)
                                    handleTxPageChange(currentTxPage - 1);
                                }}
                                className={
                                  currentTxPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>

                            {txVisiblePages.map((page, i) =>
                              page === "ellipsis" ? (
                                <PaginationItem key={`ellipsis-${i}`}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              ) : (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    href="#"
                                    isActive={page === currentTxPage}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleTxPageChange(page);
                                    }}
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              ),
                            )}

                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (currentTxPage < totalTxPages)
                                    handleTxPageChange(currentTxPage + 1);
                                }}
                                className={
                                  currentTxPage === totalTxPages
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle>Resources ({resources?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {resourcesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <EnhancedSkeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : resources && resources.length > 0 ? (
                  <div className="space-y-4">
                    {resources.map((resource, i) => (
                      <div
                        key={i}
                        className="border border-border rounded-lg p-4"
                      >
                        <p className="text-sm text-muted-foreground mb-2 font-mono break-all">
                          {resource.type}
                        </p>
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-96">
                          {JSON.stringify(resource.data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No resources found</p>
                )}
              </CardContent>
            </Card>
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
