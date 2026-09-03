import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { site } from "@/lib/config";
import "./globals.css";

/** 코드 표기용. 본문(Pretendard)·헤드라인(Paperlogy)은 globals.css에서 다룬다. */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={jetbrainsMono.variable}>
      <head>
        {/*
          자체 호스팅 본문 폰트. prebuild 단계에서 scripts/setup-fonts.mjs가
          public/fonts/ 아래에 생성하므로 번들러가 거치지 않는 정적 파일이다.
          (no-css-tags 규칙은 번들러가 처리할 CSS를 대상으로 하므로 여기서는 해당 없음)
        */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/fonts/pretendard.css" />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-5 focus:py-3 focus:text-accent-fg"
        >
          본문으로 건너뛰기
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
