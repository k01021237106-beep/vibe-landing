import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Eyebrow, SectionTitle } from "@/components/landing/section";
import { discountRate, formatPrice, primaryCta } from "@/lib/config";
import type { Course } from "@/lib/content";

/**
 * 가격.
 *
 * 금액은 데이터베이스에서 온다. 결제 승인 때 서버가 재검증하는 값과 같은 출처다 —
 * 화면에 보이는 가격과 실제 청구되는 가격이 다른 곳에서 오면 안 된다.
 *
 * 결제 버튼보다 무료 1강 버튼이 위에 온다. 아직 결심하지 않은 사람에게
 * 결제부터 들이밀면 뒤로 가기를 누른다.
 */
const included = [
  "전 차시 영상 (기간 제한 없음)",
  "따라 하기용 자료",
  "카카오톡 채널 질문",
  "이후 추가되는 보강 영상",
];

export function Pricing({ course }: { course: Course }) {
  const rate = discountRate(course.list_price, course.sale_price);

  return (
    <section
      id="pricing"
      className="scroll-mt-24 bg-ink px-5 py-20 text-ink-fg lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <Eyebrow onInk>수강료</Eyebrow>
        <SectionTitle>한 번 결제하면 계속 봅니다</SectionTitle>

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h3 className="text-2xl">{course.title}</h3>

            <p className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <span className="text-lg text-ink-muted line-through">
                {formatPrice(course.list_price)}
              </span>
              {rate > 0 ? (
                <span className="font-mono text-base text-ink-accent">-{rate}%</span>
              ) : null}
            </p>

            <p className="mt-2 text-4xl sm:text-5xl">
              <strong className="font-display font-black">
                {formatPrice(course.sale_price)}
              </strong>
            </p>

            {/* TODO: 할인 종료일이 정해지면 문구를 구체적으로 바꾼다 */}
            <p className="mt-4 text-base text-ink-muted">
              오픈 기념 할인가입니다. 부가세 포함 금액입니다.
            </p>

            <div className="mt-10 flex flex-col gap-3">
              <Button asChild size="lg">
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
              <Button asChild size="lg" variant="onInk">
                <Link href={`/checkout/${course.slug}`}>바로 결제하고 시작하기</Link>
              </Button>
            </div>

            <p className="mt-5 text-base text-ink-muted">
              먼저 1강을 보시고 결정하셔도 됩니다.
            </p>
          </div>

          <div className="lg:pt-4">
            <h3 className="text-lg text-ink-muted">포함된 것</h3>
            <ul className="mt-5">
              {included.map((item) => (
                <li
                  key={item}
                  className="border-t border-ink-line py-4 text-lg leading-relaxed"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-base leading-relaxed text-ink-muted">
              환불 조건은{" "}
              <Link
                href="/legal/refund"
                className="underline decoration-ink-accent decoration-2 underline-offset-4"
              >
                환불 규정
              </Link>
              에 정리해 두었습니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
