"use server";

import { revalidatePath } from "next/cache";

import { isCurrentUserAdmin } from "@/lib/admin/guard";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

export type RefundState = { message: string; ok: boolean } | null;

/**
 * 환불 처리.
 *
 * ⚠️ 관리자 확인을 가장 먼저 한다. 이 검사 아래로는 RLS를 우회하는 권한이 쓰인다.
 *
 * 주문 상태 변경과 수강권 회수는 데이터베이스 함수가 한 트랜잭션으로 처리한다 (Phase 5).
 * 따로 하면 "환불은 됐는데 강의는 계속 보이는" 상태가 남는다.
 *
 * 실제 결제 취소(토스에 돈을 돌려주라고 알리는 일)는 아직 여기서 하지 않는다.
 * 지금은 우리 쪽 기록과 접근권만 정리한다 — 토스 취소 API 연동은
 * 실제 결제가 돌기 시작한 뒤에 붙인다.
 */
export async function refundOrder(
  _previous: RefundState,
  formData: FormData,
): Promise<RefundState> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, message: "권한이 없습니다." };
  }

  const orderCode = String(formData.get("orderCode") ?? "");
  if (!orderCode) {
    return { ok: false, message: "주문번호가 없습니다." };
  }

  if (!hasServiceRoleKey()) {
    return {
      ok: false,
      message: "환불 처리에 필요한 설정이 완료되지 않았습니다. (SUPABASE_SERVICE_ROLE_KEY)",
    };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("refund_order", { p_order_code: orderCode });

    if (error) {
      console.error("[admin] 환불 실패", error);
      return { ok: false, message: `환불하지 못했습니다: ${error.message}` };
    }

    revalidatePath("/admin");
    return { ok: true, message: `${orderCode} 환불 처리했습니다. 수강권도 회수됐습니다.` };
  } catch (cause) {
    console.error("[admin] 환불 중 오류", cause);
    return { ok: false, message: "환불 처리 중 문제가 생겼습니다." };
  }
}
