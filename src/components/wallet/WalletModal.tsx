"use client";

import {
  useWallet,
  AdapterWallet,
  AdapterNotDetectedWallet,
} from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UNSUPPORTED_WALLETS = [
  "Dev T wallet",
  "Pontem Wallet",
  "TrustWallet",
  "TokenPocket",
  "Martian",
  "Rise",
  // Aptos Connect (Google/Apple) - not used in source project
  "Continue with Google",
  "Continue with Apple",
  "Google",
  "Apple",
];

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [expanded, setExpanded] = useState(false);
  const { wallets = [], notDetectedWallets = [], connect } = useWallet();

  function filterWallets<T extends { name: string }>(
    walletList: ReadonlyArray<T>
  ): T[] {
    return walletList
      .filter(
        (wallet, index, self) =>
          self.findIndex((w) => w.name === wallet.name) === index
      )
      .filter((wallet) => {
        if (!wallet) return false;
        if (UNSUPPORTED_WALLETS.includes(wallet.name)) {
          return false;
        }
        return true;
      });
  }

  const filteredDetectedWallets = filterWallets(wallets);
  const filteredNotDetectedWallets = filterWallets(notDetectedWallets);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>

        {/* Available Wallets */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {filteredDetectedWallets.map((wallet) => (
            <DetectedWalletRow
              key={wallet.name}
              wallet={wallet}
              onConnect={() => {
                connect(wallet.name);
                onClose();
              }}
            />
          ))}

          {/* Not Detected Wallets Expand */}
          {!!filteredNotDetectedWallets.length && (
            <>
              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>More Wallets</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${
                    expanded ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {expanded && (
                <div className="space-y-2">
                  {filteredNotDetectedWallets.map((wallet) => (
                    <NotDetectedWalletRow key={wallet.name} wallet={wallet} />
                  ))}
                </div>
              )}
            </>
          )}

          {filteredDetectedWallets.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No wallets detected. Please install a wallet extension.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DetectedWalletRowProps {
  wallet: AdapterWallet;
  onConnect: () => void;
}

function DetectedWalletRow({ wallet, onConnect }: DetectedWalletRowProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={onConnect}
    >
      {wallet.icon && (
        <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 rounded" />
      )}
      <span className="flex-1 font-medium">{wallet.name}</span>
      <button className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
        Connect
      </button>
    </div>
  );
}

interface NotDetectedWalletRowProps {
  wallet: AdapterNotDetectedWallet;
}

function NotDetectedWalletRow({ wallet }: NotDetectedWalletRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg opacity-70">
      {wallet.icon && (
        <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 rounded" />
      )}
      <span className="flex-1 font-medium">{wallet.name}</span>
      {wallet.url ? (
        <a
          href={wallet.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Install
        </a>
      ) : (
        <span className="px-3 py-1 text-sm text-muted-foreground">
          Not Installed
        </span>
      )}
    </div>
  );
}
