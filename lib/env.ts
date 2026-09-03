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
} as const;
