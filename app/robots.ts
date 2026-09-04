import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/config";

/**
 * robots.txt
 *
 * 로그인해야 보이는 곳과 개인별 화면은 검색 결과에 있을 이유가 없다.
 * 크롤러가 그쪽을 파 봤자 로그인 화면만 계속 만나므로 서로 낭비다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/my/", // 내 강의실 — 개인별 화면
        "/admin", // 관리자
        "/checkout/", // 결제 진행·결과
        "/free/watch", // 신청자만 보는 화면
        "/auth/", // 로그인 콜백
        "/api/", // 서버 처리 전용
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
