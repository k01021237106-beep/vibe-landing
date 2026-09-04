import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/config";
import { getPublishedCourses } from "@/lib/content";

/**
 * sitemap.xml
 *
 * 공개된 강의는 데이터베이스에서 읽는다 — 강의를 추가하면 사이트맵도 따라 늘어난다.
 * 강의를 열 때마다 코드를 고쳐야 한다면 언젠가 빠뜨린다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/courses`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/free`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/legal/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/refund`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const courses = await getPublishedCourses();
    return [
      ...staticPages,
      ...courses.map((course) => ({
        url: `${base}/courses/${course.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch (cause) {
    // 데이터베이스에 닿지 못해도 고정 페이지 사이트맵은 내보낸다.
    console.error("[sitemap] 강의 목록을 읽지 못했습니다", cause);
    return staticPages;
  }
}
