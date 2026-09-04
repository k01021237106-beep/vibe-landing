import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { discountRate, formatPrice } from "@/lib/config";
import { getPublishedCourses } from "@/lib/content";

export const metadata: Metadata = {
  title: "강의 목록",
  description:
    "코딩을 몰라도 AI와 함께 내 서비스를 만들고 배포하는 첫배포의 강의 목록입니다.",
};

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl">강의</h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
        지금 열려 있는 강의입니다. 강의가 늘어나면 여기에 추가됩니다.
      </p>

      {courses.length === 0 ? (
        <p className="mt-16 text-lg text-muted">
          지금은 열려 있는 강의가 없습니다. 곧 다시 열립니다.
        </p>
      ) : (
        <ul className="mt-16">
          {courses.map((course) => {
            const rate = discountRate(course.list_price, course.sale_price);
            return (
              <li key={course.id} className="border-t-2 border-fg py-10">
                <div className="lg:grid lg:grid-cols-[1.6fr_1fr] lg:gap-16">
                  <div>
                    <h2 className="text-2xl leading-snug sm:text-3xl">
                      {/* 목록에서 가장 중요한 탭 대상이다. 최소 48px을 확보한다. */}
                      <Link
                        href={`/courses/${course.slug}`}
                        className="flex min-h-12 items-center underline-offset-8 hover:underline hover:decoration-accent hover:decoration-2"
                      >
                        {course.title}
                      </Link>
                    </h2>
                    {course.subtitle ? (
                      <p className="mt-4 text-lg leading-relaxed text-muted">
                        {course.subtitle}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-8 lg:mt-0 lg:text-right">
                    <p className="flex flex-wrap items-baseline gap-x-3 lg:justify-end">
                      <span className="text-base text-muted line-through">
                        {formatPrice(course.list_price)}
                      </span>
                      {rate > 0 ? (
                        <span className="font-mono text-sm text-muted">-{rate}%</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-2xl">
                      <strong className="font-display font-black">
                        {formatPrice(course.sale_price)}
                      </strong>
                    </p>
                    <Button asChild size="md" className="mt-5 w-full lg:w-auto">
                      <Link href={`/courses/${course.slug}`}>자세히 보기</Link>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
