/**
 * 성능 점검 — 운영 빌드를 띄우고 Lighthouse를 돌린다.
 *
 * ⚠️ 이 숫자는 **배포된 사이트의 점수가 아니다.**
 * CDN도, Brotli 압축도, 실제 지연시간도 없는 같은 기계 안의 측정이다.
 * 정식 숫자는 배포 주소를 PageSpeed Insights에 넣어서 받는다:
 *   https://pagespeed.web.dev/
 *
 * 그런데도 이걸 도는 이유 —
 * 개발 서버(next dev)는 번들이 압축되지 않고 React도 개발 빌드라
 * 점수가 실제와 크게 다르다. 반면 여기서 나오는 **문제 목록**
 * (덩치 큰 번들, 렌더를 막는 자원, LCP 요소, 레이아웃 밀림)은
 * 배포된 사이트에도 그대로 있다. 고칠 거리를 찾는 데 쓴다.
 *
 * ⚠️ 기본 경로에 `/`가 없는 이유 —
 * 랜딩·강의·무료신청은 데이터베이스를 읽는데, 이 개발 환경은 네트워크 정책상
 * supabase.co에 나가지 못해 500이 난다. (USE_CONTENT_FIXTURES는 운영 모드에서
 * 일부러 꺼지므로 next start에서는 쓸 수 없다.)
 * 그래서 DB를 타지 않는 페이지로 잰다. 헤더·푸터·폰트·CSS·기본 번들이 같으므로
 * 껍데기의 성능은 그대로 드러난다. `/login`은 클라이언트 번들이 가장 큰 페이지다.
 * DB에 닿는 환경에서는 PERF_PATHS로 `/`를 넣어 재면 된다.
 *
 * ⚠️ "화면이 밀리는 정도"(CLS)는 이 기계에서 실제보다 크게 나온다 —
 * 여기에는 제대로 된 한글 시스템 폰트가 없다(Unifont·WenQuanYi뿐).
 * 그래서 Pretendard가 도착하기 전 대체 글꼴의 글자 크기가 실제 손님 기기와
 * 크게 다르고, 폰트가 바뀔 때의 밀림이 부풀려진다.
 * Pretendard는 애플 SD 산돌고딕네오와 자체 크기를 맞춰 만든 글꼴이라
 * 실제 휴대폰에서는 훨씬 작게 나온다. 이 숫자로 폰트 전략을 바꾸지 않는다.
 * (fc-list :lang=ko 로 이 기계의 한글 폰트를 확인할 수 있다)
 *
 * 실행:
 *   npm run check:perf
 *   PERF_PATHS=/,/free npm run check:perf     (DB에 닿는 환경에서)
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const PORT = process.env.PERF_PORT ?? "3210";
const ORIGIN = `http://127.0.0.1:${PORT}`;
const PATHS = (process.env.PERF_PATHS ?? "/legal/terms,/login").split(",");
const OUT_DIR = "docs/lighthouse";

/** 지표는 이 셋만 본다. 나머지는 이 셋으로 환원된다. */
const VITALS = [
  ["first-contentful-paint", "첫 화면이 그려질 때까지"],
  ["largest-contentful-paint", "가장 큰 요소가 그려질 때까지"],
  ["total-blocking-time", "손가락이 먹히지 않는 시간"],
  ["cumulative-layout-shift", "화면이 밀리는 정도"],
  ["speed-index", "전체가 채워지는 속도"],
];

/**
 * 포트가 이미 물려 있으면 여기서 멈춘다.
 *
 * 그냥 시작하면 `next start`가 조용히 죽고, 먼저 떠 있던 **옛날 빌드**를 재게 된다.
 * 실제로 그렇게 됐다 — 남아 있던 서버의 CSS 파일 해시가 달라 400이 났고,
 * 스타일 없는 화면을 재서 접근성 100이 96으로 떨어졌다.
 * 코드가 나빠진 줄 알고 한참 찾았다. 검사가 무엇을 재고 있는지부터 확인해야 한다.
 */
async function ensurePortFree() {
  try {
    await fetch(`${ORIGIN}/robots.txt`, { signal: AbortSignal.timeout(2000) });
  } catch {
    return; // 아무도 없다. 정상.
  }
  throw new Error(
    `포트 ${PORT}에 이미 서버가 떠 있습니다. 그대로 두면 옛날 빌드를 재게 됩니다.\n` +
      `그 서버를 끄거나 PERF_PORT로 다른 포트를 지정하세요.`,
  );
}

function startServer() {
  const server = spawn("npx", ["next", "start", "--port", PORT], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  let log = "";
  server.stdout.on("data", (d) => (log += d));
  server.stderr.on("data", (d) => (log += d));
  return { server, getLog: () => log };
}

/** 서버가 실제로 응답할 때까지 기다린다. 고정 시간 sleep은 느린 날 실패한다. */
async function waitForServer(getLog, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      // 상태 코드는 보지 않는다. 응답이 왔다는 것만으로 서버는 뜬 것이다.
      // (DB에 닿지 못하는 환경에서는 `/`가 500이지만 서버는 멀쩡하다)
      await fetch(`${ORIGIN}/robots.txt`, { signal: AbortSignal.timeout(3000) });
      return;
    } catch {
      // 아직 안 떴다. 계속 기다린다.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`서버가 ${timeoutMs / 1000}초 안에 뜨지 않았습니다.\n${getLog()}`);
}

function runLighthouse(url, outPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      [
        "lighthouse",
        url,
        "--quiet",
        "--output=json",
        `--output-path=${outPath}`,
        "--preset=desktop", // 아래에서 모바일로 덮어쓴다
        "--form-factor=mobile",
        "--screenEmulation.mobile",
        "--screenEmulation.width=412",
        "--screenEmulation.height=823",
        "--screenEmulation.deviceScaleFactor=1.75",
        "--throttling-method=simulate",
        "--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage",
      ],
      {
        stdio: ["ignore", "ignore", "pipe"],
        env: { ...process.env, CHROME_PATH: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" },
      },
    );
    let err = "";
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`lighthouse 실패 (${code})\n${err}`)),
    );
  });
}

const score = (v) => (v == null ? "—" : Math.round(v * 100));

await ensurePortFree();

const { server, getLog } = startServer();
let failed = false;

try {
  await waitForServer(getLog);
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`운영 서버 ${ORIGIN} 준비됨 (모바일 조건으로 측정)\n`);

  const summary = [];

  for (const path of PATHS) {
    const name = path === "/" ? "home" : path.replace(/\//g, "-").replace(/^-/, "");
    const outPath = `${OUT_DIR}/${name}.json`;
    await runLighthouse(`${ORIGIN}${path}`, outPath);

    const report = JSON.parse(await (await import("node:fs/promises")).readFile(outPath, "utf8"));
    const cats = report.categories;

    console.log(`■ ${path}`);
    console.log(
      `  성능 ${score(cats.performance?.score)} · ` +
        `접근성 ${score(cats.accessibility?.score)} · ` +
        `모범사례 ${score(cats["best-practices"]?.score)} · ` +
        `SEO ${score(cats.seo?.score)}`,
    );

    for (const [id, label] of VITALS) {
      const a = report.audits[id];
      if (a) console.log(`    ${label}: ${a.displayValue ?? "—"}`);
    }

    // 실제로 시간을 아낄 수 있는 항목만. 0.1초 미만은 노이즈다.
    const wins = Object.values(report.audits)
      .filter((a) => a.details?.type === "opportunity" && (a.numericValue ?? 0) > 100)
      .sort((a, b) => b.numericValue - a.numericValue);

    if (wins.length) {
      console.log("    고칠 거리:");
      for (const w of wins) console.log(`      · ${w.title} — ${w.displayValue}`);
    }

    // 점수와 무관하게 실패한 진단은 따로 보여 준다.
    const failures = Object.values(report.audits).filter(
      (a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode === "binary",
    );
    if (failures.length) {
      console.log("    통과하지 못한 검사:");
      for (const f of failures) console.log(`      · ${f.title}`);
    }
    console.log();

    summary.push({ path, ...Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, score(v.score)])) });
    if (score(cats.performance?.score) < 90) failed = true;
  }

  await writeFile(`${OUT_DIR}/summary.json`, JSON.stringify(summary, null, 2));
  console.log(`전체 보고서: ${OUT_DIR}/`);
  console.log(
    "\n⚠️ 이 숫자는 배포된 사이트의 점수가 아니다 (CDN·압축·실제 지연 없음).\n" +
      "   정식 숫자는 https://pagespeed.web.dev/ 에 배포 주소를 넣어 받는다.",
  );
} finally {
  server.kill("SIGTERM");
}

process.exit(failed ? 1 : 0);
