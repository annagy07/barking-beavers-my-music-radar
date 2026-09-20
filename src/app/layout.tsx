import type { Metadata } from "next";
import { Anton } from "next/font/google";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.siteTitle,
    description: dict.landing.sub,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`h-full antialiased ${anton.variable}`}>
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
