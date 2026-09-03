import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  discountRate,
  flagshipCourse,
  formatPrice,
  primaryCta,
  secondaryCta,
} from "@/lib/config";

/*
 * Phase 1은 기반 구축 단계다. 이 페이지는 디자인 시스템이 살아 있는지 확인하는 껍데기다.
 * TODO(Phase 3): 랜딩 11개 섹션으로 교체한다.
 *   Hero → 이런 분을 위한 → 페인 해소 → 만들 결과물 → 커리큘럼
 *   → 강사 → 샘플 후기 → 가격 → FAQ → 최종 CTA
 */
export default function Home() {
  return (
    <section className="bg-ink text-ink-fg">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-32">
        {/* 코드용 서체(JetBrains Mono)는 한글 글자가 없으므로 숫자·영문에만 쓴다 */}
        <p className="flex items-center gap-3 text-base font-medium text-ink-accent">
          <span>{flagshipCourse.title}</span>
          <span className="font-mono text-sm text-ink-muted">
            -{discountRate(flagshipCourse.listPrice, flagshipCourse.salePrice)}%
          </span>
        </p>

        <h1 className="mt-6 max-w-3xl text-4xl leading-tight sm:text-5xl lg:text-6xl">
          코딩을 몰라도
          <br />
          AI와 함께 내 서비스를
          <br />
          세상에 배포할 수 있습니다
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-muted">
          설치도, 영어 화면도, 오류 메시지도 혼자 두지 않습니다. 첫 화면부터 배포까지 처음부터
          끝까지 함께 갑니다.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={primaryCta.href}>{primaryCta.label}</Link>
          </Button>
          <Button asChild size="lg" variant="onInk">
            <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
          </Button>
        </div>

        <p className="mt-6 text-base text-ink-muted">
          정가 {formatPrice(flagshipCourse.listPrice)} → 오픈 할인{" "}
          <strong className="font-medium text-ink-fg">
            {formatPrice(flagshipCourse.salePrice)}
          </strong>
        </p>
      </div>
    </section>
  );
}
