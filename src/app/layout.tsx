import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
});

export const metadata: Metadata = {
  title: "Flow Social — The AI Brand Engine That Replaces Your Agency",
  description: "Flow Social replaces your social media agency. AI-powered content strategy, captions, images, and scheduling — built from your brand DNA, generated in seconds. Now in beta.",
  keywords: [
    "replace social media agency",
    "AI content engine for brands",
    "Instagram automation for founders",
    "AI brand content generator",
    "social media agency alternative",
    "CPG brand content automation",
    "consumer brand Instagram tool",
  ],
  openGraph: {
    title: "Flow Social — The AI Brand Engine That Replaces Your Agency",
    description: "Stop paying agency retainers. Flow Social generates a full week of on-brand Instagram content in 30 seconds — strategy, captions, images, scheduled automatically.",
    url: "https://flowsocial.ai",
    siteName: "Flow Social",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flow Social — The AI Brand Engine That Replaces Your Agency",
    description: "Stop paying agency retainers. Flow Social generates a full week of on-brand Instagram content in 30 seconds.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  metadataBase: new URL("https://flowsocial.ai"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
