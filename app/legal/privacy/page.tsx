import type { Metadata } from "next";

import { Article, LegalPage, List } from "@/components/legal/legal-page";
import { business, contact, site } from "@/lib/config";

/*
 * ⚠️⚠️ 오픈 전 반드시 처리할 것 ⚠️⚠️
 *
 * 1. 법률 전문가 검토 전 **초안**이다. 판매 시작 전에 검토받는다.
 * 2. 개인정보 보호책임자와 사업자 정보를 lib/config.ts에서 실제 값으로 채운다.
 * 3. 아래 '처리위탁' 표의 업체가 실제 사용하는 곳과 맞는지 확인한다.
 *    (Supabase·Vercel은 국외 이전에 해당하므로 고지가 필요하다)
 * 4. 시행일을 실제 날짜로 바꾼다.
 */

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "첫배포가 개인정보를 어떻게 수집하고 이용하는지 안내합니다.",
};

// TODO: 실제 시행일로 교체
const EFFECTIVE_DATE = "추후 입력";

export default function PrivacyPage() {
  return (
    <LegalPage title="개인정보처리방침" effectiveDate={EFFECTIVE_DATE}>
      <Article heading="1. 총칙">
        <p>
          {business.companyName}(이하 &lsquo;회사&rsquo;)는 이용자의 개인정보를
          중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 이
          방침은 회사가 운영하는 {site.name}에 적용됩니다.
        </p>
      </Article>

      <Article heading="2. 수집하는 개인정보 항목과 수집 방법">
        <p>회사는 다음의 개인정보를 수집합니다.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-base">
            <caption className="sr-only">수집하는 개인정보 항목</caption>
            <thead>
              <tr className="border-b-2 border-fg text-left">
                <th scope="col" className="py-3 pr-4 font-medium">구분</th>
                <th scope="col" className="py-3 pr-4 font-medium">항목</th>
                <th scope="col" className="py-3 font-medium">수집 시점</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line align-top">
                <th scope="row" className="py-3 pr-4 text-left font-normal">무료 강의 신청</th>
                <td className="py-3 pr-4">이름, 연락처</td>
                <td className="py-3">신청 폼 작성 시</td>
              </tr>
              <tr className="border-b border-line align-top">
                <th scope="row" className="py-3 pr-4 text-left font-normal">회원가입</th>
                <td className="py-3 pr-4">
                  카카오 로그인: 닉네임, 프로필 사진, 이메일
                  <br />
                  이메일 로그인: 이메일
                </td>
                <td className="py-3">로그인 시</td>
              </tr>
              <tr className="border-b border-line align-top">
                <th scope="row" className="py-3 pr-4 text-left font-normal">결제</th>
                <td className="py-3 pr-4">
                  결제 수단 정보, 결제 내역
                  <br />
                  (카드번호 등 결제 정보는 회사가 저장하지 않습니다)
                </td>
                <td className="py-3">결제 시</td>
              </tr>
              <tr className="border-b border-line align-top">
                <th scope="row" className="py-3 pr-4 text-left font-normal">자동 수집</th>
                <td className="py-3 pr-4">접속 기록, 쿠키</td>
                <td className="py-3">서비스 이용 시</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Article>

      <Article heading="3. 개인정보의 이용 목적">
        <List
          items={[
            "강의 제공 및 수강권 관리",
            "결제 처리와 환불, 구매 이력 확인",
            "본인 확인 및 계정 관리",
            "문의 응대와 공지사항 전달",
            "서비스 개선을 위한 통계 분석",
            "마케팅 정보 발송 (별도로 동의하신 경우에 한합니다)",
          ]}
        />
      </Article>

      <Article heading="4. 개인정보의 보유 및 이용 기간">
        <p>
          원칙적으로 수집·이용 목적이 달성되면 지체 없이 파기합니다. 다만 관련
          법령에 따라 다음 정보는 정해진 기간 동안 보관합니다.
        </p>
        <List
          items={[
            "계약 또는 청약철회에 관한 기록: 5년 (전자상거래법)",
            "대금 결제 및 재화 공급에 관한 기록: 5년 (전자상거래법)",
            "소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)",
            "표시·광고에 관한 기록: 6개월 (전자상거래법)",
            "접속 기록: 3개월 (통신비밀보호법)",
          ]}
        />
        <p>
          무료 강의 신청 정보는 신청일로부터 1년간 보관 후 파기합니다. 회원 정보는
          회원 탈퇴 시 지체 없이 파기합니다.
        </p>
      </Article>

      <Article heading="5. 개인정보의 제3자 제공">
        <p>
          회사는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 따라
          요구받은 경우는 예외로 합니다.
        </p>
      </Article>

      <Article heading="6. 개인정보 처리의 위탁">
        <p>
          회사는 서비스 운영을 위해 아래와 같이 개인정보 처리 업무를 위탁하고
          있습니다. 일부 수탁사의 서버는 국외에 있습니다.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-base">
            <caption className="sr-only">개인정보 처리 위탁 현황</caption>
            <thead>
              <tr className="border-b-2 border-fg text-left">
                <th scope="col" className="py-3 pr-4 font-medium">수탁업체</th>
                <th scope="col" className="py-3 pr-4 font-medium">위탁 업무</th>
                <th scope="col" className="py-3 font-medium">보관 위치</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line align-top">
                <th scope="row" className="py-3 pr-4 text-left font-normal">토스페이먼츠</th>
                <td className="py-3 pr-4">결제 처리 및 환불</td>
                <td className="py-3">국내</td>
              </tr>
              <tr className="border-b border-line align-top">
                <th scope="row" className="py-3 pr-4 text-left font-normal">Supabase</th>
                <td className="py-3 pr-4">회원 정보 및 수강 데이터 보관</td>
                <td className="py-3">국외</td>
              </tr>
              <tr className="border-b border-line align-top">
                <th scope="row" className="py-3 pr-4 text-left font-normal">Vercel</th>
                <td className="py-3 pr-4">서비스 호스팅</td>
                <td className="py-3">국외</td>
              </tr>
              <tr className="border-b border-line align-top">
                <th scope="row" className="py-3 pr-4 text-left font-normal">Vimeo</th>
                <td className="py-3 pr-4">강의 영상 제공</td>
                <td className="py-3">국외</td>
              </tr>
              <tr className="border-b border-line align-top">
                <th scope="row" className="py-3 pr-4 text-left font-normal">카카오</th>
                <td className="py-3 pr-4">로그인 및 상담 채널 운영</td>
                <td className="py-3">국내</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* TODO: 실제로 사용하는 업체와 일치하는지 오픈 전 확인 */}
      </Article>

      <Article heading="7. 이용자의 권리와 행사 방법">
        <List
          items={[
            "이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있습니다.",
            "이용자는 개인정보의 처리 정지나 삭제를 요구할 수 있습니다. 다만 법령에 따라 보관해야 하는 정보는 삭제가 제한될 수 있습니다.",
            "회원 탈퇴를 원하시는 경우 아래 연락처로 요청해 주시기 바랍니다.",
            "만 14세 미만 아동의 개인정보는 수집하지 않습니다.",
          ]}
        />
      </Article>

      <Article heading="8. 쿠키의 사용">
        <p>
          회사는 로그인 상태를 유지하기 위해 쿠키를 사용합니다. 이용자는 브라우저
          설정에서 쿠키를 거부할 수 있으나, 이 경우 로그인이 필요한 기능을 이용할 수
          없습니다.
        </p>
      </Article>

      <Article heading="9. 개인정보의 안전성 확보 조치">
        <List
          items={[
            "개인정보에 접근할 수 있는 권한을 최소한의 인원으로 제한합니다.",
            "개인정보는 암호화된 통신 구간을 통해 전송됩니다.",
            "데이터베이스 수준에서 접근 권한을 제한하여, 권한이 없는 요청은 데이터베이스가 직접 차단합니다.",
          ]}
        />
      </Article>

      <Article heading="10. 개인정보 보호책임자">
        <p>
          개인정보 처리에 관한 문의, 불만, 피해 구제는 아래로 연락해 주시기
          바랍니다. 회사는 신속하게 답변하겠습니다.
        </p>
        <List
          items={[
            `개인정보 보호책임자: ${business.privacyOfficer}`,
            `연락처: ${business.phone}`,
            `이메일: ${contact.email}`,
          ]}
        />
        <p>
          그 밖의 개인정보 침해에 대한 신고나 상담이 필요하시면 개인정보침해
          신고센터(국번없이 118), 개인정보 분쟁조정위원회(1833-6972), 대검찰청
          사이버수사과(국번없이 1301), 경찰청 사이버수사국(국번없이 182)으로 문의하실
          수 있습니다.
        </p>
      </Article>

      <Article heading="11. 방침의 변경">
        <p>
          이 방침을 변경하는 경우 변경 사항을 시행 7일 전부터 공지합니다. 다만
          이용자의 권리에 중대한 변경이 있는 경우에는 30일 전에 공지합니다.
        </p>
      </Article>
    </LegalPage>
  );
}
