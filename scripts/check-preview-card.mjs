/**
 * 링크 미리보기 카드 점검.
 *
 * 카카오톡에 링크를 붙였을 때 제목·설명·이미지가 뜨는지 본다.
 *
 * 왜 따로 검사하나 —
 * Next 15는 메타데이터를 `<head>`에 넣지 않고 본문 뒤로 흘려보낸 다음
 * 브라우저의 자바스크립트가 끌어올린다. 사람에게는 문제가 없지만,
 * **자바스크립트를 실행하지 않는 미리보기 봇**에게는 `<head>`가 비어 보인다.
 *
 * 이건 화면을 봐서는 절대 알 수 없다. 카카오톡에 붙여 보기 전까지 모른다.
 * 그리고 붙여 봤을 때는 이미 손님에게 빈 카드가 나간 뒤다.
 *
 * next.config.ts의 htmlLimitedBots가 이걸 고친다. 그 설정이 살아 있는지 여기서 지킨다.
 *
 * 실행:
 *   npm run check:preview          (운영 서버를 직접 띄운다)
 *   PREVIEW_ORIGIN=https://... npm run check:preview
 */
import { spawn } from "node:child_process";

const PORT = process.env.PREVIEW_PORT ?? "3215";
const EXTERNAL = process.env.PREVIEW_ORIGIN;
const ORIGIN = EXTERNAL ?? `http://127.0.0.1:${PORT}`;
const PATHS = (process.env.PREVIEW_PATHS ?? "/legal/terms").split(",");

/** 미리보기 카드를 만드는 것들. 카카오톡이 가장 중요하다 — 손님이 그걸로 링크를 주고받는다. */
const BOTS = [
  ["카카오톡", "kakaotalk-scrap/1.0 (+https://devtalk.kakao.com/t/scrap/33984)"],
  ["카카오톡 앱", "Mozilla/5.0 (Linux; Android 14) KAKAOTALK/10.0.0"],
  ["다음", "Mozilla/5.0 (compatible; Daum/4.1; +http://cs.daum.net/faq/15/4118.html)"],
  ["네이버", "Yeti/1.1 (+https://naver.me/spd)"],
  ["페이스북", "facebookexternalhit/1.1"],
  ["트위터", "Twitterbot/1.0"],
];

/** 사람이 쓰는 브라우저. 여기는 스트리밍되는 게 정상이므로 검사 대상이 아니다. */
const BROWSER_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function headOf(html) {
  const end = html.indexOf("</head>");
  return end === -1 ? "" : html.slice(0, end);
}

/** 카드를 만드는 데 실제로 쓰이는 것들만 본다. */
function inspect(head) {
  return {
    title: /<title[\s>]/i.test(head),
    description: /<meta[^>]+name=["']description["']/i.test(head),
    ogTitle: /<meta[^>]+property=["']og:title["']/i.test(head),
    ogDescription: /<meta[^>]+property=["']og:description["']/i.test(head),
    ogImage: /<meta[^>]+property=["']og:image["']/i.test(head),
  };
}

function startServer() {
  const server = spawn("npx", ["next", "start", "--port", PORT], {
    stdio: ["ignore", "ignore", "ignore"],
    env: process.env,
  });
  return server;
}

async function waitForServer(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(`${ORIGIN}/robots.txt`, { signal: AbortSignal.timeout(3000) });
      return;
    } catch {
      // 아직 안 떴다.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`서버가 ${timeoutMs / 1000}초 안에 뜨지 않았습니다.`);
}

/** 포트가 이미 물려 있으면 옛날 빌드를 재게 된다 (check-perf.mjs의 주석 참고). */
if (!EXTERNAL) {
  try {
    await fetch(`${ORIGIN}/robots.txt`, { signal: AbortSignal.timeout(2000) });
    console.error(
      `포트 ${PORT}에 이미 서버가 떠 있습니다. 그대로 두면 옛날 빌드를 검사하게 됩니다.\n` +
        `그 서버를 끄거나 PREVIEW_PORT로 다른 포트를 지정하세요.`,
    );
    process.exit(1);
  } catch {
    // 아무도 없다. 정상.
  }
}

const server = EXTERNAL ? null : startServer();
let failed = false;

try {
  await waitForServer();
  console.log(`${ORIGIN} 확인\n`);

  for (const path of PATHS) {
    console.log(`■ ${path}`);

    for (const [label, ua] of BOTS) {
      const html = await (await fetch(`${ORIGIN}${path}`, { headers: { "user-agent": ua } })).text();
      const found = inspect(headOf(html));
      const missing = Object.entries(found)
        .filter(([, ok]) => !ok)
        .map(([k]) => k);

      if (missing.length) {
        failed = true;
        console.error(`  ✗ ${label} — head에 없음: ${missing.join(", ")}`);
      } else {
        console.log(`  ✓ ${label}`);
      }
    }

    // 사람에게는 스트리밍되는 게 맞다. 여기까지 막혔다면 설정이 너무 넓다.
    const browserHtml = await (
      await fetch(`${ORIGIN}${path}`, { headers: { "user-agent": BROWSER_UA } })
    ).text();
    const streamed = !inspect(headOf(browserHtml)).title;
    console.log(
      streamed
        ? "  · 일반 브라우저는 스트리밍 (의도한 동작 — 화면이 더 빨리 뜬다)"
        : "  ⚠ 일반 브라우저까지 대기 렌더링이다. htmlLimitedBots가 너무 넓지 않은지 본다",
    );
    console.log();
  }
} finally {
  server?.kill("SIGTERM");
}

if (failed) {
  console.error(
    "미리보기 카드 점검 실패 — next.config.ts의 htmlLimitedBots에 해당 봇이 들어 있는지 확인하세요.",
  );
  process.exit(1);
}
console.log("미리보기 카드 점검 통과");
