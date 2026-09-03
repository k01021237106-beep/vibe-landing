import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * 요청마다 세션을 갱신한다.
 *
 * Supabase 접근 토큰은 짧게 살아 있다. 갱신하지 않으면 잠깐 자리를 비운 사용자가
 * 다시 돌아왔을 때 로그아웃된 것처럼 보인다.
 * 서버 컴포넌트는 쿠키를 쓸 수 없으므로 갱신은 여기서만 일어난다.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // 이 호출이 토큰 갱신을 일으킨다. 지우면 안 된다.
  await supabase.auth.getUser();

  return response;
}
