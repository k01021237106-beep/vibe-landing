import { cn } from "@/lib/utils";

/**
 * 섹션 공통 뼈대.
 *
 * 여백과 최대 너비를 한 곳에서 정해 페이지 전체의 리듬을 맞춘다.
 * 섹션마다 값을 따로 쓰면 스크롤할 때 간격이 들쭉날쭉해진다.
 */
export function Section({
  id,
  tone = "cream",
  className,
  children,
}: {
  id?: string;
  /** ink는 히어로·가격처럼 시선을 붙잡아야 하는 구역에만 쓴다. 남발하면 힘이 빠진다. */
  tone?: "cream" | "surface" | "ink";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        // 헤더가 화면 위에 붙어 있으므로, 앵커로 이동했을 때 제목이 헤더에 가리지 않게 여백을 둔다
        "scroll-mt-24 px-5 py-20 lg:px-8 lg:py-28",
        tone === "cream" && "bg-bg text-fg",
        tone === "surface" && "bg-surface text-fg",
        tone === "ink" && "bg-ink text-ink-fg",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

/** 섹션 위에 붙는 짧은 분류 표시 */
export function Eyebrow({
  children,
  onInk = false,
}: {
  children: React.ReactNode;
  onInk?: boolean;
}) {
  return (
    <p
      className={cn(
        "text-base font-medium",
        onInk ? "text-ink-accent" : "text-accent-fg/70",
      )}
    >
      {children}
    </p>
  );
}

/**
 * 섹션 제목. 문서 구조상 항상 h2다 —
 * 페이지에 h1은 히어로 하나뿐이고, 그 아래는 h2, 그 아래가 h3다.
 */
export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("mt-4 text-3xl sm:text-4xl lg:text-5xl", className)}>
      {children}
    </h2>
  );
}

export function SectionLead({
  children,
  onInk = false,
}: {
  children: React.ReactNode;
  onInk?: boolean;
}) {
  return (
    <p
      className={cn(
        "mt-6 max-w-2xl text-lg leading-relaxed",
        onInk ? "text-ink-muted" : "text-muted",
      )}
    >
      {children}
    </p>
  );
}
