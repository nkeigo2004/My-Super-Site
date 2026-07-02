import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScrollProgress } from "@/components/ScrollProgress";
import { CommandPalette } from "@/components/CommandPalette";
import { profile } from "@/content/profile";
import { site } from "@/content/site";
import { getLang } from "@/lib/lang";

// 英字フォント（next/font が自動でホスティング）
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s ・ ${site.name}` },
  description: profile.tagline.ja,
  openGraph: {
    title: site.name,
    description: profile.tagline.ja,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = getLang();
  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <head>
        {/* 保存済みの表示設定を描画前に適用（切り替え時のちらつき防止） */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme');if(t){d.setAttribute('data-theme',t);}var rm=localStorage.getItem('reduce-motion');if(rm==='true'){d.setAttribute('data-reduce-motion','true');}var ts=localStorage.getItem('text-size');if(ts){d.setAttribute('data-text-size',ts);}}catch(e){}})();",
          }}
        />
        {/* 日本語フォント（IBM Plex Sans JP）。英字フォントと自然に馴染みます */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <ScrollProgress />
        <CommandPalette />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
