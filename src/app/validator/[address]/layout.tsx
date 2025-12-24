import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Validator",
};

export default function ValidatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
