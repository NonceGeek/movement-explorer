import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transaction Details",
};

export default function TxnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
