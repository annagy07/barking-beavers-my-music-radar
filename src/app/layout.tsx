import type { Metadata } from "next";
import { Anton } from "next/font/google";
import "./globals.css";

// The poster logo's bold, tall, condensed all-caps wordmark — Anton is the
// closest widely-available match, used for every headline (.font-display)
// and the text wordmark (.font-brand) so the site actually looks like the
// same brand as the logo, not a different typeface pretending to.
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Barking Beaver — Your personal music radar",
  description:
    "No feed. No black-box algorithm. Just the releases, shows and stories that matter to you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${anton.variable}`}>
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
        {children}
      </body>
    </html>
  );
}
