import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barking Beaver — Your personal music radar",
  description:
    "No feed. No black-box algorithm. Just the releases, shows and stories that matter to you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
        {children}
      </body>
    </html>
  );
}
