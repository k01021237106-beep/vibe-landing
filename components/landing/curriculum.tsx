import Link from "next/link";

import { Eyebrow, Section, SectionLead, SectionTitle } from "@/components/landing/section";
import { formatDuration, totalDuration, type Lesson } from "@/lib/content";
import { primaryCta } from "@/lib/config";

/**
 * 커리큘럼.
 *
 * 차시는 데이터베이스에서 온다 — 강의를 고치면 화면이 따라 바뀐다.
 * 영상 주소(vimeo_id)는 여기 오지 않는다. 권한 자체가 없다.
 */
export function Curriculum({ lessons }: { lessons: Lesson[] }) {
  if (lessons.length === 0) return null;

  const total = totalDuration(lessons);

  return (
    <Section id="curriculum" tone="cream">
      <Eyebrow>커리큘럼</Eyebrow>
      <SectionTitle>
        {lessons.length}개 차시,
        <br />
        순서대로만 따라오시면 됩니다
      </SectionTitle>
      <SectionLead>
        전체 {total} 분량입니다. 하루에 하나씩 보셔도 열흘이면 끝납니다.
        건너뛰는 단계가 없도록 짰습니다.
      </SectionLead>

      <ol className="mt-14">
        {lessons.map((lesson) => (
          <li
            key={lesson.id}
            className="border-t border-line py-7 sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-baseline sm:gap-8"
          >
            <span className="font-mono text-base text-muted" aria-hidden="true">
              {String(lesson.position).padStart(2, "0")}
            </span>

            <div className="mt-2 sm:mt-0">
              <h3 className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xl leading-snug">
                {lesson.title}
                {lesson.is_free_preview ? (
                  <span className="rounded bg-accent px-2.5 py-1 text-sm font-medium text-accent-fg">
                    무료 공개
                  </span>
                ) : null}
              </h3>
              {lesson.summary ? (
                <p className="mt-2 text-base leading-relaxed text-muted">
                  {lesson.summary}
                </p>
              ) : null}
            </div>

            <span className="mt-2 block text-base text-muted sm:mt-0 sm:text-right">
              {formatDuration(lesson.duration_seconds)}
            </span>
          </li>
        ))}
      </ol>

      <div className="border-t border-line pt-10">
        <p className="text-lg leading-relaxed">
          1강은 신청만 하면 바로 보실 수 있습니다.{" "}
          <Link
            href={primaryCta.href}
            className="font-medium text-fg underline decoration-accent decoration-2 underline-offset-4"
          >
            무료 1강 신청하기
          </Link>
        </p>
      </div>
    </Section>
  );
}
