import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AddictionTracker — Track Your Recovery Journey",
  description:
    "A private, secure addiction recovery tracker. Monitor your streaks, celebrate milestones, and take control of your journey — one day at a time.",
  keywords: ["addiction", "recovery", "tracker", "streak", "sobriety", "health"],
  openGraph: {
    title: "AddictionTracker",
    description: "Track your recovery journey. One day at a time.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
