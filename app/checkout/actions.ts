"use server";

import { redirect } from "next/navigation";

import { validateCheckoutConsent } from "@/lib/payments/consent";
import { createPendingOrder } from "@/lib/payments/orders";
import { getCurrentUser } from "@/lib/supabase/server";

export type StartCheckoutState = { error: string } | null;

/**
 * 결제를 시작하기 전에 대기 주문을 만든다.
 *
 * 금액은 인자로 받지 않는다 — 서버가 DB에서 읽는다.
 * 클라이언트가 금액을 보낼 수 있으면 그 순간 위변조 경로가 열린다.
 */
export async function startCheckout(
  _previous: StartCheckoutState,
  formData: FormData,
): Promise<StartCheckoutState> {
  const slug = String(formData.get("slug") ?? "");

  /*
   * 동의 검사를 가장 먼저 한다.
   * 이 검사를 통과하지 못하면 주문이 만들어지는 코드에 닿지 않는다.
   * 화면에서도 버튼을 잠그지만 그건 우회할 수 있다.
   */
  const consent = validateCheckoutConsent({
    agreeTerms: formData.get("agreeTerms") === "on",
    agreeRefund: formData.get("agreeRefund") === "on",
  });
  if (!consent.ok) {
    return { error: consent.message };
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/checkout/${slug}`);
  }

  const result = await createPendingOrder({ userId: user.id, courseSlug: slug });

  if (!result.ok) {
    if (result.reason === "already_enrolled") redirect("/my");
    return { error: result.message };
  }

  // 주문번호를 들고 결제창 단계로 넘어간다.
  redirect(`/checkout/${slug}/pay?order=${encodeURIComponent(result.orderCode)}`);
}
