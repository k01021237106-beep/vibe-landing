/**
 * 토스 키의 모양을 판정한다.
 *
 * ⚠️ 이 파일만 `.mjs`인 이유 — `scripts/check-env.mjs`(순수 Node)와
 * 테스트(vitest) 양쪽에서 **같은 규칙**을 써야 하기 때문이다.
 * 규칙이 두 벌이면 언젠가 갈라지고, 갈라진 쪽이 통과시켜 버린다.
 *
 * 토스 키는 세 조각으로 되어 있다:
 *
 *   test_gsk_XXXXXXXX
 *   └┬─┘ └┬┘
 *    │    └─ 종류: ck·gck = 결제창 열기(공개) / sk·gsk = 승인(서버 전용)
 *    └────── 모드: test = 시험 / live = 실제 돈
 *
 * 그리고 **g가 붙은 것끼리 짝**이다:
 *   결제창(일반)  ck ↔ sk
 *   결제위젯      gck ↔ gsk     ← 우리가 쓰는 방식
 *
 * 짝이 어긋나면 결제창은 열리는데 승인에서 인증 실패한다.
 * 화면만 봐서는 원인을 알 수 없는 종류라 여기서 잡는다.
 * (2026-09-05에 실제로 gck 클라이언트 키 옆에 엉뚱한 값이 들어 있었다)
 */

/** @typedef {{ role: 'client'|'secret'|null, mode: 'test'|'live'|null, family: 'window'|'widget'|null }} TossKeyShape */

/** @param {string} value @returns {TossKeyShape} */
export function classifyTossKey(value) {
  const match = /^(test|live)_(ck|gck|sk|gsk)_/.exec((value ?? "").trim());
  if (!match) return { role: null, mode: null, family: null };

  const [, mode, kind] = match;
  return {
    role: kind === "ck" || kind === "gck" ? "client" : "secret",
    mode: /** @type {'test'|'live'} */ (mode),
    family: kind.startsWith("g") ? "widget" : "window",
  };
}

const FAMILY_LABEL = { widget: "결제위젯", window: "결제창(일반)" };

/**
 * 키 한 개가 제자리에 있는지 본다.
 * @param {string} value
 * @param {'client'|'secret'} expected
 * @returns {string|null} 문제가 있으면 한국어 설명, 없으면 null
 */
export function checkTossKeyRole(value, expected) {
  const shape = classifyTossKey(value);

  if (!shape.role) {
    return expected === "client"
      ? "토스 키가 아닙니다. test_ck_ 또는 test_gck_ 로 시작해야 합니다"
      : "토스 키가 아닙니다. test_sk_ 또는 test_gsk_ 로 시작해야 합니다";
  }

  if (shape.role === expected) return null;

  // 자리가 바뀐 경우. 시크릿 키가 공개 변수에 들어가는 쪽이 훨씬 위험하다.
  return expected === "client"
    ? "⚠️ 승인용 Secret Key가 공개 변수에 들어 있습니다. 이 값은 브라우저로 나갑니다 — 즉시 지우고 키를 폐기하세요"
    : "결제창 키(Client Key)를 넣으셨습니다. Secret Key가 필요합니다";
}

/**
 * 두 키가 서로 맞는 짝인지 본다.
 * @param {{ clientKey?: string, secretKey?: string }} keys
 * @returns {{ problems: string[], notes: string[] }}
 */
export function checkTossKeyPair({ clientKey, secretKey }) {
  /** @type {string[]} */ const problems = [];
  /** @type {string[]} */ const notes = [];

  if (!clientKey || !secretKey) return { problems, notes };

  const client = classifyTossKey(clientKey);
  const secret = classifyTossKey(secretKey);

  // 모양을 못 알아본 키는 위에서 이미 신고했다. 여기서 또 말하지 않는다.
  if (!client.role || !secret.role) return { problems, notes };

  if (client.mode !== secret.mode) {
    problems.push(
      `결제창 키는 ${client.mode}, 승인 키는 ${secret.mode}입니다. 같은 쪽으로 맞추세요`,
    );
  } else {
    notes.push(`둘 다 ${client.mode} 키`);
    if (client.mode === "live") notes.push("⚠️ 라이브 키입니다. 실제 돈이 오갑니다.");
  }

  if (client.role === "client" && secret.role === "secret" && client.family !== secret.family) {
    problems.push(
      `연동 방식이 다릅니다 — 결제창 키는 ${FAMILY_LABEL[client.family]}, ` +
        `승인 키는 ${FAMILY_LABEL[secret.family]}용입니다. ` +
        `우리는 결제위젯을 쓰므로 둘 다 g가 붙은 키(test_gck_ / test_gsk_)여야 합니다`,
    );
  }

  return { problems, notes };
}
