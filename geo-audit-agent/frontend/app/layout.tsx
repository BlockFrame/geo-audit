import ScifiBackground from "@/components/ScifiBackground";
import { CopilotKit } from "@copilotkit/react-core";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEO Audit Agent",
  description: "AI-powered Generative Engine Optimization analysis",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <ScifiBackground />
        <CopilotKit runtimeUrl="/api/copilotkit" agent="default" showDevConsole={false}>
          {children}
        </CopilotKit>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
