import type { Metadata } from "next";

import { Article, LegalPage, List } from "@/components/legal/legal-page";
import { business, contact } from "@/lib/config";

/*
 * ⚠️⚠️ 오픈 전 반드시 처리할 것 ⚠️⚠️
 *
 * 1. 법률 전문가 검토 전 **초안**이다. 환불 규정은 분쟁이 가장 자주 생기는 문서다.
 *    판매 시작 전에 반드시 검토받는다.
 * 2. 아래 기준은 「전자상거래 등에서의 소비자보호에 관한 법률」의
 *    청약철회 규정(제17조)을 참고해 작성했다. 디지털콘텐츠는 제공이 개시되면
 *    청약철회가 제한될 수 있으나, 가분적 콘텐츠의 미개시 부분은 철회가 가능하다.
 *    이 강의는 차시별로 나뉘어 있으므로 그 점을 반영했다.
 * 3. 랜딩 FAQ와 이 문서의 내용이 어긋나지 않게 유지한다.
 *    (FAQ는 데이터베이스 faqs 테이블에 있다)
 * 4. 시행일을 실제 날짜로 바꾼다.
 */

export const metadata: Metadata = {
  title: "환불 규정",
  description: "첫배포 강의의 청약철회와 환불 기준을 안내합니다.",
};

// TODO: 실제 시행일로 교체
const EFFECTIVE_DATE = "추후 입력";

export default function RefundPage() {
  return (
    <LegalPage title="환불 규정" effectiveDate={EFFECTIVE_DATE}>
      <Article heading="1. 기본 원칙">
        <p>
          {business.companyName}(이하 &lsquo;회사&rsquo;)는 「전자상거래 등에서의
          소비자보호에 관한 법률」에 따라 이용자의 청약철회권을 보장합니다. 이
          규정은 법령이 정한 기준보다 이용자에게 불리하지 않게 적용됩니다.
        </p>
      </Article>

      <Article heading="2. 청약철회 기간">
        <p>
          결제일 또는 강의를 이용할 수 있게 된 날 중 나중에 오는 날부터{" "}
          <strong className="font-medium">7일 이내</strong>에 청약철회를 신청하실 수
          있습니다.
        </p>
      </Article>

      <Article heading="3. 환불 기준">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-base">
            <caption className="sr-only">수강 상태에 따른 환불 기준</caption>
            <thead>
              <tr className="border-b-2 border-fg text-left">
                <th scope="col" className="py-3 pr-4 font-medium">신청 시점</th>
                <th scope="col" className="py-3 pr-4 font-medium">수강 상태</th>
                <th scope="col" className="py-3 font-medium">환불 금액</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line align-top">
                <th scope="row" className="py-3 pr-4 text-left font-normal">7일 이내</th>
                <td className="py-3 pr-4">한 차시도 시청하지 않음</td>
                <td className="py-3">전액</td>
              </tr>
              <tr className="border-b border-line align-top">
                <th scope="row" className="py-3 pr-4 text-left font-normal">7일 이내</th>
                <td className="py-3 pr-4">일부 차시 시청</td>
                <td className="py-3">
                  결제 금액에서 시청한 차시에 해당하는 금액을 뺀 나머지
                </td>
              </tr>
              <tr className="border-b border-line align-top">
                <th scope="row" className="py-3 pr-4 text-left font-normal">7일 경과</th>
                <td className="py-3 pr-4">—</td>
                <td className="py-3">
                  원칙적으로 환불되지 않습니다 (아래 4항의 예외 참고)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          시청한 차시에 해당하는 금액은 &lsquo;결제 금액 ÷ 전체 차시 수 × 시청한
          차시 수&rsquo;로 계산합니다. 차시의 일부만 재생한 경우에도 해당 차시를
          시청한 것으로 봅니다.
        </p>
      </Article>

      <Article heading="4. 기간과 무관하게 환불되는 경우">
        <p>
          다음의 경우에는 7일이 지났더라도 전액 환불해 드립니다.
        </p>
        <List
          items={[
            "강의 내용이 표시·광고한 내용과 현저히 다른 경우",
            "회사의 사정으로 강의를 정상적으로 제공하지 못하는 경우",
            "영상 재생 불가 등 회사 책임의 기술적 문제가 상당 기간 해결되지 않는 경우",
            "서비스가 종료되는 경우 (잔여 이용 기간에 상응하는 금액)",
          ]}
        />
      </Article>

      <Article heading="5. 환불이 제한되는 경우">
        <List
          items={[
            "이용자가 강의 영상을 녹화·복제·배포하거나 제3자와 공유한 경우",
            "계정을 타인에게 대여하거나 양도한 경우",
            "부정한 방법으로 할인을 받거나 결제한 경우",
          ]}
        />
        <p>
          위 사유로 수강권이 회수된 경우에는 환불하지 않으며, 회사는 이와 별도로
          손해배상을 청구할 수 있습니다.
        </p>
      </Article>

      <Article heading="6. 무료 강의">
        <p>
          무료로 제공되는 강의는 결제가 이루어지지 않으므로 환불 대상이 아닙니다.
          신청 정보의 삭제를 원하시면 아래 연락처로 요청해 주시기 바랍니다.
        </p>
      </Article>

      <Article heading="7. 환불 절차와 기간">
        <List
          items={[
            "카카오톡 채널 또는 이메일로 환불을 신청해 주시기 바랍니다.",
            "회사는 신청을 받은 날부터 3영업일 이내에 환불 가능 여부와 금액을 안내합니다.",
            "환불이 확정되면 영업일 기준 3일 이내에 처리합니다.",
            "결제 수단에 따라 실제 입금까지는 카드사 또는 은행의 처리 기간이 추가로 걸릴 수 있습니다.",
            "환불은 원칙적으로 결제한 수단으로 이루어집니다.",
          ]}
        />
      </Article>

      <Article heading="8. 문의">
        <p>
          환불에 관한 문의는 카카오톡 채널 또는 {contact.email}(으)로 연락해 주시기
          바랍니다.
        </p>
      </Article>
    </LegalPage>
  );
}
