"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonViewer } from "@/components/ui/json-viewer";
import { TokenData } from "@/hooks/tokens/useGetTokenData";

interface TokenDetailInfoCardProps {
  token: TokenData;
}

// Content row component for displaying key-value pairs
function ContentRow({
  title,
  value,
  isLast = false,
}: {
  title: string;
  value: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-start py-3 ${!isLast ? "border-b border-border/50" : ""}`}
    >
      <span className="text-muted-foreground shrink-0">{title}</span>
      <div className="text-right ml-4">{value}</div>
    </div>
  );
}

// Full-width content row component (for JSON display)
function FullWidthContentRow({
  title,
  value,
  isLast = false,
}: {
  title: string;
  value: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className={`py-3 ${!isLast ? "border-b border-border/50" : ""}`}>
      <span className="text-muted-foreground block mb-2">{title}</span>
      <div>{value}</div>
    </div>
  );
}

export function TokenDetailInfoCard({ token }: TokenDetailInfoCardProps) {
  const hasTokenProperties =
    token.token_properties && Object.keys(token.token_properties).length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Token Details</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Collection ID (v2 only) */}
        {token.token_standard === "v2" && (
          <ContentRow
            title="Collection ID:"
            value={
              token.current_collection?.collection_id ? (
                <span className="font-mono text-sm break-all">
                  {token.current_collection.collection_id}
                </span>
              ) : (
                <span className="text-muted-foreground">N/A</span>
              )
            }
          />
        )}

        {/* Token ID (v2 only) */}
        {token.token_standard === "v2" && (
          <ContentRow
            title="Token ID:"
            value={
              token.token_data_id ? (
                <span className="font-mono text-sm break-all">
                  {token.token_data_id}
                </span>
              ) : (
                <span className="text-muted-foreground">N/A</span>
              )
            }
          />
        )}

        {/* Largest Property Version (v1 only) */}
        {token.largest_property_version_v1 && (
          <ContentRow
            title="Largest Property Version:"
            value={
              <span className="font-mono">
                {token.largest_property_version_v1}
              </span>
            }
          />
        )}

        {/* Supply - always show */}
        <ContentRow
          title="Supply:"
          value={
            <span className="font-mono">
              {token.current_collection?.current_supply ?? "N/A"}
            </span>
          }
        />

        {/* Maximum - always show */}
        <ContentRow
          title="Maximum:"
          value={
            <span className="font-mono">
              {token.current_collection?.max_supply ?? "N/A"}
            </span>
          }
        />

        {/* Token Properties - always show, use full-width only when has data */}
        {hasTokenProperties ? (
          <FullWidthContentRow
            title="Token Properties:"
            value={<JsonViewer data={token.token_properties} initialDepth={1} />}
          />
        ) : (
          <ContentRow
            title="Token Properties:"
            value={<span className="font-mono">N/A</span>}
          />
        )}

        {/* Last Transaction */}
        <ContentRow
          title="Last Transaction:"
          value={
            token.last_transaction_version ? (
              <Link
                href={`/txn/${token.last_transaction_version}`}
                className="text-primary hover:underline font-mono"
              >
                {token.last_transaction_version}
              </Link>
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )
          }
          isLast
        />
      </CardContent>
    </Card>
  );
}
