import { useGetAccountTokens } from "@/hooks/accounts/useGetAccountTokens";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Image as ImageIcon } from "lucide-react";
import { CopyableAddress } from "@/components/common/CopyableAddress";

interface NFTsTabProps {
  address: string;
}

export default function NFTsTab({ address }: NFTsTabProps) {
  const { data: tokens, isLoading } = useGetAccountTokens(address, 100);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No NFTs found</p>
        </CardContent>
      </Card>
    );
  }

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tokens.map((token) => (
        <Card key={token.token_data_id} className="overflow-hidden">
          <div className="aspect-square relative bg-muted flex items-center justify-center overflow-hidden">
            {token.current_token_data?.token_uri ? (
              <img
                src={convertIpfsToHttps(token.current_token_data.token_uri)}
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
            {/* Fallback if no image or error */}
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
                token.current_token_data?.current_collection?.collection_name
              }
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
      ))}
    </div>
  );
}
