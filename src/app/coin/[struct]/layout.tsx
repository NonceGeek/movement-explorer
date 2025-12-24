import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coin",
};

export default function CoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
