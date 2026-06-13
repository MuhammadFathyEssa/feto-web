import type { Metadata, Viewport } from "next";
import "./globals.css";
import IdleTimeout from "./components/IdleTimeout";

export const metadata: Metadata = {
  title: "FeTo — Enterprise AI Assistant",
  description: "Enterprise AI Operating System for banking and financial institutions",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "FeTo" },
};

export const viewport: Viewport = {
  themeColor: "#040d1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#040d1a] text-slate-200 antialiased">
        <IdleTimeout />
        {children}
      </body>
    </html>
  );
}
