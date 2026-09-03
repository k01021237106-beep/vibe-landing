import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * 크기 값은 전부 rem이고 html의 기준 글꼴이 18px이므로
 * 가장 작은 크기(h-11 = 2.75rem)도 49.5px로 최소 터치영역 48px을 넘는다.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** 주 행동. 크림 배경 위 코랄 버튼 — 잉크 글자로 대비 6.03:1 확보 */
        primary: "bg-accent text-accent-fg hover:bg-accent-hover",
        /** 보조 행동. 크림 배경 위 테두리만 */
        outline: "border-2 border-fg bg-transparent text-fg hover:bg-fg hover:text-bg",
        /** 잉크 배경 구역(히어로·결제) 위에서 쓰는 밝은 버튼 */
        onInk: "bg-ink-fg text-ink hover:bg-ink-fg-hover",
        ghost: "bg-transparent text-fg hover:bg-surface",
      },
      size: {
        sm: "h-11 px-5 text-base",
        md: "h-12 px-6 text-base",
        lg: "h-14 px-8 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
