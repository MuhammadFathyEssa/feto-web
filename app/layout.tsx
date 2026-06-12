import type { Metadata } from "next";
import "./globals.css";
import IdleTimeout from "./components/IdleTimeout";

export const metadata: Metadata = {
  title: "FeTo — Enterprise AI Assistant",
  description: "Enterprise AI Operating System for banking and financial institutions",
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
