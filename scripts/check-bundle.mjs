/**
 * 빌드 산출물 유출 검사.
 *
 * 브라우저로 내려가는 파일(.next/static)에 서버 전용 값이 섞여 있는지 본다.
 * 실수 한 줄이면 유료 영상 주소나 결제 승인 키가 통째로 나갈 수 있고,
 * 그런 실수는 눈으로 코드를 읽어서는 잘 안 잡힌다.
 *
 * 사용법:
 *   npm run build && npm run check:bundle
 *
 * ⚠️ 패턴은 좁게 쓴다.
 *    예전에 "123456789"로 찾았더니 라이브러리의 "0123456789"(base64 알파벳)에
 *    걸려 거짓 실패가 났다. 소음이 쌓이면 진짜 실패를 무시하게 된다.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const DIR = ".next/static";

/** 브라우저에 절대 있으면 안 되는 것들 */
const FORBIDDEN = [
  { name: "Supabase service_role 키", pattern: /SUPABASE_SERVICE_ROLE_KEY|service_role/ },
  { name: "토스 Secret Key", pattern: /TOSS_SECRET_KEY|sk_(test|live)_[A-Za-z0-9]{10,}/ },
  { name: "토스 승인 API 주소", pattern: /api\.tosspayments\.com\/v1\/payments\/confirm/ },
  { name: "무료 1강 서명 비밀키", pattern: /LEAD_ACCESS_SECRET/ },
  { name: "Vimeo ID 컬럼", pattern: /vimeo_id/ },
  { name: "Vimeo 자리표시 값", pattern: /TODO-VIMEO-ID/ },
  { name: "결제 완료 DB 함수", pattern: /complete_paid_order/ },
  { name: "환불 DB 함수", pattern: /refund_order/ },
  { name: "관리자 판별 DB 함수", pattern: /\bis_admin\b/ },
];

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const findings = [];
let scanned = 0;

for await (const file of walk(DIR)) {
  if (!/\.(js|mjs|css|json|map)$/.test(file)) continue;
  scanned += 1;
  const content = await readFile(file, "utf8");

  for (const rule of FORBIDDEN) {
    const match = content.match(rule.pattern);
    if (match) {
      const at = content.indexOf(match[0]);
      findings.push({
        rule: rule.name,
        file,
        excerpt: content.slice(Math.max(0, at - 40), at + match[0].length + 40),
      });
    }
  }
}

if (scanned === 0) {
  console.error(`${DIR}에 파일이 없습니다. 먼저 \`npm run build\`를 실행하세요.`);
  process.exit(1);
}

console.log(`브라우저로 내려가는 파일 ${scanned}개 검사`);

if (findings.length > 0) {
  console.error(`\n서버 전용 값이 클라이언트 번들에 있습니다 — ${findings.length}건\n`);
  for (const f of findings) {
    console.error(`  ✗ ${f.rule}`);
    console.error(`    ${f.file}`);
    console.error(`    …${f.excerpt.replace(/\n/g, " ")}…\n`);
  }
  process.exit(1);
}

console.log("서버 전용 값 0건 — 유출 없음");
