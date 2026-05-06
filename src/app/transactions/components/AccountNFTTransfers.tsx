"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Types } from "aptos";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import {
  useTransactionPaginationStore,
  PageSize,
  DEFAULT_PAGE_SIZE,
} from "@/store/useTransactionPaginationStore";
import {
  useGetAccountNFTTransfers,
  NFTActivity,
} from "@/hooks/accounts/useGetAccountNFTTransfers";
import { useGetAccountNFTTransfersCount } from "@/hooks/accounts/useGetAccountNFTTransfersCount";
import { ActivityColumnFilter } from "@/components/transactions/filters/ActivityColumnFilter";
import {
  DateRangeColumnFilter,
  DateRange,
} from "@/components/transactions/filters/DateRangeFilter";
import { TransactionTableToolbar } from "@/components/transactions/TransactionTableToolbar";
import { TransactionTableFooter } from "@/components/transactions/TransactionTableFooter";
import { TableLoadingBar } from "@/components/common/TableLoadingBar";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { TimestampToggle } from "@/components/common/TimestampToggle";
import {
  TransactionTypeName,
  TRANSACTION_TYPE_INFO,
} from "@/constants/transaction";
import { ArrowLeft, CircleCheckBig, X, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  StyledTable,
  StyledTableHeader,
  StyledTableHeaderRow,
  StyledTableHead,
  StyledTableRow,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { EnhancedSkeleton } from "@/components/ui/skeleton";

const MAX_PAGES = 100;

function getActivityName(type: string): string {
  const parts = type.split("::");
  const eventName = parts[parts.length - 1] || type;
  return eventName.replace(/Event$/, "");
}

function getActivityStyle(activityName: string): string {
  switch (activityName.toLowerCase()) {
    case "mint":
      return "bg-(--ms-good)/15 text-(--ms-good) border-(--ms-good)/30";
    case "burn":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "transfer":
      return "bg-blue-500/15 text-blue-500 border-blue-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

interface AccountNFTTransfersProps {
  address: string;
  headerEndDecorator?: React.ReactNode;
}

export function AccountNFTTransfers({
  address,
  headerEndDecorator,
}: AccountNFTTransfersProps) {
  const { pageSize, setPageSize } = useTransactionPaginationStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");
  const [activityFilter, setActivityFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

  // Get page from URL or default to 1, capped at MAX_PAGES
  const pageParam = searchParams.get("page");
  const currentPage = Math.min(
    MAX_PAGES,
    pageParam ? Math.max(1, parseInt(pageParam) || 1) : 1,
  );

  // Get limit from URL or use store value
  const limitParam = searchParams.get("limit");
  const currentLimit: PageSize = limitParam
    ? ((parseInt(limitParam) as PageSize) || DEFAULT_PAGE_SIZE)
    : pageSize;

  // Fetch count
  const { data: txCount } = useGetAccountNFTTransfersCount(address, activityFilter, dateRange.from, dateRange.to);
  const totalCount = txCount ?? 0;
  const totalPages = Math.min(
    MAX_PAGES,
    Math.max(1, Math.ceil(totalCount / currentLimit)),
  );

  // Fetch NFT activities for current page
  const offset = (currentPage - 1) * currentLimit;
  const { data: activities, isLoading: activitiesLoading } =
    useGetAccountNFTTransfers(address, currentLimit, offset, activityFilter, dateRange.from, dateRange.to);

  // Extract unique transaction versions to fetch full transaction details
  const uniqueVersions = useMemo(() => {
    if (!activities) return [];
    return [...new Set(activities.map((a) => a.transaction_version))];
  }, [activities]);

  // Fetch full transaction details via REST API (for hash, status, type icon)
  const { aptos_client } = useGlobalStore();
  const { data: transactions, isLoading: txDetailsLoading } = useQuery({
    queryKey: ["accountNFTTransferDetails", address, uniqueVersions],
    queryFn: async () => {
      if (uniqueVersions.length === 0) return [];
      return Promise.all(
        uniqueVersions.map((v) =>
          getTransaction({ txnHashOrVersion: v }, aptos_client),
        ),
      );
    },
    enabled: uniqueVersions.length > 0,
  });

  // Build version → transaction lookup
  const txMap = useMemo(() => {
    const map = new Map<number, Types.Transaction>();
    if (!transactions) return map;
    for (const tx of transactions) {
      if ("version" in tx) {
        map.set(parseInt(tx.version), tx);
      }
    }
    return map;
  }, [transactions]);

  const isLoading = activitiesLoading || txDetailsLoading;

  // URL sync handlers
  const updateURL = useCallback(
    (page: number, limit: PageSize) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1) {
        updateURL(page, currentLimit);
      }
    },
    [currentLimit, updateURL],
  );

  const handlePageSizeChange = useCallback(
    (size: PageSize) => {
      setPageSize(size);
      updateURL(1, size);
    },
    [setPageSize, updateURL],
  );

  const hasActiveFilters = activityFilter !== null || dateRange.from !== null;

  const clearAllFilters = () => {
    setActivityFilter(null);
    setDateRange({ from: null, to: null });
  };

  // Reset to page 1 when filters change
  const filterKey = `${dateRange.from}-${dateRange.to}-${activityFilter}`;
  const prevFilterKey = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      if (currentPage !== 1) {
        handlePageChange(1);
      }
    }
  }, [filterKey, currentPage, handlePageChange]);

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/account/${address}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl sm:text-3xl font-bold">NFT Transfers</h1>
        </div>
        <div className="flex items-center gap-2 mt-1 ml-8">
          <CopyableAddress address={address} showCopyButton variant="muted" />
        </div>
        {headerEndDecorator}
      </div>

      {/* Top Toolbar */}
      <TransactionTableToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        transactions={[]}
        isLoading={isLoading}
        infoText={
          <div className="flex items-center gap-2">
            {totalCount > 0 && (
              <span>
                <span className="font-medium text-foreground">
                  {totalCount.toLocaleString()}
                </span>{" "}
                NFT transfers found
              </span>
            )}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full cursor-pointer hover:bg-primary/20 transition-colors"
              >
                <X className="h-3 w-3" />
                filtered
              </button>
            )}
          </div>
        }
      />

      {/* Table */}
      <div className="relative overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <TableLoadingBar visible={!isLoading && !!activities} />
        <StyledTable>
          <StyledTableHeader>
            <StyledTableHeaderRow>
              <StyledTableHead className="w-[170px]">Txn Hash</StyledTableHead>
              <StyledTableHead className="w-[155px]">
                <DateRangeColumnFilter
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  timestampMode={timestampMode}
                  onToggleTimestampMode={setTimestampMode}
                />
              </StyledTableHead>
              <StyledTableHead className="w-[100px]">
                <ActivityColumnFilter
                  value={activityFilter}
                  onChange={setActivityFilter}
                />
              </StyledTableHead>
              <StyledTableHead className="w-[180px]">Token</StyledTableHead>
              <StyledTableHead className="w-[150px]">From</StyledTableHead>
              <StyledTableHead className="w-[150px]">To</StyledTableHead>
              <StyledTableHead className="w-[80px] text-right">
                Amount
              </StyledTableHead>
            </StyledTableHeaderRow>
          </StyledTableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: currentLimit }).map((_, i) => (
                  <TableRow key={i} className="h-16">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <EnhancedSkeleton className="h-8 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : (activities || []).map((activity) => (
                  <NFTActivityRow
                    key={`${activity.transaction_version}-${activity.event_index}`}
                    activity={activity}
                    transaction={txMap.get(activity.transaction_version)}
                    timestampMode={timestampMode}
                    onToggleTimestampMode={() =>
                      setTimestampMode((prev) =>
                        prev === "age" ? "dateTime" : "age",
                      )
                    }
                  />
                ))}
          </TableBody>
        </StyledTable>
      </div>

      {/* Bottom Footer */}
      <TransactionTableFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        pageSize={currentLimit}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
      />
    </>
  );
}

function NFTActivityRow({
  activity,
  transaction,
  timestampMode,
  onToggleTimestampMode,
}: {
  activity: NFTActivity;
  transaction: Types.Transaction | undefined;
  timestampMode: "age" | "dateTime";
  onToggleTimestampMode: () => void;
}) {
  const router = useRouter();
  const activityName = getActivityName(activity.type);
  const activityStyle = getActivityStyle(activityName);

  const txHash = transaction?.hash || "";
  const status =
    transaction && "success" in transaction ? transaction.success : true;
  const txType = (transaction?.type || "unknown") as TransactionTypeName;
  const typeInfo =
    TRANSACTION_TYPE_INFO[txType] ??
    TRANSACTION_TYPE_INFO[TransactionTypeName.Unknown];
  const timestamp =
    transaction && "timestamp" in transaction
      ? transaction.timestamp
      : activity.transaction_timestamp;

  const tokenDisplay = activity.token_data_id
    ? activity.token_data_id.length > 20
      ? `${activity.token_data_id.slice(0, 10)}...${activity.token_data_id.slice(-8)}`
      : activity.token_data_id
    : "-";

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a, button, [role="button"]')) return;
    router.push(`/txn/${txHash || activity.transaction_version}`);
  };

  return (
    <StyledTableRow
      className="cursor-pointer animate-in slide-in-from-top-2 fade-in duration-500"
      onClick={handleRowClick}
    >
      <TableCell className="w-[170px]">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-foreground/80 shrink-0 cursor-default">
                  {typeInfo.icon}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs font-medium capitalize">
                  {typeInfo.label}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {typeInfo.description}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <CopyableAddress
            address={txHash || String(activity.transaction_version)}
            href={`/txn/${txHash || activity.transaction_version}`}
            className="text-primary font-mono transition-colors"
            truncateLength={{ start: 10, end: 0 }}
            icon={
              status ? (
                <CircleCheckBig className="h-4 w-4 text-(--ms-good) shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )
            }
          />
        </div>
      </TableCell>

      <TableCell className="text-foreground/80 text-sm whitespace-nowrap w-[155px]">
        <TimestampToggle
          timestamp={timestamp}
          timestampMode={timestampMode}
          onToggle={onToggleTimestampMode}
        />
      </TableCell>

      <TableCell className="w-[100px]">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${activityStyle}`}
        >
          {activityName}
        </span>
      </TableCell>

      <TableCell className="w-[180px]">
        <span
          className="text-sm text-foreground/80 truncate max-w-[180px] inline-block"
          title={activity.token_data_id}
        >
          {tokenDisplay}
        </span>
      </TableCell>

      <TableCell className="w-[150px]">
        {activity.from_address ? (
          <CopyableAddress
            address={activity.from_address}
            href={`/account/${activity.from_address}`}
            className="text-primary"
            showLabel
          />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell className="w-[150px]">
        {activity.to_address ? (
          <CopyableAddress
            address={activity.to_address}
            href={`/account/${activity.to_address}`}
            className="text-primary"
            showLabel
          />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell className="w-[80px] text-right">
        <span className="font-mono text-sm">
          {activity.token_amount ?? "-"}
        </span>
      </TableCell>
    </StyledTableRow>
  );
}
