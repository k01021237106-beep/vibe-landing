import Link from "next/link";

import { Button } from "@/components/ui/button";
import { primaryCta } from "@/lib/config";

/**
 * 히어로.
 *
 * 결제 버튼을 여기에 두지 않는다. 목표 행동은 무료 1강 신청이고,
 * 처음 온 사람에게 돈 이야기부터 꺼내면 뒤로 가기를 누른다.
 */
export function Hero({ courseTitle }: { courseTitle: string }) {
  return (
    <section className="bg-ink px-5 py-20 text-ink-fg lg:px-8 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <p className="text-base font-medium text-ink-accent">{courseTitle}</p>

        <h1 className="mt-6 max-w-4xl text-4xl leading-tight sm:text-5xl lg:text-6xl">
          코딩을 몰라도
          <br />
          AI와 함께 내 서비스를
          <br />
          세상에 내놓을 수 있습니다
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-muted">
          설치하다 포기하고, 영어 화면에서 덮고, 빨간 글씨에 놀라 그만두셨다면
          이번엔 다릅니다. 첫 화면부터 배포까지 옆에서 같이 갑니다.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={primaryCta.href}>{primaryCta.label}</Link>
          </Button>
          <Button asChild size="lg" variant="onInk">
            <Link href="#curriculum">커리큘럼 먼저 보기</Link>
          </Button>
        </div>

        <p className="mt-6 text-base text-ink-muted">
          신청은 30초면 됩니다. 결제 정보는 받지 않습니다.
        </p>
      </div>
    </section>
  );
}
