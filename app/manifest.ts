import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lahza | لحظة",
    short_name: "Lahza",
    description: "Short, friendly journeys through the Islamic moments you'll notice at work.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF7F2",
    theme_color: "#0F4C5C",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
