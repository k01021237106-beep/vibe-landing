import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { formatDuration } from "@/lib/content";
import { createLessonAccessDeps, getLessonListForCourse } from "@/lib/lessons/repository";
import { getCurrentUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ courseSlug: string }> };

export const metadata: Metadata = {
  title: "강의 목차",
  robots: { index: false, follow: false },
};

/** 수강 중인 강의의 차시 목록. 수강권이 없으면 들어올 수 없다. */
export default async function CourseLessonsPage({ params }: Params) {
  const { courseSlug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/my/${courseSlug}`);

  const deps = createLessonAccessDeps();
  const enrolled = await deps.findActiveEnrollment(user.id, courseSlug);
  if (!enrolled) notFound();

  const lessons = await getLessonListForCourse(courseSlug);
  if (lessons.length === 0) notFound();

  return (
    <section className="mx-auto max-w-3xl px-5 py-16 lg:py-24">
      <Link
        href="/my"
        className="inline-flex min-h-12 items-center text-base text-muted underline decoration-line underline-offset-4 hover:text-fg"
      >
        내 강의실
      </Link>

      <h1 className="mt-4 text-3xl sm:text-4xl">강의 목차</h1>

      <ol className="mt-12">
        {lessons.map((lesson) => (
          <li key={lesson.id} className="border-t border-line">
            <Link
              href={`/my/${courseSlug}/${lesson.id}`}
              className="flex min-h-16 items-baseline gap-5 py-6 transition-colors hover:bg-surface"
            >
              <span className="font-mono text-base text-muted" aria-hidden="true">
                {String(lesson.position).padStart(2, "0")}
              </span>
              <span className="flex-1">
                <span className="block text-lg leading-snug">{lesson.title}</span>
                {lesson.summary ? (
                  <span className="mt-2 block text-base leading-relaxed text-muted">
                    {lesson.summary}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-base text-muted">
                {formatDuration(lesson.duration_seconds)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
