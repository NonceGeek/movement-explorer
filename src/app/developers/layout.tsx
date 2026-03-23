import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developers | Movement Explorer",
  description:
    "Explore the Movement blockchain API, generate API keys, and integrate with your applications.",
};

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
