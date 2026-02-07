import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import Providers from "./providers";
import { Header, Footer, LayoutBackground } from "@/components/layout";
import { ToasterProvider } from "@/components/common/ToasterProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Movement Explorer",
    template: "%s | Movement Explorer",
  },
  description:
    "Explore the Movement Network - Blocks, Transactions, and Accounts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased min-h-screen flex flex-col`}
      >
        <NextTopLoader color="#58c589" showSpinner={false} />
        <Providers>
          <LayoutBackground>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </LayoutBackground>
          <ToasterProvider />
        </Providers>
      </body>
    </html>
  );
}
