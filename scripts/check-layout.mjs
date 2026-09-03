/**
 * 레이아웃 Quality Gate — 375 / 768 / 1440px 스크린샷 + 자동 검사.
 *
 * 사용법:
 *   npm run build && npm start   (다른 터미널에서)
 *   npm run check:layout
 *
 * 검사 항목
 *  - 가로 스크롤 넘침이 0px인지 (375px에서 특히 중요)
 *  - 화면에 보이는 링크·버튼의 높이가 최소 터치영역 48px 이상인지
 *  - 본문 글꼴이 Pretendard이고 기준 크기가 18px 이상인지
 *
 * 어절 중간 잘림은 자동 판정이 어려우므로 docs/screenshots/ 결과물로 육안 확인한다.
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "docs/screenshots";
const VIEWPORTS = [
  { name: "375", width: 375, height: 900 },
  { name: "768", width: 768, height: 1000 },
  { name: "1440", width: 1440, height: 1000 },
];

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
  console.error(`  ✗ ${msg}`);
};

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(BASE, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  await page.screenshot({ path: `${OUT}/home-${vp.name}.png`, fullPage: true });

  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const tooSmall = [];
    for (const el of document.querySelectorAll("a, button")) {
      const rect = el.getBoundingClientRect();
      // 크기가 없는 요소(숨김)와 스크린리더 전용 요소는 터치 대상이 아니다
      if (rect.width === 0 || rect.height === 0) continue;
      if (el.classList.contains("sr-only")) continue;
      if (rect.height < 48) {
        tooSmall.push(`${el.tagName} "${(el.textContent || "").trim().slice(0, 24)}" ${rect.height.toFixed(1)}px`);
      }
    }
    const body = getComputedStyle(document.body);
    return {
      overflow: doc.scrollWidth - doc.clientWidth,
      tooSmall,
      fontFamily: body.fontFamily.split(",")[0].replace(/["']/g, ""),
      rootFontSize: parseFloat(getComputedStyle(doc).fontSize),
    };
  });

  console.log(`[${vp.name}px]`);
  if (result.overflow > 0) fail(`가로 스크롤 넘침 ${result.overflow}px`);
  else console.log("  ✓ 가로 스크롤 넘침 없음");

  if (result.tooSmall.length > 0) fail(`터치영역 48px 미만: ${result.tooSmall.join(" | ")}`);
  else console.log("  ✓ 모든 링크·버튼이 48px 이상");

  if (result.fontFamily !== "Pretendard") fail(`본문 글꼴이 Pretendard가 아님 (${result.fontFamily})`);
  else console.log("  ✓ 본문 글꼴 Pretendard");

  if (result.rootFontSize < 18) fail(`기준 글꼴 크기가 18px 미만 (${result.rootFontSize}px)`);
  else console.log(`  ✓ 기준 글꼴 ${result.rootFontSize}px`);

  await page.close();
}

// 모바일 메뉴 열린 상태도 남긴다
const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
await page.goto(BASE, { waitUntil: "load" });
await page.getByRole("button", { name: "메뉴 열기" }).click();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: `${OUT}/home-375-menu.png`, fullPage: true });
await browser.close();

console.log(`\n스크린샷: ${OUT}/`);
if (failed) {
  console.error("\n레이아웃 검사 실패");
  process.exit(1);
}
console.log("레이아웃 검사 통과 — 어절 중간 잘림은 스크린샷으로 육안 확인하세요");
