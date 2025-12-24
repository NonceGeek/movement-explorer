import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Block Details",
};

export default function BlockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
