import { Eyebrow, Section, SectionTitle } from "@/components/landing/section";
import type { Faq } from "@/lib/content";

/**
 * 자주 묻는 질문.
 *
 * 브라우저가 원래 갖고 있는 details/summary를 쓴다.
 * 자바스크립트 없이 열리고, 키보드로 다뤄지고, 화면 낭독기가 상태를 읽어 준다.
 * 직접 만든 아코디언보다 이쪽이 낫다 — 특히 시니어 사용자에게는
 * 브라우저가 보장하는 동작이 더 안전하다.
 */
export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;

  return (
    <Section id="faq" tone="surface">
      <Eyebrow>자주 묻는 질문</Eyebrow>
      <SectionTitle>궁금하실 것 같아서</SectionTitle>

      <div className="mt-14 max-w-3xl">
        {faqs.map((faq) => (
          <details
            key={faq.id}
            className="group border-t border-line [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg leading-snug">
              <h3 className="text-lg font-medium sm:text-xl">{faq.question}</h3>
              {/*
                열림/닫힘 표시. 화면 낭독기에는 details 자체가 상태를 알려 준다.
                액센트 코랄은 밝은 배경 위에서 대비가 2.68:1이라 글자색으로 못 쓴다.
                (Phase 1에서 확인한 것과 같은 제약이다)
              */}
              <span
                aria-hidden="true"
                className="shrink-0 text-2xl text-fg transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="pb-6 text-base leading-relaxed text-muted sm:text-lg">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
