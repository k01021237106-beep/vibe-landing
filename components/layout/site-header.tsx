"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { mainNav, primaryCta } from "@/lib/config";
import { cn } from "@/lib/utils";

/** 로그인 여부에 따라 헤더 오른쪽이 달라진다. 서버 레이아웃에서 내려 준다. */
export function SiteHeader({ isSignedIn = false }: { isSignedIn?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:h-18 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center py-2"
          aria-label={`첫배포 홈으로`}
          onClick={() => setOpen(false)}
        >
          <Logo />
        </Link>

        {/* 데스크톱 내비게이션 */}
        <nav aria-label="주 메뉴" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex h-12 items-center rounded px-4 text-base text-muted transition-colors hover:text-fg"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <Link
              href="/my"
              className="hidden h-12 items-center rounded px-4 text-base text-muted transition-colors hover:text-fg sm:inline-flex"
            >
              내 강의실
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden h-12 items-center rounded px-4 text-base text-muted transition-colors hover:text-fg sm:inline-flex"
            >
              로그인
            </Link>
          )}
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href={primaryCta.href}>{primaryCta.label}</Link>
          </Button>

          {/* 모바일 메뉴 토글 — 48px 이상 터치영역 */}
          <button
            type="button"
            className="-mr-2 inline-flex size-12 items-center justify-center rounded text-fg lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* 모바일 내비게이션 */}
      <nav
        id="mobile-nav"
        aria-label="주 메뉴"
        hidden={!open}
        className={cn("border-t border-line bg-bg lg:hidden")}
      >
        <ul className="mx-auto max-w-6xl px-5 py-2">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex min-h-14 items-center border-b border-line text-lg text-fg last:border-b-0"
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={isSignedIn ? "/my" : "/login"}
              onClick={() => setOpen(false)}
              className="flex min-h-14 items-center border-b border-line text-lg text-fg"
            >
              {isSignedIn ? "내 강의실" : "로그인"}
            </Link>
          </li>
          <li className="py-4 sm:hidden">
            <Button asChild size="lg" className="w-full">
              <Link href={primaryCta.href} onClick={() => setOpen(false)}>
                {primaryCta.label}
              </Link>
            </Button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
