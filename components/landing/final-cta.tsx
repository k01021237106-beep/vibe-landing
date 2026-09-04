import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Section, SectionTitle } from "@/components/landing/section";
import { contact, primaryCta } from "@/lib/config";

/**
 * 마지막 CTA.
 *
 * 여기까지 읽고 내려온 사람에게 하나만 남긴다 — 무료 1강.
 * 여러 선택지를 늘어놓으면 아무것도 고르지 않는다.
 */
export function FinalCta() {
  return (
    <Section tone="cream" className="text-center">
      <SectionTitle className="mx-auto max-w-3xl">
        오늘 1강만 보셔도
        <br />
        시작한 겁니다
      </SectionTitle>

      <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
        결제 정보는 받지 않습니다. 이름과 연락처만 남기시면 바로 보실 수 있습니다.
      </p>

      <div className="mt-10 flex flex-col items-center gap-4">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={primaryCta.href}>{primaryCta.label}</Link>
        </Button>

        <a
          href={contact.kakaoChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center text-base text-muted underline decoration-line underline-offset-4 transition-colors hover:text-fg"
        >
          먼저 물어보고 싶으신가요? 카카오톡으로 문의하기
        </a>
      </div>
    </Section>
  );
}
