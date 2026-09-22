import type { Metadata, Viewport } from "next";
import { Caveat, Geist_Mono, Newsreader, Work_Sans } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sans = Work_Sans({ variable: "--font-sans", subsets: ["latin"] });

// Newsreader carries an optical-size axis, so headings are shaped for their
// size rather than scaled from one master. See font-optical-sizing in globals.
const heading = Newsreader({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Handwritten accent for the tagline. Swap the import to change the voice.
const hand = Caveat({ variable: "--font-hand", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "BinThere", template: "%s · BinThere" },
  description: "Notes for your totes. Scan a tote, see what's inside.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "BinThere", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // Chrome's autofill adds __gcrremoteframetoken here before hydration.
      suppressHydrationWarning
      className={`${sans.variable} ${heading.variable} ${mono.variable} ${hand.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
