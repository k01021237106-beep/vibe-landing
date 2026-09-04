import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { confirmPayment } from "@/lib/payments/confirm";
import { createPaymentDeps } from "@/lib/payments/deps";
import { contact } from "@/lib/config";

export const metadata: Metadata = {
  title: "결제 완료",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }>;
};

/**
 * 결제 완료 화면.
 *
 * 토스가 이 주소로 보낸 직후 **서버에서** 승인을 마무리한다.
 * 승인을 브라우저에 맡기면 사용자가 창을 닫는 순간 돈만 빠져나간 상태가 된다.
 */
export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { paymentKey, orderId, amount } = await searchParams;

  if (!paymentKey || !orderId) {
    return (
      <Result
        title="결제 정보를 확인하지 못했습니다"
        body="결제가 되었는데 이 화면이 보인다면 문의해 주세요. 바로 확인해 드리겠습니다."
        tone="error"
      />
    );
  }

  const deps = createPaymentDeps();
  if (!deps.ok) {
    return <Result title="결제를 완료하지 못했습니다" body={deps.message} tone="error" />;
  }

  const result = await confirmPayment(
    { paymentKey, orderCode: orderId, claimedAmount: Number(amount) },
    deps,
  );

  if (!result.ok) {
    return (
      <Result
        title="결제를 완료하지 못했습니다"
        body={result.message}
        tone="error"
      />
    );
  }

  return (
    <Result
      title="결제가 완료되었습니다"
      body="바로 강의를 보실 수 있습니다. 수강 기간에 제한은 없습니다."
      tone="success"
    />
  );
}

function Result({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "success" | "error";
}) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-20 lg:py-28">
      <h1 className="text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted">{body}</p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        {tone === "success" ? (
          <Button asChild size="lg">
            <Link href="/my">내 강의실로 가기</Link>
          </Button>
        ) : (
          <Button asChild size="lg" variant="outline">
            <Link href="/">첫 화면으로</Link>
          </Button>
        )}
        <Button asChild size="lg" variant="outline">
          <a href={contact.kakaoChannelUrl} target="_blank" rel="noopener noreferrer">
            문의하기
          </a>
        </Button>
      </div>
    </section>
  );
}
