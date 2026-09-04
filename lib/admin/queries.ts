import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * 관리자 화면이 읽는 데이터.
 *
 * 서버 전용 클라이언트가 아니라 **로그인한 관리자의 세션**으로 읽는다.
 * RLS의 *_select_admin 정책(is_admin())이 통과시켜 주기 때문이다.
 *
 * 왜 굳이 그렇게 하나 — service_role을 쓰면 RLS를 우회하므로,
 * 관리자 정책에 구멍이 있어도 화면이 멀쩡히 동작해 버린다.
 * 세션으로 읽으면 정책이 실제로 맞는지 화면이 증명해 준다.
 * (환불처럼 쓰기가 필요한 작업만 service_role을 쓴다)
 */
export async function getAdminOverview() {
  const supabase = await createClient();

  const [orders, enrollments, leads] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_code, amount, status, method, created_at, approved_at, profiles(display_name, email), courses(title)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("enrollments")
      .select("id, status, granted_at, revoked_at, source, profiles(display_name, email), courses(title)")
      .order("granted_at", { ascending: false })
      .limit(50),
    supabase
      .from("leads")
      .select("id, name, phone, consent_marketing, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (orders.error) console.error("[admin] 주문 조회 실패", orders.error);
  if (enrollments.error) console.error("[admin] 수강권 조회 실패", enrollments.error);
  if (leads.error) console.error("[admin] 신청자 조회 실패", leads.error);

  return {
    orders: orders.data ?? [],
    enrollments: enrollments.data ?? [],
    leads: leads.data ?? [],
  };
}
