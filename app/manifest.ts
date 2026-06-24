import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Toki — Student Deadline Planner",
    short_name: "Toki",
    description: "Agnes-powered student deadline extraction, planning, and reminders.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b0f0d",
    theme_color: "#0b0f0d",
    orientation: "portrait-primary",
    categories: ["productivity", "education"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
