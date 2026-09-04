/**
 * 결제 전 필수 동의 검사.
 *
 * 화면에서도 버튼을 잠그지만 그것만으로는 부족하다 —
 * 개발자 도구로 disabled를 풀거나 요청을 직접 보낼 수 있다.
 * 서버가 다시 보는 것이 실제 방어선이고, 이 함수가 그 규칙이다.
 *
 * 전자상거래법상 청약 전 약관·환불 규정 고지가 필요하므로
 * 동의 없이 주문이 만들어지면 안 된다.
 */
export type ConsentInput = {
  agreeTerms: boolean;
  agreeRefund: boolean;
};

export type ConsentResult = { ok: true } | { ok: false; message: string };

export function validateCheckoutConsent(input: ConsentInput): ConsentResult {
  if (!input.agreeTerms || !input.agreeRefund) {
    return { ok: false, message: "약관과 환불 규정에 동의해 주세요." };
  }
  return { ok: true };
}
