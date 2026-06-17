import type { Metadata, Viewport } from "next";
import "./globals.css";
import IdleTimeout from "./components/IdleTimeout";

export const metadata: Metadata = {
  title: "FeTo — منصة الذكاء الاصطناعي التنفيذي",
  description: "منصة ذكاء اصطناعي تنفيذية مخصصة للقطاع المصرفي والمؤسسات المالية. 13 وكيل ذكاء اصطناعي متخصص، أمان بمعايير banking-grade.",
  metadataBase: new URL("https://feto.live"),
  keywords: ["AI banking", "executive AI assistant", "FeTo", "فيتو", "ذكاء اصطناعي", "قطاع مصرفي", "banking AI", "financial AI"],
  verification: { google: "AGXRYf1ZDZXwjGB2sTHP_GSPje6hV0458Ure9U_LJSE" },
  openGraph: {
    title: "FeTo — منصة الذكاء الاصطناعي التنفيذي",
    description: "منصة ذكاء اصطناعي تنفيذية مخصصة للقطاع المصرفي والمؤسسات المالية. 13 وكيل ذكاء اصطناعي متخصص.",
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
    <html lang="ar">
      <body className="bg-[#040d1a] text-slate-200 antialiased">
        <IdleTimeout />
        {children}
      </body>
    </html>
  );
}
