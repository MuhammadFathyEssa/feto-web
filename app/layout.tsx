import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import IdleTimeout from "./components/IdleTimeout";
import Footer from "./components/Footer";

// Nonce-based CSP requires dynamic rendering. Reading headers() opts every route
// into dynamic rendering so the per-request nonce reaches the framework script tags.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FeTo — منصة الذكاء الاصطناعي التنفيذي",
  description: "منصة ذكاء اصطناعي تنفيذية مخصصة للقطاع المصرفي والمؤسسات المالية. 23 وكيل ذكاء اصطناعي متخصص، أمان بمعايير banking-grade.",
  metadataBase: new URL("https://feto.live"),
  keywords: ["AI banking", "executive AI assistant", "FeTo", "فيتو", "ذكاء اصطناعي", "قطاع مصرفي", "banking AI", "financial AI"],
  verification: { google: "AGXRYf1ZDZXwjGB2sTHP_GSPje6hV0458Ure9U_LJSE" },
  openGraph: {
    title: "FeTo — منصة الذكاء الاصطناعي التنفيذي",
    description: "منصة ذكاء اصطناعي تنفيذية مخصصة للقطاع المصرفي والمؤسسات المالية. 23 وكيل ذكاء اصطناعي متخصص.",
    url: "https://feto.live",
    siteName: "FeTo",
    locale: "ar_EG",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FeTo — منصة الذكاء الاصطناعي التنفيذي" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FeTo — منصة الذكاء الاصطناعي التنفيذي",
    description: "منصة ذكاء اصطناعي تنفيذية مخصصة للقطاع المصرفي والمؤسسات المالية.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  authors: [{ name: "Muhammad Fathy" }],
  other: {
    "copyright": "© 2026 Muhammad Fathy. All Rights Reserved.",
    "rights": "Proprietary. Unauthorized use, copying, or AI training prohibited.",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "FeTo" },
};

export const viewport: Viewport = {
  themeColor: "#040d1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? "";
  return (
    <html lang="ar">
      <body className="bg-[#040d1a] text-slate-200 antialiased" data-nonce={nonce}>
        <IdleTimeout />
        {children}
        <Footer />
      </body>
    </html>
  );
}
