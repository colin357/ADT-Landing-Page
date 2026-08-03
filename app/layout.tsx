import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ADT-Monitored Home Security | Free Quote — Install in 48 Hours",
  description:
    "Get a free quote on an ADT-monitored home security system. Professional install within 48 hours. 68% of home invasions happen in a homeowner's first year — don't wait.",
  openGraph: {
    title: "ADT-Monitored Home Security | Free Quote",
    description:
      "Professional install within 48 hours. Get your free quote in under a minute.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b3d91",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
