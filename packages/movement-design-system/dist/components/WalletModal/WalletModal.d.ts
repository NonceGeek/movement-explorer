import { WalletSortingOptions } from '@aptos-labs/wallet-adapter-react';
export interface ConnectWalletDialogProps extends WalletSortingOptions {
    onClose: () => void;
}
export declare function WalletModal({ onClose, ...walletSortingOptions }: ConnectWalletDialogProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=WalletModal.d.ts.map