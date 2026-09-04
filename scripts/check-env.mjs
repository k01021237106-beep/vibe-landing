/**
 * 환경변수 점검.
 *
 * 키를 붙여넣을 때 나는 실수는 종류가 정해져 있다:
 *  - 앞뒤에 따옴표나 공백이 붙는다
 *  - 서버 전용 키에 NEXT_PUBLIC_ 접두사가 붙는다 (가장 위험하다)
 *  - 테스트 키와 라이브 키를 섞는다
 *  - 값을 넣었다고 생각했는데 빈 칸이다
 *
 * 배포하고 나서 발견하면 이미 늦다. 여기서 먼저 잡는다.
 *
 * 실행:
 *   npm run check:env                 (.env.local 확인)
 *   vercel env pull && npm run check:env   (Vercel에 넣은 값 확인)
 *
 * ⚠️ 값 자체는 절대 출력하지 않는다. 길이와 형태만 본다.
 */
import { readFile } from "node:fs/promises";

const ENV_FILE = process.env.ENV_FILE ?? ".env.local";

/** 값을 그대로 보여 주지 않고 형태만 알려 준다 */
function shape(value) {
  if (!value) return "빈 값";
  return `${value.length}자, ${value.slice(0, 4)}…`;
}

const checks = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    public: true,
    what: "Supabase 프로젝트 주소",
    validate: (v) =>
      /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(v)
        ? null
        : "https://<프로젝트ref>.supabase.co 형태여야 합니다",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    required: true,
    public: true,
    what: "Supabase 공개 키",
    validate: (v) =>
      v.startsWith("sb_publishable_") || v.startsWith("eyJ")
        ? null
        : "sb_publishable_ 로 시작해야 합니다 (구형은 eyJ...)",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    public: false,
    what: "Supabase service_role 키 (RLS 우회)",
    validate: (v) => {
      if (v.startsWith("sb_publishable_")) {
        return "공개 키를 넣으셨습니다. service_role 키가 필요합니다";
      }
      if (!v.startsWith("sb_secret_") && !v.startsWith("eyJ")) {
        return "sb_secret_ 또는 eyJ 로 시작해야 합니다";
      }
      return null;
    },
  },
  {
    name: "LEAD_ACCESS_SECRET",
    required: true,
    public: false,
    what: "무료 1강 접근권 서명",
    validate: (v) =>
      v.length >= 16 ? null : `16자 이상이어야 합니다 (지금 ${v.length}자)`,
  },
  {
    name: "NEXT_PUBLIC_TOSS_CLIENT_KEY",
    required: true,
    public: true,
    what: "토스 결제창 키",
    validate: (v) =>
      /^(test|live)_(ck|gck)_/.test(v)
        ? null
        : "test_ck_ 또는 live_ck_ 로 시작해야 합니다",
  },
  {
    name: "TOSS_SECRET_KEY",
    required: true,
    public: false,
    what: "토스 결제 승인 키",
    validate: (v) => {
      if (/^(test|live)_(ck|gck)_/.test(v)) {
        return "결제창 키(Client Key)를 넣으셨습니다. Secret Key가 필요합니다";
      }
      if (!/^(test|live)_(sk|gsk)_/.test(v)) {
        return "test_sk_ 또는 live_sk_ 로 시작해야 합니다";
      }
      return null;
    },
  },
  {
    name: "NEXT_PUBLIC_SITE_URL",
    required: false,
    public: true,
    what: "사이트 정식 주소 (Vercel에서는 자동으로 들어온다)",
    validate: (v) =>
      /^https?:\/\/[^/]+$/.test(v)
        ? null
        : "https://example.com 형태여야 합니다 (끝에 / 없이)",
  },
];

/** .env 파일을 읽어 온다. 이미 process.env에 있으면 그쪽을 우선한다. */
async function loadEnvFile(path) {
  try {
    const text = await readFile(path, "utf8");
    const out = {};
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1);
    }
    return out;
  } catch {
    return null;
  }
}

const fromFile = await loadEnvFile(ENV_FILE);
if (fromFile === null) {
  console.log(`${ENV_FILE}이 없습니다. process.env만 확인합니다.`);
} else {
  console.log(`${ENV_FILE} 확인`);
}

const env = { ...(fromFile ?? {}), ...process.env };

let failed = false;
const fail = (msg) => {
  failed = true;
  console.error(`  ✗ ${msg}`);
};

console.log();
for (const check of checks) {
  const raw = env[check.name];

  if (raw === undefined || raw === "") {
    if (check.required) fail(`${check.name} — 값이 없습니다 (${check.what})`);
    else console.log(`  · ${check.name} — 없음 (선택 사항: ${check.what})`);
    continue;
  }

  // 붙여넣을 때 따옴표나 공백이 딸려 오는 일이 흔하다.
  if (raw !== raw.trim()) {
    fail(`${check.name} — 앞뒤에 공백이 붙어 있습니다`);
    continue;
  }
  if (/^["'].*["']$/.test(raw)) {
    fail(`${check.name} — 따옴표가 붙어 있습니다. 따옴표 없이 값만 넣으세요`);
    continue;
  }

  const problem = check.validate(raw);
  if (problem) {
    fail(`${check.name} — ${problem} (${shape(raw)})`);
    continue;
  }

  console.log(`  ✓ ${check.name} — ${shape(raw)}`);
}

/*
 * 가장 위험한 실수: 서버 전용 키에 NEXT_PUBLIC_ 접두사가 붙는 것.
 * 붙는 순간 브라우저로 나가고, 토스 Secret Key가 나가면
 * 누구나 결제를 임의로 승인할 수 있게 된다.
 */
console.log("\n서버 전용 키가 공개 변수로 새지 않았는지");
for (const check of checks.filter((c) => !c.public)) {
  const leaked = `NEXT_PUBLIC_${check.name}`;
  if (env[leaked]) {
    fail(`${leaked} 가 있습니다. 이 값은 브라우저로 나갑니다. 즉시 지우고 키를 폐기하세요`);
  } else {
    console.log(`  ✓ ${leaked} 없음`);
  }
}

// 테스트 키와 라이브 키를 섞으면 승인이 실패한다.
const clientKey = env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";
const secretKey = env.TOSS_SECRET_KEY ?? "";
if (clientKey && secretKey) {
  const clientMode = clientKey.startsWith("live_") ? "live" : "test";
  const secretMode = secretKey.startsWith("live_") ? "live" : "test";
  console.log("\n토스 키 조합");
  if (clientMode !== secretMode) {
    fail(`결제창 키는 ${clientMode}, 승인 키는 ${secretMode}입니다. 같은 쪽으로 맞추세요`);
  } else {
    console.log(`  ✓ 둘 다 ${clientMode} 키`);
    if (clientMode === "live") {
      console.log("  ⚠️ 라이브 키입니다. 실제 돈이 오갑니다.");
    }
  }
}

console.log();
if (failed) {
  console.error("환경변수 점검 실패 — 위 항목을 고친 뒤 다시 실행하세요.");
  process.exit(1);
}
console.log("환경변수 점검 통과");
