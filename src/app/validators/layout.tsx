import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Validators",
};

export default function ValidatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
