import "server-only";

import type { OrderRepository, TossGateway } from "@/lib/payments/confirm";
import { createOrderRepository } from "@/lib/payments/orders";
import { createTossGateway, hasTossKeys } from "@/lib/payments/toss";
import { hasServiceRoleKey } from "@/lib/supabase/admin";

/**
 * 결제 승인에 필요한 것들을 모아 준다.
 *
 * 키가 하나라도 없으면 만들다가 예외가 나고, 그러면 사용자에게는
 * 내용 없는 500이 간다. 설정이 덜 된 것은 사용자 잘못이 아니므로
 * 여기서 미리 확인해 알아볼 수 있는 실패로 바꾼다.
 */
export type PaymentDeps =
  | { ok: true; orders: OrderRepository; toss: TossGateway }
  | { ok: false; message: string };

export function createPaymentDeps(): PaymentDeps {
  if (!hasServiceRoleKey() || !hasTossKeys()) {
    console.error(
      "[payments] 결제 설정이 완료되지 않았습니다. " +
        "SUPABASE_SERVICE_ROLE_KEY / TOSS_SECRET_KEY / NEXT_PUBLIC_TOSS_CLIENT_KEY를 확인하세요.",
    );
    return {
      ok: false,
      message: "결제 기능이 아직 준비되지 않았습니다. 문의해 주시면 도와드리겠습니다.",
    };
  }

  try {
    return { ok: true, orders: createOrderRepository(), toss: createTossGateway() };
  } catch (cause) {
    console.error("[payments] 결제 준비 실패", cause);
    return {
      ok: false,
      message: "결제 기능이 아직 준비되지 않았습니다. 문의해 주시면 도와드리겠습니다.",
    };
  }
}
