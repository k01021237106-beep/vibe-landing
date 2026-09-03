import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * 소셜 로그인(카카오)과 이메일 링크가 돌아오는 자리.
 *
 * Supabase가 붙여 준 code를 세션으로 바꾼다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/my";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  /*
   * 열린 리디렉션을 막는다.
   * next에 외부 주소를 넣어 보내면 로그인 직후 그리로 튕겨 나갈 수 있다.
   * 우리 사이트 안의 경로만 허용한다.
   */
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/my";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
