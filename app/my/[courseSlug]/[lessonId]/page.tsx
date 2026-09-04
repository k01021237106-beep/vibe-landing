import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { LessonPlayer } from "@/components/free/lesson-player";
import { resolveLessonVideo } from "@/lib/lessons/access";
import { createLessonAccessDeps, getLessonListForCourse } from "@/lib/lessons/repository";
import { getCurrentUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ courseSlug: string; lessonId: string }> };

export const metadata: Metadata = {
  title: "강의 시청",
  robots: { index: false, follow: false },
};

/**
 * 강의 시청.
 *
 * ⚠️ 접근 판단은 전부 lib/lessons/access.ts가 한다.
 *    그쪽이 수강권을 확인하기 전에는 영상 주소를 읽지 않는다는 순서를 보장한다.
 *    이 파일은 그 결과를 화면으로 옮기기만 한다.
 */
export default async function WatchLessonPage({ params }: Params) {
  const { courseSlug, lessonId } = await params;

  const user = await getCurrentUser();

  const result = await resolveLessonVideo(
    { userId: user?.id ?? null, courseSlug, lessonId },
    createLessonAccessDeps(),
  );

  if (result.status === "unauthenticated") {
    redirect(`/login?next=/my/${courseSlug}/${lessonId}`);
  }
  if (result.status === "forbidden") {
    /*
     * 이중 방어다. 실제로는 미들웨어가 먼저 403으로 막으므로 여기까지 오지 않는다.
     * (Next 15.5의 forbidden()은 상태 코드를 404로 주기 때문에 미들웨어에서 처리한다)
     * 그래도 남겨 둔다 — 미들웨어 설정이 바뀌어도 페이지 스스로 막아야 한다.
     */
    notFound();
  }
  if (result.status === "not_found") {
    notFound();
  }

  const { lesson } = result;
  const lessons = await getLessonListForCourse(courseSlug);
  const index = lessons.findIndex((l) => l.id === lesson.id);
  const previous = index > 0 ? lessons[index - 1] : null;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;

  return (
    <section className="mx-auto max-w-4xl px-5 py-12 lg:py-16">
      <Link
        href={`/my/${courseSlug}`}
        className="inline-flex min-h-12 items-center text-base text-muted underline decoration-line underline-offset-4 hover:text-fg"
      >
        강의 목차
      </Link>

      <h1 className="mt-4 text-2xl leading-snug sm:text-3xl">
        {lesson.position}강 · {lesson.title}
      </h1>

      <div className="mt-8">
        {/*
          vimeoId만 넘긴다. 차시 객체를 통째로 넘기면
          나중에 다른 민감한 값이 붙었을 때 같이 새 나간다.
        */}
        <LessonPlayer vimeoId={lesson.vimeoId} title={lesson.title} />
      </div>

      <nav aria-label="차시 이동" className="mt-12 flex flex-wrap gap-4 border-t border-line pt-8">
        {previous ? (
          <Link
            href={`/my/${courseSlug}/${previous.id}`}
            className="inline-flex min-h-12 items-center text-base underline decoration-line underline-offset-4 hover:text-fg"
          >
            ← {previous.position}강 {previous.title}
          </Link>
        ) : null}
        {next ? (
          <Link
            href={`/my/${courseSlug}/${next.id}`}
            className="ml-auto inline-flex min-h-12 items-center text-base underline decoration-line underline-offset-4 hover:text-fg"
          >
            {next.position}강 {next.title} →
          </Link>
        ) : null}
      </nav>
    </section>
  );
}
