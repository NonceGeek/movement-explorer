import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions",
};

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
