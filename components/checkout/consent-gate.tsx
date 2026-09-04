"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { startCheckout, type StartCheckoutState } from "@/app/checkout/actions";

/**
 * 결제 전 동의 게이트.
 *
 * 두 가지에 동의해야 결제로 넘어간다. 동의하지 않으면 버튼 자체가 눌리지 않는다.
 * 서버에서도 다시 확인한다 — 화면 검사만으로는 우회할 수 있다.
 */
const initialState: StartCheckoutState = null;

function PayButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={disabled || pending}>
      {pending ? "주문을 만드는 중…" : "동의하고 결제하기"}
    </Button>
  );
}

export function ConsentGate({ slug }: { slug: string }) {
  const [state, formAction] = useActionState(startCheckout, initialState);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);

  const ready = agreeTerms && agreeRefund;

  return (
    <form action={formAction} className="mt-10">
      <input type="hidden" name="slug" value={slug} />

      <fieldset>
        <legend className="text-lg font-medium">결제 전 확인</legend>

        <label
          htmlFor="agreeTerms"
          className="mt-4 flex min-h-12 cursor-pointer items-start gap-3 border-t border-line py-4"
        >
          <input
            id="agreeTerms"
            name="agreeTerms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-1 size-6 shrink-0 accent-accent"
          />
          <span className="text-base leading-relaxed">
            <strong className="font-medium">(필수)</strong>{" "}
            <Link
              href="/legal/terms"
              className="underline decoration-accent decoration-2 underline-offset-4"
            >
              이용약관
            </Link>
            을 확인했고 이에 동의합니다.
          </span>
        </label>

        <label
          htmlFor="agreeRefund"
          className="flex min-h-12 cursor-pointer items-start gap-3 border-t border-line py-4"
        >
          <input
            id="agreeRefund"
            name="agreeRefund"
            type="checkbox"
            checked={agreeRefund}
            onChange={(e) => setAgreeRefund(e.target.checked)}
            className="mt-1 size-6 shrink-0 accent-accent"
          />
          <span className="text-base leading-relaxed">
            <strong className="font-medium">(필수)</strong>{" "}
            <Link
              href="/legal/refund"
              className="underline decoration-accent decoration-2 underline-offset-4"
            >
              환불 규정
            </Link>
            을 확인했습니다. 수강을 시작하면 환불 금액이 달라질 수 있음을 이해했습니다.
          </span>
        </label>
      </fieldset>

      {state?.error ? (
        <p role="alert" className="mt-6 border-2 border-fg bg-surface p-4 text-base leading-relaxed">
          {state.error}
        </p>
      ) : null}

      <div className="mt-8">
        <PayButton disabled={!ready} />
      </div>

      {!ready ? (
        <p className="mt-3 text-base text-muted">
          위 두 항목에 동의하시면 결제로 넘어갑니다.
        </p>
      ) : null}
    </form>
  );
}
