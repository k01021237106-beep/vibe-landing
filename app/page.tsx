import { notFound } from "next/navigation";

import { Audience } from "@/components/landing/audience";
import { Curriculum } from "@/components/landing/curriculum";
import { FaqSection } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { Instructor } from "@/components/landing/instructor";
import { Outcome } from "@/components/landing/outcome";
import { PainRelief } from "@/components/landing/pain-relief";
import { Pricing } from "@/components/landing/pricing";
import { Reviews } from "@/components/landing/reviews";
import { CourseJsonLd } from "@/components/seo/json-ld";
import { flagshipCourseSlug } from "@/lib/config";
import { getCoursePageData } from "@/lib/content";

/*
 * 랜딩. 섹션 순서는 의도적이다.
 *
 *   Hero → 이런 분을 위한 → 페인 해소 → 만들 결과물 → 커리큘럼
 *   → 강사 → 샘플 후기 → 가격 → FAQ → 최종 CTA → Footer
 *
 * 가격이 뒤쪽에 있고 무료 1강 CTA가 앞에 있다.
 * 목표 행동이 결제가 아니라 무료 1강 신청이기 때문이다.
 */
export default async function Home() {
  const data = await getCoursePageData(flagshipCourseSlug);
  if (!data) notFound();

  const { course, lessons, reviews, faqs } = data;

  return (
    <>
      <CourseJsonLd course={course} lessonCount={lessons.length} faqs={faqs} />
      <Hero courseTitle={course.title} />
      <Audience />
      <PainRelief />
      <Outcome />
      <Curriculum lessons={lessons} />
      <Instructor />
      <Reviews reviews={reviews} />
      <Pricing course={course} />
      <FaqSection faqs={faqs} />
      <FinalCta />
    </>
  );
}
