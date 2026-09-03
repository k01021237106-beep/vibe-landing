import { cn } from "@/lib/utils";

/**
 * 워드마크 + 라이브 점.
 * 점은 배포 성공 표시등에서 가져왔다 — "당신의 서비스가 지금 살아 있다".
 */
export function Logo({
  className,
  onInk = false,
}: {
  className?: string;
  onInk?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-2 font-display text-2xl tracking-tight",
        onInk ? "text-ink-fg" : "text-fg",
        className,
      )}
    >
      첫배포
      <span
        aria-hidden="true"
        className={cn(
          "live-dot size-2 shrink-0 translate-y-[-0.15em] rounded-full",
          onInk ? "bg-ink-accent" : "bg-accent",
        )}
      />
    </span>
  );
}
