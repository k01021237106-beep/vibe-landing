import "server-only";

import { randomBytes } from "node:crypto";

import type { OrderRepository, OrderStatus, PendingOrder } from "@/lib/payments/confirm";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 주문 저장소.
 *
 * 서버 전용 클라이언트를 쓴다 — `orders`와 `enrollments`에는 클라이언트용 쓰기 정책이
 * 아예 없다 (Phase 2). 금액을 클라이언트가 만들거나 고칠 수 없어야 하기 때문이다.
 */

/** 토스에 넘길 주문번호. 사람이 읽을 수 있으면서 추측은 어렵게. */
export function generateOrderCode(): string {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  // 주문번호를 추측해 남의 주문을 건드릴 수 없도록 임의값을 붙인다.
  const random = randomBytes(8).toString("base64url").replace(/[^A-Za-z0-9]/g, "").slice(0, 10);
  return `FD-${date}-${random}`;
}

export type CreateOrderResult =
  | { ok: true; orderCode: string; amount: number; orderName: string }
  | { ok: false; reason: "course_not_found" | "already_enrolled" | "server_error"; message: string };

/**
 * 결제를 시작하기 전에 대기 주문을 만든다.
 *
 * ⚠️ 여기가 금액 검증의 출발점이다.
 *    가격을 **DB에서 읽어** 주문에 박아 둔다. 클라이언트가 보낸 금액은 받지도 않는다.
 *    승인 단계에서는 이 값과만 대조한다 (lib/payments/confirm.ts).
 */
export async function createPendingOrder(input: {
  userId: string;
  courseSlug: string;
}): Promise<CreateOrderResult> {
  try {
    const admin = createAdminClient();

    const { data: course, error: courseError } = await admin
      .from("courses")
      .select("id, title, sale_price")
      .eq("slug", input.courseSlug)
      .eq("is_published", true)
      .maybeSingle();

    if (courseError || !course) {
      return { ok: false, reason: "course_not_found", message: "강의를 찾을 수 없습니다." };
    }

    // 이미 수강 중이면 다시 결제하게 두지 않는다.
    const { data: existing } = await admin
      .from("enrollments")
      .select("id")
      .eq("user_id", input.userId)
      .eq("course_id", course.id)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      return {
        ok: false,
        reason: "already_enrolled",
        message: "이미 수강 중인 강의입니다.",
      };
    }

    const orderCode = generateOrderCode();

    const { error: insertError } = await admin.from("orders").insert({
      user_id: input.userId,
      course_id: course.id,
      order_code: orderCode,
      // DB에서 읽은 가격. 이 값이 결제 승인 때 유일한 기준이 된다.
      amount: course.sale_price,
      status: "pending",
    });

    if (insertError) {
      console.error("[payments] 대기 주문 생성 실패", insertError);
      return { ok: false, reason: "server_error", message: "주문을 만들지 못했습니다." };
    }

    return {
      ok: true,
      orderCode,
      amount: course.sale_price,
      orderName: course.title,
    };
  } catch (cause) {
    console.error("[payments] 대기 주문 생성 중 오류", cause);
    return { ok: false, reason: "server_error", message: "주문을 만들지 못했습니다." };
  }
}

export function createOrderRepository(): OrderRepository {
  const admin = createAdminClient();

  return {
    async findByOrderCode(orderCode: string): Promise<PendingOrder | null> {
      const { data, error } = await admin
        .from("orders")
        .select("id, order_code, user_id, course_id, amount, status, courses(title)")
        .eq("order_code", orderCode)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        orderCode: data.order_code,
        userId: data.user_id,
        courseId: data.course_id,
        courseTitle: data.courses?.title ?? "",
        amount: data.amount,
        status: data.status as OrderStatus,
      };
    },

    async complete({ orderCode, paymentKey, method, raw }) {
      // 주문 상태 변경과 수강권 발급을 한 트랜잭션으로 처리한다.
      const { data, error } = await admin.rpc("complete_paid_order", {
        p_order_code: orderCode,
        p_payment_key: paymentKey,
        p_method: method,
        p_raw: raw as never,
      });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      return {
        orderId: row?.order_id ?? "",
        enrollmentId: row?.enrollment_id ?? null,
      };
    },
  };
}
