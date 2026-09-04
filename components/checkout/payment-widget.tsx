"use client";

import { useEffect, useRef, useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/config";

type TossPayments = Awaited<ReturnType<typeof loadTossPayments>>;
type Widgets = ReturnType<TossPayments["widgets"]>;

/**
 * 토스 결제 위젯.
 *
 * ⚠️ 여기 오는 amount는 서버가 DB에서 읽어 넘긴 값이다.
 *    브라우저에서 이 값을 고칠 수는 있지만, 승인 단계에서 서버가
 *    주문에 저장된 금액과 대조해 거부한다 (lib/payments/confirm.ts).
 *    즉 이 화면의 금액은 '보여 주기'용이지 '결정'하는 값이 아니다.
 */
export function PaymentWidget({
  clientKey,
  orderCode,
  amount,
  orderName,
  slug,
}: {
  clientKey: string;
  orderCode: string;
  amount: number;
  orderName: string;
  slug: string;
}) {
  const widgetsRef = useRef<Widgets | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let canceled = false;

    async function mount() {
      try {
        const toss = await loadTossPayments(clientKey);
        // 비회원 키로 연다. 로그인 여부는 우리 서버가 이미 확인했다.
        const widgets = toss.widgets({ customerKey: "ANONYMOUS" });
        await widgets.setAmount({ currency: "KRW", value: amount });
        if (canceled) return;

        await widgets.renderPaymentMethods({
          selector: "#toss-payment-methods",
          variantKey: "DEFAULT",
        });
        await widgets.renderAgreement({
          selector: "#toss-agreement",
          variantKey: "AGREEMENT",
        });
        if (canceled) return;

        widgetsRef.current = widgets;
        setReady(true);
      } catch (cause) {
        console.error("[checkout] 결제창을 불러오지 못했습니다", cause);
        if (!canceled) setError("결제창을 불러오지 못했습니다. 새로고침해 주세요.");
      }
    }

    void mount();
    return () => {
      canceled = true;
    };
  }, [clientKey, amount]);

  async function requestPayment() {
    const widgets = widgetsRef.current;
    if (!widgets) return;

    setPaying(true);
    setError(null);

    try {
      const origin = window.location.origin;
      await widgets.requestPayment({
        orderId: orderCode,
        orderName,
        successUrl: `${origin}/checkout/success`,
        failUrl: `${origin}/checkout/fail?slug=${encodeURIComponent(slug)}`,
      });
      // 성공하면 토스가 successUrl로 보낸다. 여기로 돌아오지 않는다.
    } catch (cause) {
      console.error("[checkout] 결제 요청 실패", cause);
      setError("결제를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setPaying(false);
    }
  }

  return (
    <div className="mt-10">
      <div id="toss-payment-methods" />
      <div id="toss-agreement" className="mt-4" />

      {error ? (
        <p role="alert" className="mt-6 border-2 border-fg bg-surface p-4 text-base leading-relaxed">
          {error}
        </p>
      ) : null}

      <div className="mt-8">
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={requestPayment}
          disabled={!ready || paying}
        >
          {paying ? "결제창을 여는 중…" : `${formatPrice(amount)} 결제하기`}
        </Button>
      </div>
    </div>
  );
}
