import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const appUrl = process.env.APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "FurnitureX — Furniture marketplace",
    template: "%s | FurnitureX",
  },
  description:
    "FurnitureX is a multi-vendor furniture marketplace connecting independent makers with customers. Cash on Delivery, USD pricing, reviewed listings.",
  applicationName: "FurnitureX",
  keywords: [
    "furniture marketplace",
    "independent furniture makers",
    "sofas",
    "dining tables",
    "furniture",
    "cash on delivery furniture",
  ],
  authors: [{ name: "FurnitureX" }],
  openGraph: {
    type: "website",
    siteName: "FurnitureX",
    title: "FurnitureX — Furniture marketplace",
    description:
      "A marketplace for furniture from independent makers. Every listing reviewed. Cash on Delivery.",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "FurnitureX",
    description: "Furniture marketplace.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
