import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Latest Blocks",
};

export default function BlocksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
