import { Eyebrow, Section, SectionTitle } from "@/components/landing/section";
import type { Review } from "@/lib/content";

/**
 * 수강 후기.
 *
 * ⚠️ 샘플 후기를 실제 후기처럼 보이게 두고 판매를 시작하면 표시광고법 위반이다.
 *    그래서 두 겹으로 표시한다: 섹션 상단 고지 + 후기마다 배지.
 *    두 표시 모두 눈에 띄어야 한다 — 회색 작은 글씨로 숨기면 표시한 게 아니다.
 *
 * is_sample의 기본값은 true다. 실제 후기임이 확인된 것만 false가 된다.
 * 판단을 사람 기억에 맡기지 않기 위해 안전한 쪽을 기본값으로 뒀다.
 */
export function Reviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  const sampleCount = reviews.filter((r) => r.is_sample).length;
  const allSamples = sampleCount === reviews.length;

  return (
    <Section id="reviews" tone="cream">
      <Eyebrow>수강 후기</Eyebrow>
      <SectionTitle>먼저 해 보신 분들</SectionTitle>

      {sampleCount > 0 ? (
        <div
          role="note"
          className="mt-8 max-w-2xl border-2 border-fg bg-surface p-5"
        >
          <p className="text-base font-medium">
            {allSamples ? "아래 후기는 모두 예시입니다" : "일부 후기는 예시입니다"}
          </p>
          <p className="mt-2 text-base leading-relaxed text-muted">
            강의를 준비하며 만든 가상의 후기이며, 실제 수강생이 남긴 글이 아닙니다.
            실제 후기가 모이는 대로 교체합니다.
          </p>
        </div>
      ) : null}

      <ul className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2">
        {reviews.map((review) => (
          <li key={review.id} className="border-t-2 border-fg pt-6">
            {review.is_sample ? (
              <p className="mb-4">
                <span className="inline-block border border-fg px-2.5 py-1 text-sm font-medium">
                  샘플 후기
                </span>
              </p>
            ) : null}

            {review.rating ? (
              <p className="text-base text-muted">
                <span aria-hidden="true">{"★".repeat(review.rating)}</span>
                <span className="sr-only">5점 만점에 {review.rating}점</span>
              </p>
            ) : null}

            <blockquote className="mt-3 text-lg leading-relaxed">
              {review.body}
            </blockquote>

            <p className="mt-4 text-base text-muted">
              {review.author_name}
              {review.author_role ? ` · ${review.author_role}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
