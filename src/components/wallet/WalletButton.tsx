"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import WalletMenu from "./WalletMenu";

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
      <button
        onClick={connected ? handleClick : onConnectWalletClick}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
      >
        {connected ? (
          <>
            {wallet?.icon && (
              <img
                src={wallet.icon}
                alt={wallet.name}
                className="w-5 h-5 rounded-full"
              />
            )}
            <span className="font-mono text-sm">
              {truncateAddress(addressStr)}
            </span>
          </>
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>
      <WalletMenu
        anchorEl={menuAnchor}
        onClose={handleMenuClose}
        handleNavigate={handleNavigate}
      />
    </>
  );
}
