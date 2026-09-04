import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { ConsentGate } from "@/components/checkout/consent-gate";
import { discountRate, formatPrice } from "@/lib/config";
import { getCourseBySlug } from "@/lib/content";
import { getCurrentUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: "결제",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({ params }: Params) {
  const { slug } = await params;

  // 결제에는 로그인이 필요하다. 수강권을 누구에게 줄지 알아야 하기 때문이다.
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/checkout/${slug}`);

  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const rate = discountRate(course.list_price, course.sale_price);

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 lg:py-24">
      <h1 className="text-3xl sm:text-4xl">결제</h1>

      <div className="mt-10 border-2 border-fg p-6">
        <h2 className="text-xl leading-snug sm:text-2xl">{course.title}</h2>
        {course.subtitle ? (
          <p className="mt-3 text-base leading-relaxed text-muted">{course.subtitle}</p>
        ) : null}

        <dl className="mt-8 border-t border-line pt-6">
          <div className="flex items-baseline justify-between py-2">
            <dt className="text-base text-muted">정가</dt>
            <dd className="text-base text-muted line-through">
              {formatPrice(course.list_price)}
            </dd>
          </div>
          {rate > 0 ? (
            <div className="flex items-baseline justify-between py-2">
              <dt className="text-base text-muted">오픈 할인</dt>
              <dd className="font-mono text-base">-{rate}%</dd>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between border-t border-line pt-4">
            <dt className="text-lg font-medium">결제 금액</dt>
            <dd className="text-2xl">
              <strong className="font-display font-black">
                {formatPrice(course.sale_price)}
              </strong>
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-base text-muted">부가세 포함 금액입니다.</p>
      </div>

      <ConsentGate slug={slug} />
    </section>
  );
}
