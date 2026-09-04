import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { PaymentWidget } from "@/components/checkout/payment-widget";
import { formatPrice } from "@/lib/config";
import { getCourseBySlug } from "@/lib/content";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string }>;
};

export const metadata: Metadata = {
  title: "결제 진행",
  robots: { index: false, follow: false },
};

/**
 * 결제창.
 *
 * 주문은 앞 단계에서 서버가 이미 만들었다. 여기서는 그 주문을 다시 읽어
 * **DB에 저장된 금액**을 결제창에 넘긴다. 클라이언트가 금액을 정하지 않는다.
 */
export default async function PayPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { order: orderCode } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/checkout/${slug}`);

  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  if (!orderCode) redirect(`/checkout/${slug}`);

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey || !hasServiceRoleKey()) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-16 lg:py-24">
        <h1 className="text-3xl sm:text-4xl">결제 준비 중입니다</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          결제 기능을 아직 열지 않았습니다. 조금만 기다려 주세요.
        </p>
      </section>
    );
  }

  // 주문이 실제로 존재하고 이 사용자의 것인지 확인한다.
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("order_code, amount, status, user_id")
    .eq("order_code", orderCode)
    .maybeSingle();

  if (!order || order.user_id !== user.id) redirect(`/checkout/${slug}`);
  if (order.status !== "pending") redirect("/my");

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 lg:py-24">
      <h1 className="text-3xl sm:text-4xl">결제</h1>
      <p className="mt-4 text-lg text-muted">
        {course.title} · {formatPrice(order.amount)}
      </p>

      <PaymentWidget
        clientKey={clientKey}
        orderCode={order.order_code}
        // DB에서 읽은 금액이다. 클라이언트가 고쳐도 승인 단계에서 거부된다.
        amount={order.amount}
        orderName={course.title}
        slug={slug}
      />
    </section>
  );
}
