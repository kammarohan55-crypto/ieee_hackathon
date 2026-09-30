import type { Metadata } from "next";
import "./globals.css";
import "./experience.css";
import "./field.css";

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
