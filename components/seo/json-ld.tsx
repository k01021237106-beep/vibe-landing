import { getSiteUrl, site } from "@/lib/config";
import type { Course, Faq } from "@/lib/content";

/**
 * 구조화 데이터(JSON-LD).
 *
 * 검색 결과에 가격·평점·질문이 함께 보이게 하는 표시다.
 *
 * ⚠️ 화면에 없는 내용을 여기에 적으면 안 된다. 구글은 그걸 스팸으로 본다.
 *    특히 후기가 전부 샘플인 동안에는 aggregateRating을 넣지 않는다 —
 *    가짜 별점을 검색 결과에 띄우는 셈이고, 표시광고법 문제이기도 하다.
 */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // 구조화 데이터는 우리가 만든 값이고 사용자 입력이 아니다.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  const base = getSiteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: site.name,
        url: base,
        description: site.description,
        logo: `${base}/icon.svg`,
      }}
    />
  );
}

export function WebSiteJsonLd() {
  const base = getSiteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: site.name,
        url: base,
        inLanguage: "ko-KR",
      }}
    />
  );
}

export function CourseJsonLd({
  course,
  lessonCount,
  faqs,
}: {
  course: Course;
  lessonCount: number;
  faqs?: Faq[];
}) {
  const base = getSiteUrl();
  const url = `${base}/courses/${course.slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.title,
          description: course.description ?? course.subtitle ?? site.description,
          url,
          inLanguage: "ko-KR",
          provider: {
            "@type": "Organization",
            name: site.name,
            url: base,
          },
          // 온라인·자기주도 학습임을 명시한다
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
            courseWorkload: `PT${lessonCount}H`,
          },
          offers: {
            "@type": "Offer",
            price: course.sale_price,
            priceCurrency: "KRW",
            availability: "https://schema.org/InStock",
            url: `${base}/checkout/${course.slug}`,
          },
        }}
      />
      {faqs && faqs.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          }}
        />
      ) : null}
    </>
  );
}
