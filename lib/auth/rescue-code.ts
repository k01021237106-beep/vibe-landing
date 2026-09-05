/**
 * 첫 화면으로 잘못 떨어진 로그인 코드를 알아본다.
 *
 * 메일의 로그인 링크는 Supabase를 거쳐 `/auth/callback`으로 돌아와야 한다.
 * 그런데 그 주소가 Supabase의 Redirect URLs 목록에 없으면
 * Supabase는 조용히 **Site URL(첫 화면)** 로 대신 보낸다.
 * 주소창에 `/?code=...`가 남고, 첫 화면은 그 code로 무엇을 해야 하는지 모른다.
 * 손님 눈에는 "링크를 눌렀는데 그냥 홈페이지가 열렸다"로 보인다.
 *
 * 설정을 고치는 것이 먼저지만, 설정 하나가 틀렸다고 손님을 잃을 이유는 없다.
 *
 * ⚠️ 첫 화면에서만 구한다. `code`라는 이름은 다른 데서도 쓴다 —
 * `/checkout/fail?code=REJECT_CARD_COMPANY`는 카드사 거절 코드다.
 * 넓게 잡으면 결제 실패 화면을 로그인으로 끌고 가 버린다.
 */
export function authCodeToRescue(url: URL): string | null {
  if (url.pathname !== "/") return null;

  const code = url.searchParams.get("code");
  return code ? code : null;
}
