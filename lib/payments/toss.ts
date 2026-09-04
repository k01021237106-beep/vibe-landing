import "server-only";

import type { TossConfirmResult, TossGateway } from "@/lib/payments/confirm";

/**
 * 토스페이먼츠 결제 승인.
 *
 * ⚠️ Secret Key는 서버에서만 쓴다. NEXT_PUBLIC_ 접두사를 붙이면 브라우저로 나간다.
 *    (Client Key는 결제창을 여는 데 필요하므로 공개되어도 된다 — 그건 별개 값이다)
 */

const CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

export function getTossSecretKey(): string {
  const key = process.env.TOSS_SECRET_KEY;
  if (!key) {
    throw new Error(
      "환경변수 TOSS_SECRET_KEY가 없습니다. " +
        "토스페이먼츠 개발자센터에서 Secret Key를 받아 .env.local에 넣으세요. " +
        "이 값은 서버 전용이며 절대 커밋하지 않습니다.",
    );
  }
  return key;
}

export function hasTossKeys(): boolean {
  return Boolean(process.env.TOSS_SECRET_KEY && process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
}

/** Basic 인증: Secret Key 뒤에 콜론을 붙여 base64로 인코딩한다 (토스 규격) */
function authorizationHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

export function createTossGateway(): TossGateway {
  return {
    async confirm({ paymentKey, orderCode, amount }): Promise<TossConfirmResult> {
      const response = await fetch(CONFIRM_URL, {
        method: "POST",
        headers: {
          Authorization: authorizationHeader(getTossSecretKey()),
          "Content-Type": "application/json",
          /*
           * 같은 요청이 두 번 가더라도 한 번만 청구되게 한다.
           * 주문번호를 키로 쓰면 네트워크가 끊겼다 재시도돼도 안전하다.
           */
          "Idempotency-Key": orderCode,
        },
        body: JSON.stringify({ paymentKey, orderId: orderCode, amount }),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const error = (payload ?? {}) as { code?: string; message?: string };
        return {
          ok: false,
          code: error.code ?? `HTTP_${response.status}`,
          message: error.message ?? "결제가 승인되지 않았습니다.",
        };
      }

      const result = (payload ?? {}) as { method?: string; status?: string };

      // 토스가 200을 주더라도 상태가 DONE이 아니면 완료가 아니다.
      if (result.status && result.status !== "DONE") {
        return {
          ok: false,
          code: result.status,
          message: "결제가 완료되지 않았습니다.",
        };
      }

      return { ok: true, method: result.method ?? null, raw: payload };
    },
  };
}
