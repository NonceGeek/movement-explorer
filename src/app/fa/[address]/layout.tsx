import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fungible Asset",
};

export default function FALayout({ children }: { children: React.ReactNode }) {
  return children;
}
