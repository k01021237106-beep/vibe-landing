/**
 * 환경변수 접근 지점.
 *
 * 값이 없으면 화면이 이상하게 동작하는 대신 시작 시점에 바로 멈춘다.
 * 배포한 뒤 "로그인이 왜 안 되지"를 헤매는 것보다 낫다.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `환경변수 ${name}이(가) 없습니다. .env.local을 확인하세요. (README의 '환경변수' 참고)`,
    );
  }
  return value;
}

/** 브라우저에도 내려가는 값. 공개돼도 안전한 것만 둔다. */
export const publicEnv = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  /**
   * 공개용 키다. 이 키로 할 수 있는 일은 전부 RLS 정책이 정한다.
   * 그래서 RLS를 끄면 이 키가 곧 데이터베이스 전체 열쇠가 된다.
   */
  supabasePublishableKey: required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),

  /**
   * 카카오 로그인 버튼을 보일지.
   *
   * **기본값은 꺼짐이다.** 값을 넣지 않으면 버튼이 나오지 않는다.
   * 되는 줄 알고 켜 두는 것보다, 안 되는 줄 알고 꺼 두는 쪽이 안전하기 때문이다 —
   * 눌렀을 때 오류가 나는 버튼은 없느니만 못하다.
   *
   * 왜 이 스위치가 필요한가 —
   * Supabase Auth는 카카오에 `account_email` scope를 **항상** 요청한다
   * (코드에 박혀 있고 우리 쪽에서 뺄 수 없다. docs/SUPABASE.md 참고).
   * 카카오 앱이 비즈 앱이 아니면 그 동의항목을 열 수 없어 매번 KOE205로 막힌다.
   * 비즈 앱 전환이 끝나면 이 값을 1로 바꾼다. 코드는 고칠 것이 없다.
   */
  kakaoLoginEnabled: process.env.NEXT_PUBLIC_KAKAO_LOGIN_ENABLED === "1",
} as const;
