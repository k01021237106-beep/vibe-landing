/**
 * 결제 승인 검증.
 *
 * ⚠️ 이 파일이 이 프로젝트에서 가장 위험한 코드다. 여기가 뚫리면 돈이 샌다.
 *
 * 지키는 원칙 하나: **클라이언트가 보낸 금액을 절대 믿지 않는다.**
 *
 * 왜 토스만으로는 부족한가 —
 *   공격자가 99,000원짜리 강의를 사면서 결제창에 100원을 넣는다.
 *   토스는 100원이 실제로 결제됐으므로 승인을 내준다. 토스 입장에서는 정상 거래다.
 *   막을 수 있는 것은 우리 서버뿐이고,
 *   **결제를 시작하기 전에 DB 가격으로 만들어 둔 주문**과 대조하는 것이 유일한 방법이다.
 *
 * 그래서 금액이 어긋나면 토스를 **부르기 전에** 멈춘다. 부르고 나서 되돌리는 건 늦다.
 *
 * 의존성을 인터페이스로 받는 이유: 이 판단 로직만 떼어 내 테스트하기 위해서다.
 * 데이터베이스와 토스 API를 붙인 채로는 위변조 시나리오를 검증하기 어렵다.
 */

export type OrderStatus = "pending" | "paid" | "failed" | "canceled" | "refunded";

export type PendingOrder = {
  id: string;
  orderCode: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  /** DB에서 읽어 주문 생성 시점에 고정한 금액. 이것만이 진짜다. */
  amount: number;
  status: OrderStatus;
};

export type OrderRepository = {
  findByOrderCode(orderCode: string): Promise<PendingOrder | null>;
  /** 주문을 결제 완료로 바꾸고 수강권을 만든다. 둘은 한 트랜잭션이어야 한다. */
  complete(input: {
    orderCode: string;
    paymentKey: string;
    method: string | null;
    raw: unknown;
  }): Promise<{ orderId: string; enrollmentId: string | null }>;
  /**
   * 승인은 났는데 완료 처리가 실패했을 때, 토스 결제 번호만이라도 주문에 남긴다.
   *
   * 이게 없으면 나중에 수동으로 수습할 때 토스 대시보드를 뒤져
   * 어느 결제가 이 주문인지 사람이 맞춰야 한다.
   * 주문 상태는 바꾸지 않는다 — 돈을 받았다고 표시하는 것은 완료 처리의 몫이다.
   */
  recordPaymentKey(input: { orderCode: string; paymentKey: string }): Promise<void>;
};

export type TossConfirmResult =
  | { ok: true; method: string | null; raw: unknown }
  | { ok: false; code: string; message: string };

export type TossGateway = {
  confirm(input: {
    paymentKey: string;
    orderCode: string;
    amount: number;
  }): Promise<TossConfirmResult>;
};

export type ConfirmInput = {
  paymentKey: string;
  orderCode: string;
  /** 클라이언트(토스 리디렉션)가 들고 온 금액. 대조용으로만 쓰고 그대로 쓰지 않는다. */
  claimedAmount: number;
};

export type ConfirmFailureReason =
  | "invalid_request"
  | "order_not_found"
  | "amount_mismatch"
  | "order_not_payable"
  | "payment_rejected"
  | "server_error";

export type ConfirmResult =
  | { ok: true; orderId: string; enrollmentId: string | null; alreadyPaid: boolean }
  | { ok: false; reason: ConfirmFailureReason; message: string };

/** 원 단위 정수인지. 소수·음수·NaN·Infinity를 모두 걸러 낸다. */
function isValidAmount(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

export async function confirmPayment(
  input: ConfirmInput,
  deps: { orders: OrderRepository; toss: TossGateway },
): Promise<ConfirmResult> {
  const { paymentKey, orderCode, claimedAmount } = input;

  if (!paymentKey || !orderCode) {
    return { ok: false, reason: "invalid_request", message: "결제 정보가 올바르지 않습니다." };
  }

  const order = await deps.orders.findByOrderCode(orderCode);
  if (!order) {
    return { ok: false, reason: "order_not_found", message: "주문을 찾을 수 없습니다." };
  }

  /*
   * 이미 결제된 주문.
   * 토스가 같은 승인을 두 번 보내거나 사용자가 완료 화면을 새로고침할 수 있다.
   * 두 번 승인하면 두 번 청구된다. 여기서 멈추고 그대로 성공으로 돌려준다.
   */
  if (order.status === "paid") {
    return { ok: true, orderId: order.id, enrollmentId: null, alreadyPaid: true };
  }

  // 취소·환불된 주문을 되살리지 않는다.
  if (order.status !== "pending") {
    return {
      ok: false,
      reason: "order_not_payable",
      message: "이미 처리된 주문입니다.",
    };
  }

  /*
   * ── 핵심 검증 ──
   * 클라이언트가 들고 온 금액이 주문에 박아 둔 금액과 정확히 같아야 한다.
   * 다르면 여기서 끝낸다. 토스를 부르지 않는다.
   */
  if (!isValidAmount(claimedAmount) || claimedAmount !== order.amount) {
    return {
      ok: false,
      reason: "amount_mismatch",
      message: "결제 금액이 주문 금액과 다릅니다.",
    };
  }

  let confirmation: TossConfirmResult;
  try {
    confirmation = await deps.toss.confirm({
      paymentKey,
      orderCode,
      // 클라이언트 값이 아니라 주문에 저장된 값을 보낸다.
      amount: order.amount,
    });
  } catch (cause) {
    console.error("[payments] 토스 승인 호출 실패", cause);
    return {
      ok: false,
      reason: "server_error",
      message: "결제 승인 중 문제가 생겼습니다. 결제되었다면 곧 처리됩니다.",
    };
  }

  if (!confirmation.ok) {
    // 돈을 못 받았으면 수강권도 없다.
    return {
      ok: false,
      reason: "payment_rejected",
      message: confirmation.message || "결제가 승인되지 않았습니다.",
    };
  }

  try {
    const completed = await deps.orders.complete({
      orderCode,
      paymentKey,
      method: confirmation.method,
      raw: confirmation.raw,
    });
    return { ok: true, ...completed, alreadyPaid: false };
  } catch (cause) {
    /*
     * 돈은 받았는데 수강권 생성에 실패한 경우다. 가장 곤란한 상태이므로
     * 반드시 로그에 남긴다. 사용자에게는 결제가 되었다고 알리고 안내로 연결한다.
     */
    console.error("[payments] 승인은 됐으나 수강권 생성 실패", { orderCode, cause });

    /*
     * 결제 번호만이라도 주문에 남긴다. 로그는 지워지고 사람은 잊는다.
     * 이 값이 주문에 붙어 있으면 나중에 수동 처리가 조회 한 번으로 끝난다.
     *
     * 여기서 또 실패해도 삼킨다 — 이미 실패를 알리는 중이고,
     * 수습을 위한 부가 작업 때문에 손님에게 다른 오류를 보여 줄 이유가 없다.
     */
    try {
      await deps.orders.recordPaymentKey({ orderCode, paymentKey });
    } catch (saveCause) {
      console.error("[payments] 결제 번호 보존까지 실패", { orderCode, saveCause });
    }
    return {
      ok: false,
      reason: "server_error",
      message:
        "결제는 완료되었지만 수강 등록에 문제가 생겼습니다. 문의해 주시면 바로 처리해 드립니다.",
    };
  }
}
