"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type WalletMenuProps = {
  anchorEl: HTMLButtonElement | null;
  onClose: () => void;
  handleNavigate?: () => void;
};

export default function WalletMenu({
  anchorEl,
  onClose,
  handleNavigate,
}: WalletMenuProps) {
  const { account, disconnect } = useWallet();
  const router = useRouter();
  const isOpen = Boolean(anchorEl);

  const [tooltipVisible, setTooltipVisible] = useState(false);

  const addressStr = account?.address?.toString();

  const copyAddress = async () => {
    if (addressStr) {
      await navigator.clipboard.writeText(addressStr);
      setTooltipVisible(true);
      setTimeout(() => setTooltipVisible(false), 2000);
    }
  };

  const handleAccountClick = () => {
    if (handleNavigate) {
      handleNavigate();
    } else if (addressStr) {
      router.push(`/account/${addressStr}`);
    }
    onClose();
  };

  const handleLogout = () => {
    disconnect();
    onClose();
  };

  if (!isOpen) return null;

  // Calculate position based on anchor element
  const rect = anchorEl?.getBoundingClientRect();
  const top = rect ? rect.bottom + 8 : 0;
  const right = rect ? window.innerWidth - rect.right : 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div
        className="fixed z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px]"
        style={{ top, right }}
      >
        <button
          onClick={copyAddress}
          className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors relative"
        >
          Copy Address
          {tooltipVisible && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              Copied!
            </span>
          )}
        </button>

        <button
          onClick={handleAccountClick}
          className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
        >
          View Account
        </button>

        <div className="border-t border-border my-1" />

        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors text-destructive"
        >
          Disconnect
        </button>
      </div>
    </>
  );
}
