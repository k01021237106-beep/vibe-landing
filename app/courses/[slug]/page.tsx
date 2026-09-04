import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Curriculum } from "@/components/landing/curriculum";
import { FaqSection } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Pricing } from "@/components/landing/pricing";
import { Reviews } from "@/components/landing/reviews";
import { CourseJsonLd } from "@/components/seo/json-ld";
import { getCourseBySlug, getCoursePageData } from "@/lib/content";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) return { title: "찾을 수 없는 강의" };

  const description = course.subtitle ?? course.description ?? undefined;

  return {
    title: course.title,
    description,
    alternates: { canonical: `/courses/${slug}` },
    openGraph: {
      type: "website",
      title: course.title,
      description,
      url: `/courses/${slug}`,
    },
  };
}

export default async function CourseDetailPage({ params }: Params) {
  const { slug } = await params;
  const data = await getCoursePageData(slug);
  if (!data) notFound();

  const { course, lessons, reviews, faqs } = data;

  return (
    <>
      <CourseJsonLd course={course} lessonCount={lessons.length} faqs={faqs} />
      <section className="bg-ink px-5 py-16 text-ink-fg lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <h1 className="max-w-3xl text-3xl leading-tight sm:text-4xl lg:text-5xl">
            {course.title}
          </h1>
          {course.subtitle ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
              {course.subtitle}
            </p>
          ) : null}
          {course.description ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
              {course.description}
            </p>
          ) : null}
        </div>
      </section>

      <Curriculum lessons={lessons} />
      <Reviews reviews={reviews} />
      <Pricing course={course} />
      <FaqSection faqs={faqs} />
      <FinalCta />
    </>
  );
}
