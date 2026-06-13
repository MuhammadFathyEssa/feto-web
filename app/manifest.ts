import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FeTo — Enterprise AI Assistant",
    short_name: "FeTo",
    description: "Executive AI assistant for banking and financial institutions",
    start_url: "/",
    display: "standalone",
    background_color: "#040d1a",
    theme_color: "#040d1a",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
