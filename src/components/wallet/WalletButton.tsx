"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import WalletMenu from "./WalletMenu";
import {
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@movementlabsxyz/movement-design-system";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type WalletButtonProps = {
  handleModalOpen: () => void;
  handleNavigate?: () => void;
};

function truncateAddress(address: string | undefined): string {
  if (!address) return "";
  const str = address.toString();
  if (str.length <= 10) return str;
  return `${str.slice(0, 6)}...${str.slice(-4)}`;
}

export default function WalletButton({
  handleModalOpen,
  handleNavigate,
}: WalletButtonProps) {
  const { connected, account, wallet } = useWallet();

  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const onConnectWalletClick = () => {
    handleMenuClose();
    handleModalOpen();
  };

  const addressStr = account?.address?.toString();

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={connected ? handleClick : onConnectWalletClick}
              variant={connected ? "outline" : "default"}
              size="default"
              className={cn("gap-2 font-medium")}
            >
              {connected ? (
                <>
                  <Avatar border="guild" className="h-6 w-6">
                    <AvatarImage src={wallet?.icon} alt={wallet?.name} />
                    <AvatarFallback className="text-xs bg-moveus-marigold-500 text-black">
                      {wallet?.name?.[0] || "W"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-mono text-sm">
                    {truncateAddress(addressStr)}
                  </span>
                </>
              ) : (
                <span>Connect Wallet</span>
              )}
            </Button>
          </TooltipTrigger>
          {connected && (
            <TooltipContent side="bottom">
              <p className="font-mono">{addressStr}</p>
              <p className="text-xs text-muted-foreground">{wallet?.name}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <WalletMenu
        anchorEl={menuAnchor}
        onClose={handleMenuClose}
        handleNavigate={handleNavigate}
      />
    </>
  );
}
