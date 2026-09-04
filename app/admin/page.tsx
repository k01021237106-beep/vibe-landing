import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { RefundButton } from "@/components/admin/refund-button";
import { isCurrentUserAdmin } from "@/lib/admin/guard";
import { getAdminOverview } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/config";
import { formatPhoneForDisplay } from "@/lib/phone";

export const metadata: Metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  failed: "결제 실패",
  canceled: "취소",
  refunded: "환불",
  active: "수강 중",
  revoked: "회수됨",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 관리자 화면.
 *
 * ⚠️ 비관리자에게는 404를 준다. 403이 아니다 —
 *    403은 "여기에 관리자 화면이 있다"는 사실을 알려 준다.
 *    관리자 주소는 굳이 알릴 이유가 없다.
 */
export default async function AdminPage() {
  if (!(await isCurrentUserAdmin())) notFound();

  const { orders, enrollments, leads } = await getAdminOverview();

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
      <h1 className="text-3xl sm:text-4xl">관리자</h1>

      <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat label="주문" value={orders.length} />
        <Stat label="결제 완료" value={orders.filter((o) => o.status === "paid").length} />
        <Stat label="수강 중" value={enrollments.filter((e) => e.status === "active").length} />
        <Stat label="무료 신청자" value={leads.length} />
      </dl>

      <Panel title="주문" caption="최근 50건">
        {orders.length === 0 ? (
          <Empty>아직 주문이 없습니다.</Empty>
        ) : (
          <Table head={["주문번호", "강의", "구매자", "금액", "상태", "결제일", ""]}>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-line align-top">
                <td className="py-4 pr-4 font-mono text-sm">{order.order_code}</td>
                <td className="py-4 pr-4">{order.courses?.title ?? "-"}</td>
                <td className="py-4 pr-4">
                  {order.profiles?.display_name ?? order.profiles?.email ?? "-"}
                </td>
                <td className="py-4 pr-4 whitespace-nowrap">{formatPrice(order.amount)}</td>
                <td className="py-4 pr-4 whitespace-nowrap">
                  {STATUS_LABEL[order.status] ?? order.status}
                </td>
                <td className="py-4 pr-4 whitespace-nowrap text-sm text-muted">
                  {formatDate(order.approved_at ?? order.created_at)}
                </td>
                <td className="py-4">
                  {order.status === "paid" ? (
                    <RefundButton orderCode={order.order_code} />
                  ) : null}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      <Panel title="수강생" caption="최근 50건">
        {enrollments.length === 0 ? (
          <Empty>아직 수강생이 없습니다.</Empty>
        ) : (
          <Table head={["수강생", "강의", "상태", "발급일", "회수일"]}>
            {enrollments.map((item) => (
              <tr key={item.id} className="border-b border-line align-top">
                <td className="py-4 pr-4">
                  {item.profiles?.display_name ?? item.profiles?.email ?? "-"}
                </td>
                <td className="py-4 pr-4">{item.courses?.title ?? "-"}</td>
                <td className="py-4 pr-4 whitespace-nowrap">
                  {STATUS_LABEL[item.status] ?? item.status}
                </td>
                <td className="py-4 pr-4 whitespace-nowrap text-sm text-muted">
                  {formatDate(item.granted_at)}
                </td>
                <td className="py-4 whitespace-nowrap text-sm text-muted">
                  {formatDate(item.revoked_at)}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      <Panel title="무료 1강 신청자" caption="최근 50건">
        {leads.length === 0 ? (
          <Empty>아직 신청자가 없습니다.</Empty>
        ) : (
          <Table head={["이름", "연락처", "마케팅 수신", "신청일"]}>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-line align-top">
                <td className="py-4 pr-4">{lead.name}</td>
                <td className="py-4 pr-4 font-mono text-sm">
                  {formatPhoneForDisplay(lead.phone)}
                </td>
                <td className="py-4 pr-4">{lead.consent_marketing ? "동의" : "-"}</td>
                <td className="py-4 whitespace-nowrap text-sm text-muted">
                  {formatDate(lead.created_at)}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-t-2 border-fg pt-4">
      <dt className="text-base text-muted">{label}</dt>
      <dd className="mt-1 font-display text-3xl font-black">{value}</dd>
    </div>
  );
}

function Panel({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-2xl">{title}</h2>
        <p className="text-base text-muted">{caption}</p>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    // 좁은 화면에서는 표만 가로로 스크롤한다. 페이지 전체가 밀리면 안 된다.
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-base">
        <thead>
          <tr className="border-b-2 border-fg text-left">
            {head.map((label, index) => (
              <th key={index} scope="col" className="py-3 pr-4 font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-2 border-line bg-surface p-6 text-base text-muted">{children}</p>
  );
}
