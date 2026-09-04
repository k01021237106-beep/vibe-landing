/**
 * 공유 카드 이미지(1200x630)를 만든다.
 *
 * 왜 미리 만들어 커밋하나 —
 *  - Next의 ImageResponse(satori)는 woff2를 못 읽는다. 우리 본문 폰트가 woff2다.
 *    한글 글꼴을 따로 ttf로 구해 런타임에 들고 있어야 하는데, 그만한 값을 못 한다.
 *  - 공유 카드는 거의 바뀌지 않는다. 요청마다 그릴 이유가 없다.
 *  - 미리 만들어 두면 배포 환경의 폰트 상황과 무관하게 항상 같은 그림이 나간다.
 *
 * 실행: npm run dev (다른 터미널) 후 npm run og
 * 결과: app/opengraph-image.png — Next가 자동으로 공유 카드로 쓴다.
 */
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const OUT = "app/opengraph-image.png";
const FONT_CSS = process.env.BASE_URL ?? "http://localhost:3000";

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="${FONT_CSS}/fonts/pretendard.css">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; word-break: keep-all; }
  body {
    width: 1200px; height: 630px;
    background: #14110F; color: #FBF7F0;
    font-family: "Pretendard", sans-serif;
    letter-spacing: -0.03em;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 72px 80px;
  }
  .brand { display: flex; align-items: baseline; gap: 14px; font-size: 34px; font-weight: 900; }
  .dot { width: 14px; height: 14px; border-radius: 999px; background: #FF5A1F; transform: translateY(-4px); }
  h1 { font-size: 82px; font-weight: 900; line-height: 1.22; max-width: 20ch; }
  .accent { color: #FF7A45; }
  .foot { display: flex; align-items: center; justify-content: space-between; }
  .sub { font-size: 30px; color: #B8AFA4; font-weight: 500; }
  .badge {
    font-size: 26px; font-weight: 500;
    background: #FF5A1F; color: #14110F;
    padding: 14px 26px; border-radius: 10px;
  }
</style>
</head>
<body>
  <div class="brand">첫배포<span class="dot"></span></div>
  <h1>코딩을 몰라도<br><span class="accent">AI와 함께</span> 내 서비스를<br>세상에 내놓습니다</h1>
  <div class="foot">
    <div class="sub">첫배포 바이브코딩 입문</div>
    <div class="badge">무료 1강 공개</div>
  </div>
</body>
</html>`;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--no-proxy-server"],
});
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});

await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);

const shot = await page.screenshot({ type: "png" });
await writeFile(OUT, shot);
await browser.close();

console.log(`${OUT} 생성 완료 (1200x630)`);
