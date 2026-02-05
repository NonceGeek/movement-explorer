"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetAccountTokens } from "@/hooks/accounts/useGetAccountTokens";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Image as ImageIcon, LayoutGrid, List } from "lucide-react";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { EmptyState } from "@/components/account";
import { cn } from "@/utils/styling";

type ViewMode = "grid" | "list";

function ViewToggle({
  mode,
  setMode,
}: {
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
}) {
  return (
    <div className="inline-flex items-center bg-muted/30 rounded-md p-0.5 border border-border/50 relative">
      <button
        onClick={() => setMode("grid")}
        className={cn(
          "p-1.5 rounded relative z-10 transition-colors duration-200 cursor-pointer",
          mode === "grid"
            ? "text-black"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setMode("list")}
        className={cn(
          "p-1.5 rounded relative z-10 transition-colors duration-200 cursor-pointer",
          mode === "list"
            ? "text-black"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-label="List view"
      >
        <List className="h-3.5 w-3.5" />
      </button>
      <div className="absolute inset-0.5 pointer-events-none">
        <motion.div
          className="h-full bg-guild-green-500 rounded shadow-sm"
          initial={false}
          animate={{
            x: mode === "grid" ? 0 : "100%",
            width: "50%",
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        />
      </div>
    </div>
  );
}

interface NFTsTabProps {
  address: string;
}

export default function NFTsTab({ address }: NFTsTabProps) {
  const { data: tokens, isLoading } = useGetAccountTokens(address, 100);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const convertIpfsToHttps = (ipfsUrl: string) => {
    if (!ipfsUrl) return "";
    if (ipfsUrl.startsWith("ipfs://")) {
      return `https://gateway.pinata.cloud/ipfs/${ipfsUrl.replace(
        "ipfs://",
        "",
      )}`;
    }
    return ipfsUrl;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <ViewToggle mode={viewMode} setMode={setViewMode} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <EnhancedSkeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <EmptyState
        icon={<ImageIcon className="h-12 w-12" />}
        title="No NFTs Found"
        description="This account doesn't currently own any NFTs."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {tokens.length} NFT{tokens.length !== 1 ? "s" : ""}
        </span>
        <ViewToggle mode={viewMode} setMode={setViewMode} />
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tokens.map((token) => (
            <Card key={token.token_data_id} className="overflow-hidden">
              <div className="aspect-square relative bg-muted flex items-center justify-center overflow-hidden">
                {token.current_token_data?.token_uri ? (
                  <img
                    src={convertIpfsToHttps(
                      token.current_token_data.token_uri,
                    )}
                    alt={token.current_token_data.token_name}
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove(
                        "hidden",
                      );
                    }}
                  />
                ) : null}
                <div className="hidden absolute inset-0 items-center justify-center text-muted-foreground/20 group-hover:flex">
                  <ImageIcon className="h-12 w-12" />
                </div>
                {!token.current_token_data?.token_uri && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
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
                  title={
                    token.current_token_data?.current_collection
                      ?.collection_name
                  }
                >
                  {token.current_token_data?.current_collection
                    ?.collection_name || "Unknown Collection"}
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
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card className="overflow-hidden divide-y divide-border/40">
          {tokens.map((token) => (
            <div
              key={token.token_data_id}
              className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              {/* Thumbnail */}
              <div className="h-12 w-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                {token.current_token_data?.token_uri ? (
                  <img
                    src={convertIpfsToHttps(
                      token.current_token_data.token_uri,
                    )}
                    alt={token.current_token_data.token_name}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove(
                        "hidden",
                      );
                    }}
                  />
                ) : null}
                {!token.current_token_data?.token_uri && (
                  <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                )}
                <div className="hidden">
                  <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3
                  className="text-sm font-semibold truncate"
                  title={token.current_token_data?.token_name}
                >
                  {token.current_token_data?.token_name || "Unknown Token"}
                </h3>
                <span
                  className="text-xs text-muted-foreground truncate block"
                  title={
                    token.current_token_data?.current_collection
                      ?.collection_name
                  }
                >
                  {token.current_token_data?.current_collection
                    ?.collection_name || "Unknown Collection"}
                </span>
              </div>

              {/* Token ID */}
              <div className="hidden sm:block text-xs text-muted-foreground shrink-0">
                <CopyableAddress
                  address={token.token_data_id}
                  truncateLength={{ start: 6, end: 4 }}
                  showCopyButton={false}
                />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
