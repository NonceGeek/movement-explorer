import { Types } from "aptos";
import { Card, CardContent } from "@/components/ui/card";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { standardizeAddress } from "@/utils";

interface InfoTabProps {
  address: string;
  accountData?: Types.AccountData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objectData?: any; // Replace with proper type if available
}

export default function InfoTab({
  address,
  accountData,
  objectData,
}: InfoTabProps) {
  if (!accountData && !objectData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No account info available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {accountData && (
        <Card>
          <CardContent className="pt-6 grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border-b pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-muted-foreground">
                  Sequence Number
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        The number of transactions submitted by this account
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="md:col-span-2 font-mono text-sm">
                {accountData.sequence_number}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-muted-foreground">
                  Authentication Key
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        The cryptographic key used to authenticate this account
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="md:col-span-2">
                <CopyableAddress
                  address={accountData.authentication_key}
                  showFull
                  showCopyButton
                  className="text-sm"
                />
                {standardizeAddress(address) !==
                  standardizeAddress(accountData.authentication_key) && (
                  <div className="text-xs text-muted-foreground mt-1">
                    (rotated)
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {objectData && (
        <Card>
          <CardContent className="pt-6 grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-muted-foreground">
                  Owner
                </span>
              </div>
              <div className="md:col-span-2">
                <CopyableAddress
                  address={objectData.data.owner}
                  showFull
                  showCopyButton
                  className="text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-muted-foreground">
                  Transferrable
                </span>
              </div>
              <div className="md:col-span-2 font-mono text-sm">
                {objectData.data.allow_ungated_transfer ? "Yes" : "No"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
