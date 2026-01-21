import { CopyableAddress } from "@/components/common/CopyableAddress";
import { Badge } from "@/components/ui/badge";

interface AccountTitleProps {
  address: string;
  isObject?: boolean;
  isToken?: boolean;
  isDeleted?: boolean;
}

export default function AccountTitle({
  address,
  isObject = false,
  isToken = false,
  isDeleted = false,
}: AccountTitleProps) {
  let title = "Account";
  if (isToken) {
    title = isDeleted ? "Deleted Token Object" : "Token Object";
  } else if (isObject) {
    title = isDeleted ? "Deleted Object" : "Object";
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {isDeleted && <Badge variant="destructive">Deleted</Badge>}
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <CopyableAddress
          address={address}
          showFull
          showCopyButton
          className="text-lg"
        />
      </div>
    </div>
  );
}
