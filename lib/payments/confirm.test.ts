import { describe, expect, it, vi } from "vitest";

import { confirmPayment } from "@/lib/payments/confirm";
import type { OrderRepository, PendingOrder, TossGateway } from "@/lib/payments/confirm";

/**
 * 결제 승인 검증.
 *
 * 이 파일이 지키는 것: **클라이언트가 보낸 금액을 절대 믿지 않는다.**
 *
 * 공격 시나리오는 단순하다. 99,000원짜리 강의를 사면서 결제창에 100원을 넣는다.
 * 토스는 100원이 실제로 결제됐으므로 승인을 내준다 — 토스 잘못이 아니다.
 * 막을 수 있는 것은 우리 서버뿐이고, DB에 저장해 둔 주문 금액과 대조하는 것이 유일한 방법이다.
 *
 * 그래서 아래 테스트는 "거부되는가"뿐 아니라
 * **"토스를 아예 부르지 않는가"** 까지 본다. 부르고 나서 되돌리는 건 늦다.
 */

const 정상주문: PendingOrder = {
  id: "order-uuid-1",
  orderCode: "FD-20260904-ABC123",
  userId: "user-uuid-1",
  courseId: "course-uuid-1",
  courseTitle: "첫배포 바이브코딩 입문",
  amount: 99_000, // DB에서 읽은 값. 이것만이 진짜다.
  status: "pending",
};

function 가짜저장소(order: PendingOrder | null = 정상주문): OrderRepository & {
  complete: ReturnType<typeof vi.fn>;
  recordPaymentKey: ReturnType<typeof vi.fn>;
} {
  return {
    findByOrderCode: vi.fn(async () => order),
    complete: vi.fn(async () => ({ orderId: "order-uuid-1", enrollmentId: "enroll-uuid-1" })),
    recordPaymentKey: vi.fn(async () => {}),
  };
}

function 가짜토스(ok = true): TossGateway & { confirm: ReturnType<typeof vi.fn> } {
  return {
    confirm: vi.fn(async () =>
      ok
        ? ({ ok: true, method: "카드", raw: { status: "DONE" } } as const)
        : ({ ok: false, code: "REJECT_CARD_COMPANY", message: "카드사 거절" } as const),
    ),
  };
}

describe("금액 위변조 거부", () => {
  it("깎아서 보내면 거부하고, 토스를 부르지 않는다", async () => {
    const orders = 가짜저장소();
    const toss = 가짜토스();

    const result = await confirmPayment(
      { paymentKey: "pk_1", orderCode: 정상주문.orderCode, claimedAmount: 100 },
      { orders, toss },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("amount_mismatch");
    expect(toss.confirm).not.toHaveBeenCalled();
    expect(orders.complete).not.toHaveBeenCalled();
  });

  it("올려서 보내도 거부한다", async () => {
    const orders = 가짜저장소();
    const toss = 가짜토스();
    const result = await confirmPayment(
      { paymentKey: "pk_1", orderCode: 정상주문.orderCode, claimedAmount: 990_000 },
      { orders, toss },
    );
    expect(result.ok).toBe(false);
    expect(toss.confirm).not.toHaveBeenCalled();
  });

  it("1원만 달라도 거부한다", async () => {
    const orders = 가짜저장소();
    const toss = 가짜토스();
    const result = await confirmPayment(
      { paymentKey: "pk_1", orderCode: 정상주문.orderCode, claimedAmount: 98_999 },
      { orders, toss },
    );
    expect(result.ok).toBe(false);
    expect(toss.confirm).not.toHaveBeenCalled();
  });

  it("숫자가 아닌 금액은 거부한다", async () => {
    const orders = 가짜저장소();
    const toss = 가짜토스();
    for (const bad of [NaN, Infinity, -99_000, 99_000.5]) {
      const result = await confirmPayment(
        { paymentKey: "pk_1", orderCode: 정상주문.orderCode, claimedAmount: bad },
        { orders, toss },
      );
      expect(result.ok, `금액 ${bad}`).toBe(false);
    }
    expect(toss.confirm).not.toHaveBeenCalled();
  });

  it("금액이 맞으면 통과하고, 토스에는 DB 값을 보낸다", async () => {
    const orders = 가짜저장소();
    const toss = 가짜토스();

    const result = await confirmPayment(
      { paymentKey: "pk_1", orderCode: 정상주문.orderCode, claimedAmount: 99_000 },
      { orders, toss },
    );

    expect(result.ok).toBe(true);
    // 클라이언트가 보낸 값이 아니라 주문에 저장된 값을 넘겨야 한다
    expect(toss.confirm).toHaveBeenCalledWith({
      paymentKey: "pk_1",
      orderCode: 정상주문.orderCode,
      amount: 99_000,
    });
    expect(orders.complete).toHaveBeenCalled();
  });
});

describe("주문 상태", () => {
  it("없는 주문번호는 거부한다", async () => {
    const orders = 가짜저장소(null);
    const toss = 가짜토스();
    const result = await confirmPayment(
      { paymentKey: "pk_1", orderCode: "없는번호", claimedAmount: 99_000 },
      { orders, toss },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("order_not_found");
    expect(toss.confirm).not.toHaveBeenCalled();
  });

  it("이미 결제된 주문은 토스를 다시 부르지 않고 그대로 성공 처리한다", async () => {
    // 토스가 같은 승인을 두 번 보내거나 사용자가 새로고침할 수 있다.
    const orders = 가짜저장소({ ...정상주문, status: "paid" });
    const toss = 가짜토스();

    const result = await confirmPayment(
      { paymentKey: "pk_1", orderCode: 정상주문.orderCode, claimedAmount: 99_000 },
      { orders, toss },
    );

    expect(result.ok).toBe(true);
    expect(toss.confirm).not.toHaveBeenCalled();
  });

  it("취소·환불된 주문은 되살리지 않는다", async () => {
    for (const status of ["canceled", "refunded"] as const) {
      const orders = 가짜저장소({ ...정상주문, status });
      const toss = 가짜토스();
      const result = await confirmPayment(
        { paymentKey: "pk_1", orderCode: 정상주문.orderCode, claimedAmount: 99_000 },
        { orders, toss },
      );
      expect(result.ok, status).toBe(false);
      expect(toss.confirm).not.toHaveBeenCalled();
    }
  });
});

describe("결제 실패", () => {
  it("토스가 거절하면 수강권을 만들지 않는다", async () => {
    const orders = 가짜저장소();
    const toss = 가짜토스(false);

    const result = await confirmPayment(
      { paymentKey: "pk_1", orderCode: 정상주문.orderCode, claimedAmount: 99_000 },
      { orders, toss },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("payment_rejected");
    // 가장 중요한 단언: 돈을 못 받았으면 수강권도 없다
    expect(orders.complete).not.toHaveBeenCalled();
  });

  it("토스 호출이 통째로 실패해도 수강권을 만들지 않는다", async () => {
    const orders = 가짜저장소();
    const toss: TossGateway = {
      confirm: vi.fn(async () => {
        throw new Error("network down");
      }),
    };

    const result = await confirmPayment(
      { paymentKey: "pk_1", orderCode: 정상주문.orderCode, claimedAmount: 99_000 },
      { orders, toss },
    );

    expect(result.ok).toBe(false);
    expect(orders.complete).not.toHaveBeenCalled();
  });
});

/*
 * 2026-09-05 첫 실결제 테스트에서 실제로 난 상황이다.
 * 토스 승인은 났는데 complete_paid_order를 부를 권한이 없어 403이 났다.
 * 주문은 pending에 머물고 수강권도 없었다 — 트랜잭션은 제대로 버텼다.
 *
 * 문제는 그다음이다. 그때 우리는 토스 결제 번호를 어디에도 남기지 않았다.
 * 로그는 지워지고 사람은 잊는다. 실제 손님이었다면 수동 수습이 훨씬 어려웠다.
 */
describe("승인 후 완료 처리가 실패했을 때", () => {
  function 완료실패저장소() {
    const orders = 가짜저장소();
    orders.complete = vi.fn(async () => {
      throw new Error("permission denied for function complete_paid_order");
    });
    return orders;
  }

  it("결제 번호를 주문에 남긴다", async () => {
    const orders = 완료실패저장소();

    const result = await confirmPayment(
      { paymentKey: "pk_실제번호", orderCode: 정상주문.orderCode, claimedAmount: 99_000 },
      { orders, toss: 가짜토스() },
    );

    expect(result.ok).toBe(false);
    expect(orders.recordPaymentKey).toHaveBeenCalledWith({
      orderCode: 정상주문.orderCode,
      paymentKey: "pk_실제번호",
    });
  });

  it("손님에게는 결제가 되었다고 알린다", async () => {
    const result = await confirmPayment(
      { paymentKey: "pk_1", orderCode: 정상주문.orderCode, claimedAmount: 99_000 },
      { orders: 완료실패저장소(), toss: 가짜토스() },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("결제는 완료되었지만");
      // "결제가 안 됐다"고 말하면 손님이 다시 결제한다. 이중 결제가 된다.
      expect(result.message).not.toContain("결제되지");
    }
  });

  /* 수습을 위한 부가 작업이 손님에게 다른 오류를 보여 주면 안 된다. */
  it("결제 번호 보존까지 실패해도 같은 안내를 준다", async () => {
    const orders = 완료실패저장소();
    orders.recordPaymentKey = vi.fn(async () => {
      throw new Error("db down");
    });

    const result = await confirmPayment(
      { paymentKey: "pk_1", orderCode: 정상주문.orderCode, claimedAmount: 99_000 },
      { orders, toss: 가짜토스() },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("결제는 완료되었지만");
  });

  /* 승인 자체가 실패한 경우에는 남길 결제도 없다. */
  it("토스가 거절했으면 결제 번호를 남기지 않는다", async () => {
    const orders = 가짜저장소();

    await confirmPayment(
      { paymentKey: "pk_1", orderCode: 정상주문.orderCode, claimedAmount: 99_000 },
      { orders, toss: 가짜토스(false) },
    );

    expect(orders.recordPaymentKey).not.toHaveBeenCalled();
  });
});
