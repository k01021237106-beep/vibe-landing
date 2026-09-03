import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { business, contact, legalNav, mainNav, site } from "@/lib/config";

/** 사업자 정보 한 줄. 값이 아직 없으면 회색 '추후 입력'으로 자리만 잡는다. */
function BusinessField({ label, value }: { label: string; value: string }) {
  const pending = value === "추후 입력";
  return (
    <span className="inline-flex gap-1.5">
      <span className="text-ink-muted">{label}</span>
      <span className={pending ? "text-ink-muted/70" : "text-ink-fg"}>{value}</span>
    </span>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-ink text-ink-fg">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <Logo onInk />
            <p className="mt-4 text-base leading-relaxed text-ink-muted">{site.tagline}</p>
          </div>

          <div className="flex flex-col gap-10 sm:flex-row sm:gap-16">
            <nav aria-labelledby="footer-nav-main">
              <h2 id="footer-nav-main" className="font-display text-lg text-ink-fg">
                둘러보기
              </h2>
              <ul className="mt-3">
                {mainNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex min-h-12 items-center text-base text-ink-muted transition-colors hover:text-ink-fg"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-labelledby="footer-nav-legal">
              <h2 id="footer-nav-legal" className="font-display text-lg text-ink-fg">
                고객 안내
              </h2>
              <ul className="mt-3">
                {legalNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex min-h-12 items-center text-base text-ink-muted transition-colors hover:text-ink-fg"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href={contact.kakaoChannelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center text-base text-ink-muted transition-colors hover:text-ink-fg"
                  >
                    카카오톡으로 문의하기
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/*
         * 사업자 정보.
         * TODO: 통신판매업 신고 후 lib/config.ts의 business 값을 실제 정보로 교체한다.
         *       미등록 상태로 유료 판매를 시작하면 과태료 대상이다.
         */}
        <div className="mt-14 border-t border-ink-line pt-8">
          <h2 className="text-sm font-medium text-ink-muted">사업자 정보</h2>
          <div className="mt-3 flex flex-col gap-x-6 gap-y-2 text-sm leading-relaxed sm:flex-row sm:flex-wrap">
            <BusinessField label="상호" value={business.companyName} />
            <BusinessField label="대표자" value={business.representative} />
            <BusinessField label="사업자등록번호" value={business.registrationNumber} />
            <BusinessField label="통신판매업 신고번호" value={business.mailOrderNumber} />
            <BusinessField label="주소" value={business.address} />
            <BusinessField label="연락처" value={business.phone} />
            <BusinessField label="개인정보 보호책임자" value={business.privacyOfficer} />
          </div>
          <p className="mt-6 text-sm text-ink-muted">
            © {new Date().getFullYear()} {site.name}. 모든 권리를 보유합니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
