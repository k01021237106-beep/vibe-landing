import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * 무료 1강 접근권.
 *
 * 무료 1강은 로그인을 요구하지 않는다 — 타겟에 시니어가 포함되고,
 * 목표 행동이 '가입'이 아니라 '신청'이기 때문이다. 이름과 연락처만 받는다.
 * 그래서 "신청한 사람"임을 증명하는 수단이 서명된 쿠키 하나뿐이다.
 *
 * 설계상 알아 둘 것:
 *  - 쿠키에 연락처를 그대로 담지 않는다. 대신 HMAC 해시를 담는다.
 *    브라우저에 남는 값에서 개인정보를 되돌릴 수 없어야 한다.
 *  - 서명이 만료 시각까지 덮는다. 만료를 늘리면 서명이 깨진다.
 *  - 이 표는 남에게 넘길 수 있다. 무료 강의라 그 정도 위험은 감수한다.
 *    돈이 걸린 유료 강의는 로그인 + 수강권(enrollments)으로 막는다 (Phase 6).
 */

const TOKEN_VERSION = "v1";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 365; // 1년

export const FREE_ACCESS_COOKIE = "first_deploy_free_access";

function secret(): string {
  const value = process.env.LEAD_ACCESS_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "환경변수 LEAD_ACCESS_SECRET이 없거나 너무 짧습니다(16자 이상). " +
        "무료 1강 접근권을 서명하는 데 쓰입니다. README의 '환경변수'를 확인하세요.",
    );
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** 연락처를 되돌릴 수 없는 형태로 바꾼다. 같은 번호는 항상 같은 값이 된다. */
function hashPhone(phone: string): string {
  return createHmac("sha256", secret()).update(`phone:${phone}`).digest("base64url").slice(0, 22);
}

/** 신청이 확인된 사람에게 발급한다. */
export function issueFreeAccessToken(
  normalizedPhone: string,
  options: { ttlSeconds?: number } = {},
): string {
  const ttl = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const expiresAt = Math.floor(Date.now() / 1000) + ttl;
  const body = `${TOKEN_VERSION}.${hashPhone(normalizedPhone)}.${expiresAt}`;
  return `${body}.${sign(body)}`;
}

/**
 * 표가 우리가 발급한 것이고 아직 유효한지 확인한다.
 *
 * 어떤 이유로 막히든 false 하나만 돌려준다.
 * 왜 막혔는지 알려 주면 표를 위조하려는 쪽에 힌트가 된다.
 */
export function verifyFreeAccessToken(token: string | undefined | null): boolean {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 4) return false;

  const [version, , expiresAtRaw, signature] = parts;
  if (version !== TOKEN_VERSION) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isSafeInteger(expiresAt)) return false;

  const body = `${version}.${parts[1]}.${expiresAtRaw}`;

  let expected: string;
  try {
    expected = sign(body);
  } catch {
    // 비밀키가 없으면 통과시키지 않는다. 막히는 쪽으로 실패한다.
    return false;
  }

  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  // 길이가 다르면 timingSafeEqual이 예외를 던지므로 먼저 본다.
  if (given.length !== want.length) return false;
  if (!timingSafeEqual(given, want)) return false;

  // 서명을 확인한 뒤에 만료를 본다. 순서가 반대면 위조된 표의 만료 시각을 믿게 된다.
  return expiresAt > Math.floor(Date.now() / 1000);
}
