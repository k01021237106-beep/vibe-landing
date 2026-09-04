"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { applyForFreeLesson, type ApplyState } from "@/app/free/actions";

/**
 * 무료 1강 신청 폼.
 *
 * 사이트에서 가장 중요한 화면이다. 여기서 막히면 전환이 통째로 사라진다.
 * 그래서:
 *  - 받는 것은 이름과 연락처뿐이다. 이메일도 비밀번호도 받지 않는다.
 *  - 오류는 칸 바로 아래에 짧은 한국어로 붙인다.
 *  - 자바스크립트가 없어도 동작한다 (서버 액션 + 기본 form 제출).
 */
const initialState: ApplyState = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "신청하는 중…" : "무료 1강 신청하기"}
    </Button>
  );
}

export function ApplyForm() {
  const [state, formAction] = useActionState(applyForFreeLesson, initialState);
  const errors = state?.errors ?? {};

  return (
    <form action={formAction} noValidate className="mt-10">
      {errors.form ? (
        <p
          role="alert"
          className="mb-6 border-2 border-fg bg-surface p-4 text-base leading-relaxed"
        >
          {errors.form}
        </p>
      ) : null}

      <div>
        <label htmlFor="name" className="block text-lg font-medium">
          이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
          className="mt-2 h-14 w-full rounded border-2 border-line bg-bg px-4 text-lg text-fg focus:border-fg"
        />
        {errors.name ? (
          <p id="name-error" role="alert" className="mt-2 text-base">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="mt-7">
        <label htmlFor="phone" className="block text-lg font-medium">
          휴대폰 번호
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          // 숫자 자판이 바로 뜨게 한다. 시니어에게는 이 차이가 크다.
          inputMode="numeric"
          placeholder="010-1234-5678"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? "phone-error" : "phone-help"}
          className="mt-2 h-14 w-full rounded border-2 border-line bg-bg px-4 text-lg text-fg placeholder:text-muted/60 focus:border-fg"
        />
        {errors.phone ? (
          <p id="phone-error" role="alert" className="mt-2 text-base">
            {errors.phone}
          </p>
        ) : (
          <p id="phone-help" className="mt-2 text-base text-muted">
            하이픈(-)은 넣으셔도 되고 빼셔도 됩니다.
          </p>
        )}
      </div>

      <div className="mt-8 border-t border-line pt-6">
        {/* 터치영역을 넉넉히 잡는다. 체크박스만 작게 두면 누르기 어렵다. */}
        <label
          htmlFor="consentPrivacy"
          className="flex min-h-12 cursor-pointer items-start gap-3 py-1"
        >
          <input
            id="consentPrivacy"
            name="consentPrivacy"
            type="checkbox"
            aria-invalid={errors.consentPrivacy ? true : undefined}
            aria-describedby={errors.consentPrivacy ? "consent-error" : undefined}
            className="mt-1 size-6 shrink-0 accent-accent"
          />
          <span className="text-base leading-relaxed">
            <strong className="font-medium">(필수)</strong> 무료 강의 안내를 위해
            이름과 연락처를 수집하는 데 동의합니다.{" "}
            <Link
              href="/legal/privacy"
              className="underline decoration-accent decoration-2 underline-offset-4"
            >
              개인정보처리방침
            </Link>
          </span>
        </label>
        {errors.consentPrivacy ? (
          <p id="consent-error" role="alert" className="mt-1 text-base">
            {errors.consentPrivacy}
          </p>
        ) : null}

        <label
          htmlFor="consentMarketing"
          className="mt-2 flex min-h-12 cursor-pointer items-start gap-3 py-1"
        >
          <input
            id="consentMarketing"
            name="consentMarketing"
            type="checkbox"
            className="mt-1 size-6 shrink-0 accent-accent"
          />
          <span className="text-base leading-relaxed text-muted">
            (선택) 새 강의와 할인 소식을 받아보겠습니다.
          </span>
        </label>
      </div>

      <div className="mt-8">
        <SubmitButton />
      </div>

      <p className="mt-4 text-base leading-relaxed text-muted">
        결제 정보는 받지 않습니다. 수집한 연락처는 강의 안내 외의 목적으로 쓰지
        않습니다.
      </p>
    </form>
  );
}
