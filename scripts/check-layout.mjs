/**
 * 레이아웃·접근성 Quality Gate — 375 / 768 / 1440px 스크린샷 + 자동 검사.
 *
 * 사용법:
 *   npm run dev          (다른 터미널에서)
 *   npm run check:layout
 *
 * 검사 항목
 *  - 가로 스크롤 넘침이 0px인지 (375px에서 특히 중요)
 *  - 화면에 보이는 링크·버튼의 높이가 최소 터치영역 48px 이상인지
 *  - 본문 글꼴이 Pretendard이고 기준 크기가 18px 이상인지
 *  - h1이 정확히 하나이고 헤딩 단계를 건너뛰지 않는지 (h1→h2→h3)
 *  - 글자와 배경의 대비가 WCAG AA(4.5:1, 큰 글씨 3:1) 이상인지
 *
 * 어절 중간 잘림은 자동 판정이 어려우므로 docs/screenshots/ 결과물로 육안 확인한다.
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "docs/screenshots";

/** 검사할 페이지. 이름은 스크린샷 파일명이 된다. */
const PAGES = [
  { name: "home", path: "/" },
  { name: "courses", path: "/courses" },
  { name: "course-detail", path: "/courses/first-deploy-vibecoding" },
  { name: "login", path: "/login" },
  { name: "legal-terms", path: "/legal/terms" },
  { name: "legal-privacy", path: "/legal/privacy" },
  { name: "legal-refund", path: "/legal/refund" },
];

const VIEWPORTS = [
  { name: "375", width: 375, height: 900 },
  { name: "768", width: 768, height: 1000 },
  { name: "1440", width: 1440, height: 1000 },
];

/** 모든 폭에서 찍을 페이지. 나머지는 375px만 찍는다 — 스크린샷이 너무 많아진다. */
const ALL_WIDTHS = new Set(["home", "course-detail"]);

/** 이 환경에 미리 설치된 Chromium을 쓴다 (Playwright 기본 경로와 리비전이 다를 수 있다) */
const executablePath = process.env.CHROMIUM_PATH;

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath,
  // 로컬 서버는 프록시를 거치지 않는다
  args: ["--no-proxy-server"],
});

let failed = false;
const fail = (msg) => {
  failed = true;
  console.error(`    ✗ ${msg}`);
};

/**
 * 페이지 안에서 도는 검사.
 * 브라우저 컨텍스트로 넘어가므로 바깥 변수를 참조하지 않는다.
 */
function inspect() {
  const relativeLuminance = (rgb) => {
    const [r, g, b] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const parse = (color) => {
    const m = color.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(",").map((s) => parseFloat(s));
    // 반투명 글자는 배경과 섞이므로 정확한 계산이 어렵다. 검사에서 제외한다.
    if (parts.length > 3 && parts[3] < 1) return null;
    return parts.slice(0, 3);
  };
  const contrast = (a, b) => {
    const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  /** 조상을 거슬러 올라가며 실제로 칠해진 배경색을 찾는다 */
  const backgroundOf = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      if (bg) return bg;
      node = node.parentElement;
    }
    return [255, 255, 255];
  };

  const doc = document.documentElement;

  // --- 터치영역 ---
  const tooSmall = [];
  for (const el of document.querySelectorAll("a, button, input, summary")) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (el.classList.contains("sr-only")) continue;

    /*
     * 문장 안에 섞여 있는 링크는 제외한다.
     * WCAG 2.5.8도 인라인 링크를 최소 크기 기준에서 빼 준다 —
     * 문장 중간의 링크를 48px로 키우려면 줄 간격을 망가뜨려야 하고,
     * 그러면 오히려 읽기 어려워진다.
     * 판정: 화면에 인라인으로 놓였고, 부모의 글이 링크 글보다 길면 문장 속 링크다.
     */
    const isInline = getComputedStyle(el).display === "inline";
    const parentText = (el.parentElement?.textContent || "").trim();
    const ownText = (el.textContent || "").trim();
    if (isInline && parentText.length > ownText.length) continue;

    if (rect.height < 48) {
      tooSmall.push(
        `${el.tagName} "${(el.textContent || "").trim().slice(0, 20)}" ${rect.height.toFixed(1)}px`,
      );
    }
  }

  // --- 헤딩 구조 ---
  const headings = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((h) => ({
    level: Number(h.tagName[1]),
    text: (h.textContent || "").trim().slice(0, 30),
  }));
  const h1Count = headings.filter((h) => h.level === 1).length;
  const skips = [];
  let previous = 0;
  for (const h of headings) {
    if (previous !== 0 && h.level > previous + 1) {
      skips.push(`h${previous} → h${h.level} ("${h.text}")`);
    }
    previous = h.level;
  }

  // --- 대비 ---
  const lowContrast = [];
  const seen = new Set();
  for (const el of document.querySelectorAll("p, h1, h2, h3, h4, li, a, button, td, th, span, dt, dd, summary, blockquote, caption")) {
    if (!el.textContent || el.textContent.trim().length === 0) continue;
    // 자식에게 글자가 있으면 그 자식에서 검사한다 (중복 방지)
    if (el.querySelector("p, h1, h2, h3, h4, li, a, button, span")) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.opacity === "0") continue;
    if (el.closest(".sr-only")) continue;

    const fg = parse(style.color);
    if (!fg) continue;
    const bg = backgroundOf(el);
    const ratio = contrast(fg, bg);

    const size = parseFloat(style.fontSize);
    const weight = Number(style.fontWeight) || 400;
    // WCAG 기준: 18.66px 이상 굵은 글씨 또는 24px 이상이면 '큰 글씨'
    const isLarge = size >= 24 || (size >= 18.66 && weight >= 700);
    const required = isLarge ? 3 : 4.5;

    if (ratio < required) {
      const key = `${style.color}|${size}`;
      if (seen.has(key)) continue;
      seen.add(key);
      lowContrast.push(
        `"${el.textContent.trim().slice(0, 24)}" ${ratio.toFixed(2)}:1 (필요 ${required}:1, ${size}px)`,
      );
    }
  }

  const body = getComputedStyle(document.body);
  return {
    overflow: doc.scrollWidth - doc.clientWidth,
    tooSmall,
    h1Count,
    skips,
    lowContrast,
    fontFamily: body.fontFamily.split(",")[0].replace(/["']/g, ""),
    rootFontSize: parseFloat(getComputedStyle(doc).fontSize),
  };
}

for (const target of PAGES) {
  console.log(`\n${target.path}`);
  const widths = ALL_WIDTHS.has(target.name) ? VIEWPORTS : [VIEWPORTS[0]];

  for (const vp of widths) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(BASE + target.path, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    const suffix = widths.length > 1 ? `-${vp.name}` : "";
    await page.screenshot({ path: `${OUT}/${target.name}${suffix}.png`, fullPage: true });

    const r = await page.evaluate(inspect);

    console.log(`  [${vp.name}px]`);
    if (r.overflow > 0) fail(`가로 스크롤 넘침 ${r.overflow}px`);
    if (r.tooSmall.length > 0) fail(`터치영역 48px 미만: ${r.tooSmall.join(" | ")}`);
    if (r.fontFamily !== "Pretendard") fail(`본문 글꼴이 Pretendard가 아님 (${r.fontFamily})`);
    if (r.rootFontSize < 18) fail(`기준 글꼴 크기가 18px 미만 (${r.rootFontSize}px)`);
    if (r.h1Count !== 1) fail(`h1이 ${r.h1Count}개 (정확히 1개여야 한다)`);
    if (r.skips.length > 0) fail(`헤딩 단계 건너뜀: ${r.skips.join(" | ")}`);
    if (r.lowContrast.length > 0) fail(`대비 부족: ${r.lowContrast.join(" | ")}`);

    if (
      r.overflow === 0 &&
      r.tooSmall.length === 0 &&
      r.h1Count === 1 &&
      r.skips.length === 0 &&
      r.lowContrast.length === 0 &&
      r.fontFamily === "Pretendard" &&
      r.rootFontSize >= 18
    ) {
      console.log("    ✓ 넘침·터치영역·글꼴·헤딩·대비 모두 통과");
    }

    await page.close();
  }
}

// 모바일 메뉴 열린 상태도 남긴다
const menuPage = await browser.newPage({ viewport: { width: 375, height: 900 } });
await menuPage.goto(BASE, { waitUntil: "load" });
await menuPage.getByRole("button", { name: "메뉴 열기" }).click();
await menuPage.evaluate(() => document.fonts.ready);
await menuPage.screenshot({ path: `${OUT}/home-375-menu.png`, fullPage: true });
await browser.close();

console.log(`\n스크린샷: ${OUT}/`);
if (failed) {
  console.error("\n검사 실패");
  process.exit(1);
}
console.log("검사 통과 — 어절 중간 잘림은 스크린샷으로 육안 확인하세요");
