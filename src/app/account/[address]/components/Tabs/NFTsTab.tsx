"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useGetAccountTokens,
  useGetAccountTokensCount,
} from "@/hooks/accounts/useGetAccountTokens";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  StyledTableRow as TableRow,
  StyledTable as Table,
  StyledTableHead as TableHead,
  StyledTableHeader as TableHeader,
  StyledTableHeaderRow as HeaderRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Image as ImageIcon,
  LayoutGrid,
  TableIcon,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { EmptyState } from "..";
import { TokenOwnership } from "@/hooks/accounts/useGetAccountTokens";
import { isValidIpfsUrl, toIpfsUrl, isVideoUrl } from "@/store/utils";

type ViewMode = "grid" | "table";

const TABLE_LIMIT = 20;
const CARD_LIMIT = 100;

// ViewToggle component using ToggleGroup (same pattern as CoinFilters)
function ViewToggle({
  mode,
  setMode,
}: {
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
}) {
  return (
    <ToggleGroup
      value={mode}
      onValueChange={(v) => { if (v) setMode(v as ViewMode); }}
    >
      <ToggleGroupItem value="grid">
        <LayoutGrid className="h-3.5 w-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem value="table">
        <TableIcon className="h-3.5 w-3.5" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

// Pagination helper hook
function useVisiblePages(currentPage: number, totalPages: number) {
  return useMemo(() => {
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
  }, [currentPage, totalPages]);
}

function resolveTokenUri(uri: string): string {
  if (!uri) return "";
  return isValidIpfsUrl(uri) ? toIpfsUrl(uri) : uri;
}

// Media preview with image -> video -> fallback
function NFTMediaPreview({ uri, name }: { uri?: string; name?: string }) {
  const [mediaState, setMediaState] = useState<"image" | "video" | "fallback">("image");

  if (!uri) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted p-4">
        <span className="text-base font-semibold text-muted-foreground text-center break-words line-clamp-4">
          {name || "Unknown Token"}
        </span>
      </div>
    );
  }

  const mediaUrl = resolveTokenUri(uri);
  const isKnownVideo = isVideoUrl(mediaUrl);

  if (isKnownVideo || mediaState === "video") {
    return (
      <video
        src={mediaUrl}
        className="object-cover w-full h-full"
        muted
        loop
        autoPlay
        playsInline
        onError={() => setMediaState("fallback")}
      />
    );
  }

  if (mediaState === "image") {
    return (
      <>
        <img
          src={mediaUrl}
          alt={name}
          className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
          onError={() => setMediaState("video")}
        />
        <div className="hidden absolute inset-0 flex items-center justify-center bg-muted p-4">
          <span className="text-base font-semibold text-muted-foreground text-center break-words line-clamp-4">
            {name || "Unknown Token"}
          </span>
        </div>
      </>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-muted p-4">
      <span className="text-base font-semibold text-muted-foreground text-center break-words line-clamp-4">
        {name || "Unknown Token"}
      </span>
    </div>
  );
}

// Grid View Component
function NFTGrid({ tokens }: { tokens: TokenOwnership[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tokens.map((token) => (
        <Link
          key={token.token_data_id}
          href={`/token/${token.token_data_id}`}
        >
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden hover:border-primary/50 transition-colors cursor-pointer">
            <div className="aspect-square relative bg-muted flex items-center justify-center overflow-hidden">
              <NFTMediaPreview
                uri={token.current_token_data?.token_uri}
                name={token.current_token_data?.token_name}
              />
            </div>
            <CardContent className="p-4">
              <h3
                className="font-semibold truncate"
                title={token.current_token_data?.token_name}
              >
                {token.current_token_data?.token_name || "Unknown Token"}
              </h3>
              <div
                className="text-sm text-muted-foreground mt-1 truncate"
                title={token.current_token_data?.current_collection?.collection_name}
              >
                {token.current_token_data?.current_collection?.collection_name ||
                  "Unknown Collection"}
              </div>
              <div className="text-xs text-muted-foreground mt-2 truncate">
                <CopyableAddress
                  address={token.token_data_id}
                  truncateLength={{ start: 6, end: 4 }}
                  showCopyButton={false}
                />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// Table View Component
function NFTTable({ tokens }: { tokens: TokenOwnership[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <HeaderRow>
            <TableHead>Name</TableHead>
            <TableHead>Collection</TableHead>
            <TableHead>Store</TableHead>
            <TableHead className="text-right">Version</TableHead>
            <TableHead className="text-right">Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </HeaderRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token) => (
            <TableRow key={token.token_data_id}>
              <TableCell>
                <Link
                  href={`/token/${token.token_data_id}`}
                  className="text-primary hover:underline"
                >
                  {token.current_token_data?.token_name || "-"}
                </Link>
              </TableCell>
              <TableCell>
                {token.current_token_data?.current_collection?.collection_name || "-"}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {token.table_type_v1 || "-"}
              </TableCell>
              <TableCell className="text-right font-mono">
                {token.property_version_v1 ?? "-"}
              </TableCell>
              <TableCell className="text-right uppercase">
                {token.token_standard || "-"}
              </TableCell>
              <TableCell className="text-right font-mono">
                {token.amount ?? "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface NFTsTabProps {
  address: string;
}

export default function NFTsTab({ address }: NFTsTabProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Pagination state (only used in table view)
  const currentPage = parseInt(searchParams.get("nftPage") ?? "1", 10);

  // Get token count for pagination
  const { count: tokenCount, isLoading: countLoading } =
    useGetAccountTokensCount(address);

  // Calculate limit and offset based on view mode
  const limit = viewMode === "table" ? TABLE_LIMIT : CARD_LIMIT;
  const offset = viewMode === "table" ? (currentPage - 1) * TABLE_LIMIT : 0;

  // Fetch tokens
  const { data: tokens, isLoading: tokensLoading } = useGetAccountTokens(
    address,
    limit,
    offset
  );

  const isLoading = tokensLoading || countLoading;
  const totalPages = Math.max(1, Math.ceil(tokenCount / TABLE_LIMIT));
  const visiblePages = useVisiblePages(currentPage, totalPages);

  // Handle page change (table view only)
  const handlePageChange = (page: number) => {
    const scrollY = window.scrollY;
    const params = new URLSearchParams(searchParams.toString());
    params.set("nftPage", page.toString());
    const newPath = `${pathname}?${params.toString()}`;
    window.history.pushState(null, "", newPath);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-start">
          <ViewToggle mode={viewMode} setMode={setViewMode} />
        </div>
        {viewMode === "table" ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <EnhancedSkeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <EnhancedSkeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (tokenCount === 0) {
    return (
      <EmptyState
        icon={<ImageIcon className="h-12 w-12" />}
        title="No NFTs Found"
        description="This account doesn't currently own any NFTs."
      />
    );
  }

  // Display count based on view mode
  const displayCount = viewMode === "table"
    ? `${tokenCount} NFT${tokenCount !== 1 ? "s" : ""}`
    : `${tokens.length} NFT${tokens.length !== 1 ? "s" : ""}${tokenCount > CARD_LIMIT ? ` (showing first ${CARD_LIMIT})` : ""}`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <ViewToggle mode={viewMode} setMode={setViewMode} />
        <span className="text-sm text-muted-foreground">{displayCount}</span>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && <NFTGrid tokens={tokens} />}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="space-y-6">
          <NFTTable tokens={tokens} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {visiblePages.map((page, i) =>
                    page === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          handlePageChange(currentPage + 1);
                      }}
                      className={
                        currentPage === totalPages
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
    </div>
  );
}
