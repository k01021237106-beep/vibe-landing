import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";

import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSiteUrl, site } from "@/lib/config";
import { getCurrentUser } from "@/lib/supabase/server";
import "./globals.css";

/** 코드 표기용. 본문(Pretendard)·헤드라인(Paperlogy)은 globals.css에서 다룬다. */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // 상대 주소를 절대 주소로 바꿀 기준. 이게 없으면 공유 카드 이미지가 깨진다.
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "바이브코딩",
    "AI 코딩",
    "비개발자 코딩",
    "코딩 입문",
    "온라인 강의",
    "배포",
    "노코드",
  ],
  authors: [{ name: site.name }],
  creator: site.name,
  openGraph: {
    type: "website",
    locale: site.locale,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  alternates: { canonical: "/" },
  formatDetection: {
    // 전화번호를 브라우저가 멋대로 링크로 바꾸면 본문 디자인이 흐트러진다.
    telephone: false,
  },
};

/*
 * 로그인 여부를 서버에서 읽어 헤더에 내려 준다.
 * 이 때문에 모든 페이지가 동적 렌더링이 된다 — 헤더가 잠깐 틀린 상태로 보였다가
 * 바뀌는 것보다 낫다고 판단했다. 시니어 사용자에게 깜빡임은 혼란이다.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="ko" className={jetbrainsMono.variable}>
      <head>
        {/*
          자체 호스팅 본문 폰트. prebuild 단계에서 scripts/setup-fonts.mjs가
          public/fonts/ 아래에 생성하므로 번들러가 거치지 않는 정적 파일이다.
          (no-css-tags 규칙은 번들러가 처리할 CSS를 대상으로 하므로 여기서는 해당 없음)
        */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-5 focus:py-3 focus:text-accent-fg"
        >
          본문으로 건너뛰기
        </a>
        <SiteHeader isSignedIn={Boolean(user)} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter isSignedIn={Boolean(user)} />
      </body>
    </html>
  );
}
