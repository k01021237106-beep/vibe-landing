/**
 * Pretendard 웹폰트를 node_modules에서 public/fonts로 복사한다.
 *
 * 왜 빌드 시점에 생성하는가:
 *  - Pretendard 전체를 저장소에 커밋하면 수백 개 바이너리가 들어간다.
 *  - 필요한 굵기(400/500/900)의 동적 서브셋만 뽑으면 브라우저는
 *    실제로 쓰인 글자가 든 조각(보통 3~6개, 수십 KB)만 내려받는다.
 *  - 외부 CDN에 의존하지 않으므로 CDN이 죽어도 본문 폰트가 살아 있다.
 *
 * package.json의 predev / prebuild에서 자동 실행된다.
 */
import { existsSync } from "node:fs";
import { mkdir, copyFile, readFile, writeFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "node_modules/pretendard/dist/web/static");
const outDir = path.join(root, "public/fonts/pretendard");
const outCss = path.join(root, "public/fonts/fonts.css");
const paperlogyFile = path.join(root, "public/fonts/paperlogy/Paperlogy-9Black.woff2");

/** 실제로 쓰는 굵기만 — 본문 400, 강조 500, 헤드라인 폴백 900 */
const WEIGHTS = [
  { file: "Pretendard-Regular", weight: 400 },
  { file: "Pretendard-Medium", weight: 500 },
  { file: "Pretendard-Black", weight: 900 },
];

if (!existsSync(src)) {
  console.error("[fonts] pretendard 패키지를 찾지 못했습니다. `npm install`을 먼저 실행하세요.");
  process.exit(1);
}

const css = await readFile(path.join(src, "pretendard-dynamic-subset.css"), "utf8");

// @font-face 블록을 굵기별로 골라내고, 경로를 /fonts/pretendard/ 로 바꾼다.
const blocks = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
const kept = [];
const needed = new Set();

for (const block of blocks) {
  const match = block.match(/url\(\.\/woff2-dynamic-subset\/([^)]+\.woff2)\)/);
  if (!match) continue;
  const fileName = match[1];
  const entry = WEIGHTS.find((w) => fileName.startsWith(`${w.file}.`));
  if (!entry) continue;

  needed.add(fileName);
  kept.push(
    block
      // woff 폴백은 뺀다 — woff2를 못 읽는 브라우저는 이제 없다
      .replace(/,\s*url\(\.\/woff-dynamic-subset\/[^)]+\)\s*format\('woff'\)/, "")
      .replace(/url\(\.\/woff2-dynamic-subset\//, "url(/fonts/pretendard/"),
  );
}

if (kept.length === 0) {
  console.error("[fonts] @font-face 규칙을 하나도 찾지 못했습니다. pretendard 패키지 구조가 바뀌었는지 확인하세요.");
  process.exit(1);
}

// 굵기 구성이 바뀌었을 때 예전 파일이 남지 않도록 매번 비우고 다시 만든다.
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const fileName of needed) {
  await copyFile(path.join(src, "woff2-dynamic-subset", fileName), path.join(outDir, fileName));
}

/*
 * 헤드라인 글꼴 Paperlogy는 파일이 있을 때만 @font-face를 넣는다.
 * 없는데도 넣어 두면 브라우저가 페이지마다 404를 한 번씩 낸다 —
 * 화면은 폴백으로 멀쩡해 보여서 한동안 눈치채지 못했다.
 */
const hasPaperlogy = existsSync(paperlogyFile);
const paperlogyRule = hasPaperlogy
  ? `@font-face {
\tfont-family: 'Paperlogy';
\tfont-style: normal;
\tfont-weight: 900;
\tfont-display: swap;
\tsrc: url(/fonts/paperlogy/Paperlogy-9Black.woff2) format('woff2');
}
`
  : "/* Paperlogy 파일이 없어 건너뜁니다. public/fonts/paperlogy/README.md 참고 */\n";

const header = `/* 이 파일은 scripts/setup-fonts.mjs가 생성합니다. 직접 고치지 마세요. */
/* Pretendard — SIL Open Font License 1.1, (c) 2021 Kil Hyung-jin */
`;
await writeFile(outCss, header + paperlogyRule + kept.join("\n") + "\n", "utf8");

const copied = (await readdir(outDir)).length;
console.log(
  `[fonts] 준비 완료 — Pretendard @font-face ${kept.length}개, 서브셋 ${copied}개` +
    `, Paperlogy ${hasPaperlogy ? "적용" : "없음(Pretendard 900으로 대체)"}`,
);
