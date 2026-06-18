import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/request-access"],
        disallow: [
          "/app",
          "/admin",
          "/api/",
          "/dashboard",
          "/settings",
          "/reset-password",
          "/forgot-password",
          "/recruiter",
        ],
      },
    ],
    sitemap: "https://feto.live/sitemap.xml",
  };
}
