import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import Providers from "./providers";
import { Header, Footer, LayoutBackground } from "@/components/layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <NextTopLoader color="#58c589" showSpinner={false} />
        <Providers>
          <LayoutBackground>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </LayoutBackground>
        </Providers>
      </body>
    </html>
  );
}
