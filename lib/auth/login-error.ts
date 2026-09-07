/**
 * 로그인 실패를 손님이 읽을 문장으로 바꾼다.
 *
 * 왜 나눠서 말하나 — 실제로 이런 일이 있었다.
 * 메일 발송 한도(429)에 걸렸는데 화면은
 * "메일을 보내지 못했습니다. **주소를 다시 확인해 주세요**"라고 말했다.
 * 주소는 멀쩡했다. 손님은 멀쩡한 주소를 몇 번씩 고쳐 쓰다가 포기한다.
 *
 * 원인이 다르면 해야 할 일도 다르다. 그러면 다르게 말해야 한다.
 *  - 한도 초과  → 기다린다 (주소를 고칠 일이 아니다)
 *  - 주소 오류  → 주소를 고친다
 *  - 그 밖      → 다시 시도한다
 *
 * ⚠️ 왜 그렇게 됐는지는 말하지 않는다. "한 시간에 몇 통"처럼 우리 쪽 사정을
 * 알려 주면 남용의 힌트가 된다. 손님에게 필요한 것은 '무엇을 하면 되는지'다.
 */
export type AuthErrorLike = {
  status?: number;
  code?: string;
  message?: string;
};

/** 발송 한도에 걸린 경우 (Supabase 기본 메일 발송기의 시간당 제한) */
function isRateLimited(error: AuthErrorLike): boolean {
  if (error.status === 429) return true;
  const code = error.code ?? "";
  return code === "over_email_send_rate_limit" || code === "over_request_rate_limit";
}

/** 주소 자체가 틀린 경우 */
function isInvalidEmail(error: AuthErrorLike): boolean {
  const code = error.code ?? "";
  if (code === "validation_failed" || code === "email_address_invalid") return true;
  return error.status === 400 && /email/i.test(error.message ?? "");
}

export function loginErrorMessage(error: AuthErrorLike): string {
  if (isRateLimited(error)) {
    return "메일을 너무 자주 보냈습니다. 잠시 뒤(최대 한 시간) 다시 시도해 주세요. 주소는 고치지 않으셔도 됩니다.";
  }
  if (isInvalidEmail(error)) {
    return "메일 주소를 다시 확인해 주세요.";
  }
  return "메일을 보내지 못했습니다. 잠시 뒤 다시 시도해 주세요.";
}

/**
 * 로그인 링크를 눌러 돌아왔는데 실패한 경우.
 *
 * `/auth/callback`이 `?error=` 를 붙여 로그인 화면으로 되돌린다.
 * 그 값을 읽어 무슨 일이 있었는지 알려 준다.
 *
 * 이게 없으면 손님은 **빈 로그인 화면**만 본다.
 * 방금 메일에서 링크를 눌렀는데 로그인 화면이 다시 나오니,
 * 같은 링크를 또 누르고 또 실패한다. 실제로 우리가 그렇게 헤맸다 (2026-09-07).
 *
 * 가장 흔한 원인은 **이미 쓴 링크를 다시 누른 것**이다.
 * 지메일은 제목이 같은 메일을 한 대화로 묶고 접어 두기 때문에,
 * 접힌 옛 메일의 링크를 누르기 쉽다. 그래서 그 경우를 콕 집어 말해 준다.
 *
 * ⚠️ 어느 경우든 **다음에 할 일이 같다** — 링크를 새로 받는 것.
 * 그러니 원인 분석을 늘어놓지 않고 그 한 가지를 분명히 말한다.
 */
export function callbackErrorMessage(code: string | null): string | null {
  if (!code) return null;

  if (code === "exchange_failed") {
    return "로그인 링크가 만료되었거나 이미 사용되었습니다. 아래에서 새 링크를 받아 주세요. 메일이 여러 통이라면 가장 최근에 온 것을 열어 주세요.";
  }
  if (code === "missing_code") {
    return "로그인 링크가 올바르지 않습니다. 아래에서 새 링크를 받아 주세요.";
  }
  // 모르는 값이 와도 손님을 빈 화면에 두지 않는다.
  return "로그인을 마치지 못했습니다. 아래에서 새 링크를 받아 주세요.";
}
