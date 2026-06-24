import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "./pwa-register";
import { InstallPrompt } from "./install-prompt";

export const metadata: Metadata = {
  title: "Toki — Student Deadline Planner",
  description: "Agnes-powered AI agent for student deadlines, task lists, plans, and reminders",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Toki — Student Deadline Planner",
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  themeColor: "#0b0f0d",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
