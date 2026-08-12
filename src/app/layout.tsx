import AreaLaunchStatusBar from "@/components/AreaLaunchStatusBar";
import SiteFooter from "@/components/SiteFooter";

import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AREA523",
  description: "AREA523",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-[#090b0e] text-white">
        <div className="flex min-h-screen flex-col">
          <AreaLaunchStatusBar />

          <div className="flex-1">
            {children}
          </div>

          <SiteFooter />
        </div>
      </body>
    </html>
  );
}