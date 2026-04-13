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
  title: "Flow Social — AI Instagram Content Engine for Founders",
  description:
    "Flow Social turns your brand story into a full week of premium Instagram content, written, designed, and scheduled automatically. No agency. No freelancer. No time wasted.",
  keywords: [
    "Instagram content tool for founders",
    "AI Instagram scheduling for CPG brands",
    "social media automation for food brands",
    "Instagram content generator for product brands",
    "AI social media manager",
  ],
  openGraph: {
    title: "Flow Social — AI Instagram Content Engine for Founders",
    description:
      "One click generates 7 days of on-brand Instagram content and schedules it automatically. Built for consumer product founders.",
    url: "https://flowsocial.ai",
    siteName: "Flow Social",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flow Social — AI Instagram Content Engine for Founders",
    description:
      "One click generates 7 days of on-brand Instagram content and schedules it automatically.",
  },
  metadataBase: new URL("https://flowsocial.ai"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
      <body style={{ margin: 0, padding: 0, background: "#0A0A0A" }}>
        {children}
      </body>
    </html>
  );
}