import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
import "./experience.css";
import "./field.css";
import "./river.css";
import "./atlas.css";
import "./evidence-trail.css";
import "./evidence-lab.css";
import "./workspace.css";
import "./console.css";
import "./geographic-map.css";
import "./european-context.css";
import "./presentation.css";
import "./showcase.css";
import "./immersive.css";
import "./review-atmosphere.css";

export const metadata: Metadata = {
  title: "AquaLens — Evidence in focus",
  manifest: "/manifest.webmanifest",
  description:
    "Evidence-led stream observations. Clarify uncertainty, preserve original evidence, and keep human judgment at the center.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
