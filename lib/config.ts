/**
 * 사이트 전역 설정 — 단일 정의 지점(single source of truth).
 *
 * 가격·브랜드명·연락처는 반드시 여기서만 정의하고, 모든 화면은 이 값을 읽는다.
 * 화면에 숫자를 직접 적지 않는다. (가격은 임시값이라 자주 바뀐다)
 */

export const site = {
  name: "첫배포",
  tagline: "코딩을 몰라도, AI와 함께 내 서비스를 세상에 배포합니다",
  description:
    "코딩을 전혀 모르는 초보자도 AI와 함께 실제 서비스를 만들고 배포할 수 있도록 돕는 온라인 강의입니다.",
  // TODO: 배포 도메인이 정해지면 실제 주소로 교체
  url: "https://example.vercel.app",
  locale: "ko_KR",
} as const;

/** 대표 강의. 강의가 늘어나면 DB(courses)가 원본이 되고 이 값은 랜딩 기본값으로만 쓴다. */
export const flagshipCourse = {
  slug: "first-deploy-vibecoding",
  title: "첫배포 바이브코딩 입문",
  /** 정가(원) — ⚠️ 임시 가격. 실제 판매 전 조정 예정 */
  listPrice: 198_000,
  /** 판매가(원) — ⚠️ 임시 가격. 오픈 할인 */
  salePrice: 99_000,
} as const;

/** 화면 표시용 금액 포맷. 예) 99000 → "99,000원" */
export function formatPrice(won: number): string {
  return `${won.toLocaleString("ko-KR")}원`;
}

/** 할인율(%) — 소수점 버림. 예) 198,000 → 99,000이면 50 */
export function discountRate(listPrice: number, salePrice: number): number {
  if (listPrice <= 0 || salePrice >= listPrice) return 0;
  return Math.floor(((listPrice - salePrice) / listPrice) * 100);
}

export const contact = {
  // TODO: 실제 카카오톡 채널 주소로 교체
  kakaoChannelUrl: "https://pf.kakao.com/",
  // TODO: 실제 문의 이메일로 교체
  email: "추후 입력",
} as const;

/**
 * 사업자 정보 — 통신판매업 신고 후 실제 값으로 교체한다.
 * ⚠️ 미등록 상태로 유료 판매를 시작하면 과태료 대상이다.
 */
export const business = {
  companyName: "추후 입력",
  representative: "추후 입력",
  registrationNumber: "추후 입력",
  mailOrderNumber: "추후 입력",
  address: "추후 입력",
  phone: "추후 입력",
  privacyOfficer: "추후 입력",
} as const;

/** 헤더 주 내비게이션 */
export const mainNav = [
  { label: "강의 소개", href: "/courses" },
  { label: "커리큘럼", href: "/#curriculum" },
  { label: "수강 후기", href: "/#reviews" },
  { label: "자주 묻는 질문", href: "/#faq" },
] as const;

/** 법적 고지 페이지 */
export const legalNav = [
  { label: "이용약관", href: "/legal/terms" },
  { label: "개인정보처리방침", href: "/legal/privacy" },
  { label: "환불 규정", href: "/legal/refund" },
] as const;

/** 사이트 최우선 전환 목표 — 결제보다 항상 위에 둔다 */
export const primaryCta = { label: "무료 1강 신청하기", href: "/free" } as const;
export const secondaryCta = {
  label: "강의 자세히 보기",
  href: `/courses/${flagshipCourse.slug}`,
} as const;
