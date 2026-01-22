import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { CopyableAddress } from "@/components/common/CopyableAddress";

interface Collection {
  collection_id?: string;
  collection_name: string;
  creator_address: string;
  description?: string;
  uri?: string;
  current_supply?: number;
  max_supply?: number | null;
}

interface CollectionInfoCardProps {
  collection?: Collection | null;
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

export function CollectionInfoCard({ collection }: CollectionInfoCardProps) {
  // Show N/A card if no collection data
  if (!collection) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">N/A</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Collection</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Collection Name */}
        <ContentRow
          title="Name:"
          value={
            <span className="font-medium">
              {collection.collection_name || "N/A"}
            </span>
          }
        />

        {/* Creator */}
        <ContentRow
          title="Creator:"
          value={
            collection.creator_address ? (
              <CopyableAddress
                address={collection.creator_address}
                href={`/account/${collection.creator_address}`}
                variant="label"
                showLabel
                truncateLength={{ start: 6, end: 4 }}
              />
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )
          }
        />

        {/* Description */}
        <ContentRow
          title="Description:"
          value={
            collection.description ? (
              <span className="text-sm">{collection.description}</span>
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )
          }
        />

        {/* Collection URI */}
        <ContentRow
          title="URI:"
          value={
            collection.uri ? (
              <a
                href={collection.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 justify-end"
              >
                View
                <ExternalLink className="h-3 w-3" />
              </a>
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
