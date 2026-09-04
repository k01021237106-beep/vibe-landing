import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";

import { ApplyForm } from "@/components/free/apply-form";
import { flagshipCourseSlug } from "@/lib/config";
import { FREE_ACCESS_COOKIE, verifyFreeAccessToken } from "@/lib/free-access";
import { formatDuration, getCoursePageData } from "@/lib/content";

export const metadata: Metadata = {
  title: "무료 1강 신청",
  description:
    "이름과 연락처만 남기시면 첫 강의를 바로 보실 수 있습니다. 결제 정보는 받지 않습니다.",
};

export default async function FreePage() {
  // 이미 신청한 사람을 다시 신청시키지 않는다.
  const cookieStore = await cookies();
  if (verifyFreeAccessToken(cookieStore.get(FREE_ACCESS_COOKIE)?.value)) {
    redirect(`/free/watch?course=${flagshipCourseSlug}`);
  }

  const data = await getCoursePageData(flagshipCourseSlug);
  const firstLesson = data?.lessons.find((l) => l.is_free_preview) ?? data?.lessons[0];

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 lg:py-24">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl">
        1강, 지금 바로
        <br />
        보실 수 있습니다
      </h1>

      <p className="mt-6 text-lg leading-relaxed text-muted">
        이름과 휴대폰 번호만 남겨 주세요. 회원가입도, 결제 정보도 필요 없습니다.
      </p>

      {firstLesson ? (
        <div className="mt-10 border-2 border-fg bg-surface p-6">
          <h2 className="text-sm font-medium text-muted">받아 보실 강의</h2>
          <p className="mt-2 text-xl leading-snug">
            {firstLesson.position}강 · {firstLesson.title}
          </p>
          {firstLesson.summary ? (
            <p className="mt-3 text-base leading-relaxed text-muted">
              {firstLesson.summary}
            </p>
          ) : null}
          {firstLesson.duration_seconds ? (
            <p className="mt-3 font-mono text-sm text-muted">
              {formatDuration(firstLesson.duration_seconds)}
            </p>
          ) : null}
        </div>
      ) : null}

      <ApplyForm />
    </section>
  );
}
