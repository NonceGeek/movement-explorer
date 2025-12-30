"use client";

import { useState } from "react";
import WalletButton from "./WalletButton";
// import WalletModal from "./WalletModal";
import { WalletModal } from "@movementlabsxyz/movement-design-system";

export interface WalletConnectorProps {
  handleNavigate?: () => void;
}

export function WalletConnector({ handleNavigate }: WalletConnectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalOpen = () => setIsModalOpen(true);
  const handleModalClose = () => setIsModalOpen(false);

  return (
    <>
      <WalletButton
        handleModalOpen={handleModalOpen}
        handleNavigate={handleNavigate}
      />
      {/* <WalletModal isOpen={isModalOpen} onClose={handleModalClose} /> */}
      {isModalOpen && <WalletModal onClose={handleModalClose} />}
    </>
  );
}
