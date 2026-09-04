import { NextResponse, type NextRequest } from "next/server";

import { confirmPayment } from "@/lib/payments/confirm";
import { createPaymentDeps } from "@/lib/payments/deps";

/**
 * 결제 승인.
 *
 * 판단 로직은 lib/payments/confirm.ts에 있다. 여기는 얇은 껍데기다 —
 * 그래야 위변조 시나리오를 데이터베이스와 토스 없이 테스트할 수 있다.
 * (lib/payments/confirm.test.ts)
 */
export async function POST(request: NextRequest) {
  let body: { paymentKey?: string; orderId?: string; amount?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "요청을 읽지 못했습니다." },
      { status: 400 },
    );
  }

  const deps = createPaymentDeps();
  if (!deps.ok) {
    return NextResponse.json(
      { ok: false, reason: "not_configured", message: deps.message },
      { status: 503 },
    );
  }

  const result = await confirmPayment(
    {
      paymentKey: String(body.paymentKey ?? ""),
      orderCode: String(body.orderId ?? ""),
      // 문자열로 올 수 있다. 숫자로 바꾸되 이 값을 신뢰하지는 않는다 — 대조용이다.
      claimedAmount: Number(body.amount),
    },
    deps,
  );

  if (!result.ok) {
    const status = result.reason === "server_error" ? 500 : 400;
    return NextResponse.json(
      { ok: false, reason: result.reason, message: result.message },
      { status },
    );
  }

  return NextResponse.json({ ok: true, orderId: result.orderId });
}
