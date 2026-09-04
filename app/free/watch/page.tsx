import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { LessonPlayer } from "@/components/free/lesson-player";
import { Button } from "@/components/ui/button";
import { flagshipCourseSlug, formatPrice } from "@/lib/config";
import { formatDuration, getCoursePageData } from "@/lib/content";
import { FREE_ACCESS_COOKIE, verifyFreeAccessToken } from "@/lib/free-access";
import { getFreeLessonVideo } from "@/lib/free-lesson";

export const metadata: Metadata = {
  title: "무료 1강",
  // 검색 결과에 노출될 이유가 없는 페이지다.
  robots: { index: false, follow: false },
};

type Search = { searchParams: Promise<{ course?: string }> };

/**
 * 무료 1강 시청.
 *
 * ⚠️ 접근 자격 확인이 이 파일의 가장 위에 온다.
 *    자격을 확인하기 전에는 영상 주소를 조회하지 않는다. 순서가 반대면 의미가 없다.
 */
export default async function FreeWatchPage({ searchParams }: Search) {
  const cookieStore = await cookies();
  const token = cookieStore.get(FREE_ACCESS_COOKIE)?.value;

  // 신청하지 않은 사람은 신청 화면으로 돌려보낸다.
  if (!verifyFreeAccessToken(token)) {
    redirect("/free");
  }

  const { course: courseParam } = await searchParams;
  const slug = courseParam ?? flagshipCourseSlug;

  const data = await getCoursePageData(slug);
  if (!data) redirect("/free");

  const { course, lessons } = data;
  const lesson = lessons.find((l) => l.is_free_preview) ?? lessons[0];
  if (!lesson) redirect("/free");

  // 자격을 확인한 다음에야 영상 주소를 가져온다.
  const video = await getFreeLessonVideo(slug);

  return (
    <section className="mx-auto max-w-4xl px-5 py-12 lg:py-16">
      <p className="text-base text-muted">{course.title}</p>
      <h1 className="mt-3 text-2xl leading-snug sm:text-3xl lg:text-4xl">
        {lesson.position}강 · {lesson.title}
      </h1>
      {lesson.duration_seconds ? (
        <p className="mt-3 font-mono text-sm text-muted">
          {formatDuration(lesson.duration_seconds)}
        </p>
      ) : null}

      <div className="mt-8">
        {video.status === "not_configured" ? (
          <div className="flex aspect-video w-full items-center justify-center border-2 border-line bg-surface p-6">
            <div className="text-center">
              <p className="text-lg font-medium">영상을 불러오지 못했습니다</p>
              <p className="mt-2 text-base leading-relaxed text-muted">
                잠시 후 다시 시도해 주세요. 계속 이러면 알려 주세요.
              </p>
            </div>
          </div>
        ) : (
          <LessonPlayer vimeoId={video.vimeoId} title={lesson.title} />
        )}
      </div>

      {lesson.summary ? (
        <p className="mt-8 text-lg leading-relaxed">{lesson.summary}</p>
      ) : null}

      <div className="mt-14 border-t-2 border-fg pt-10">
        <h2 className="text-xl sm:text-2xl">여기까지 보셨다면</h2>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          나머지 {lessons.length - 1}개 차시에서는 설치부터 배포까지 끝까지 갑니다.
          다 보고 나면 남에게 보낼 수 있는 주소가 하나 남습니다.
        </p>
        <p className="mt-4 text-lg">
          <span className="text-muted line-through">
            {formatPrice(course.list_price)}
          </span>{" "}
          <strong className="font-display font-black">
            {formatPrice(course.sale_price)}
          </strong>
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={`/checkout/${course.slug}`}>이어서 수강하기</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={`/courses/${course.slug}`}>커리큘럼 다시 보기</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
