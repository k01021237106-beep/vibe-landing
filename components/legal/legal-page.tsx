import type { ReactNode } from "react";

/**
 * 법적 고지 페이지 공통 뼈대.
 *
 * 약관은 읽히라고 있는 문서다. 본문을 18px 이상으로 두고 줄 길이를 좁게 잡는다.
 * 작은 회색 글씨로 깔아 두면 '고지했다'고 보기 어렵다.
 */
export function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 lg:py-24">
      <h1 className="text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-4 text-base text-muted">시행일: {effectiveDate}</p>
      <div className="mt-12">{children}</div>
    </article>
  );
}

export function Article({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line py-8">
      <h2 className="text-xl sm:text-2xl">{heading}</h2>
      <div className="mt-4 flex flex-col gap-4 text-base leading-relaxed sm:text-lg">
        {children}
      </div>
    </section>
  );
}

export function List({ items }: { items: ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span aria-hidden="true" className="shrink-0 text-muted">
            {index + 1}.
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}
