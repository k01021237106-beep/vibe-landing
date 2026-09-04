"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { flagshipCourseSlug } from "@/lib/config";
import { FREE_ACCESS_COOKIE, issueFreeAccessToken } from "@/lib/free-access";
import { validateApplication, type ApplicationErrors } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

export type ApplyState = { errors: ApplicationErrors } | null;

/** Postgres 유일 제약 위반 */
const UNIQUE_VIOLATION = "23505";

/**
 * 무료 1강 신청.
 *
 * 성공하면 접근권 쿠키를 발급하고 시청 페이지로 보낸다.
 *
 * 이미 신청한 사람도 성공으로 처리한다. 같은 번호로 다시 신청하는 건
 * 대부분 "표를 잃어버렸다"는 뜻이다 — 여기서 오류를 내면 다시는 안 온다.
 */
export async function applyForFreeLesson(
  _previous: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const result = validateApplication({
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    consentPrivacy: formData.get("consentPrivacy") === "on",
    consentMarketing: formData.get("consentMarketing") === "on",
  });

  if (!result.ok) {
    return { errors: result.errors };
  }

  const { name, phone, consentPrivacy, consentMarketing } = result.value;

  const supabase = await createClient();

  /*
   * .select()를 붙이지 않는다.
   * anon에는 leads의 select 권한이 없다 — 있으면 누구나 신청자 명단을 긁어 간다.
   * 붙이는 순간 permission denied가 난다.
   * (supabase/tests/auth_trigger.sql이 이 동작을 고정해 뒀다)
   */
  const { error } = await supabase.from("leads").insert({
    name,
    phone,
    consent_privacy: consentPrivacy,
    consent_marketing: consentMarketing,
    source: "web",
  });

  // 이미 신청한 사람이면 그대로 통과시킨다.
  if (error && error.code !== UNIQUE_VIOLATION) {
    console.error("[free] leads 저장 실패", error);
    return {
      errors: { form: "잠시 문제가 생겼습니다. 조금 뒤에 다시 시도해 주세요." },
    };
  }

  let token: string;
  try {
    token = issueFreeAccessToken(phone);
  } catch (cause) {
    console.error("[free] 접근권 발급 실패", cause);
    return {
      errors: { form: "잠시 문제가 생겼습니다. 조금 뒤에 다시 시도해 주세요." },
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(FREE_ACCESS_COOKIE, token, {
    httpOnly: true, // 자바스크립트가 읽지 못하게 한다
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  // redirect는 예외를 던져 함수를 끝낸다. try 안에서 부르면 안 된다.
  redirect(`/free/watch?course=${flagshipCourseSlug}`);
}
