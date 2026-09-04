import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { contact } from "@/lib/config";

export const metadata: Metadata = {
  title: "결제 실패",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ code?: string; message?: string; slug?: string }>;
};

/**
 * 결제 실패 화면.
 *
 * 여기서는 수강권이 만들어지지 않는다 — 승인 자체가 일어나지 않았기 때문이다.
 * 토스가 보낸 메시지를 그대로 보여 주되, 사용자가 다음에 무엇을 할지 알려 준다.
 */
export default async function CheckoutFailPage({ searchParams }: Props) {
  const { code, message, slug } = await searchParams;

  return (
    <section className="mx-auto max-w-2xl px-5 py-20 lg:py-28">
      <h1 className="text-3xl sm:text-4xl">결제가 완료되지 않았습니다</h1>

      <p className="mt-6 text-lg leading-relaxed text-muted">
        {message ?? "결제가 중단되었습니다. 다시 시도해 주세요."}
      </p>
      <p className="mt-4 text-base text-muted">
        금액이 빠져나가지 않았습니다. 수강권도 만들어지지 않았습니다.
      </p>

      {code ? (
        <p className="mt-6 font-mono text-sm text-muted">오류 코드: {code}</p>
      ) : null}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        {slug ? (
          <Button asChild size="lg">
            <Link href={`/checkout/${slug}`}>다시 시도하기</Link>
          </Button>
        ) : null}
        <Button asChild size="lg" variant="outline">
          <a href={contact.kakaoChannelUrl} target="_blank" rel="noopener noreferrer">
            문의하기
          </a>
        </Button>
      </div>
    </section>
  );
}
