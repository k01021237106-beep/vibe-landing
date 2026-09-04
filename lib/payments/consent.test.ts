import { describe, expect, it } from "vitest";

import { validateCheckoutConsent } from "@/lib/payments/consent";

/**
 * 화면에서 버튼을 잠그는 것만으로는 부족하다.
 * disabled는 개발자 도구로 풀 수 있고 요청은 직접 보낼 수 있다.
 * 서버가 다시 보는 이 규칙이 실제 방어선이다.
 */
describe("결제 전 필수 동의", () => {
  it("둘 다 동의하면 통과한다", () => {
    expect(validateCheckoutConsent({ agreeTerms: true, agreeRefund: true }).ok).toBe(true);
  });

  it("하나라도 빠지면 막는다", () => {
    const cases = [
      { agreeTerms: false, agreeRefund: true },
      { agreeTerms: true, agreeRefund: false },
      { agreeTerms: false, agreeRefund: false },
    ];
    for (const input of cases) {
      const result = validateCheckoutConsent(input);
      expect(result.ok, JSON.stringify(input)).toBe(false);
      if (!result.ok) expect(result.message).toMatch(/[가-힣]/);
    }
  });
});
