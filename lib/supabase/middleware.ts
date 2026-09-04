import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/env";
import { forbiddenLessonResponse } from "@/lib/lessons/forbidden-response";
import { hasActiveEnrollment, parseLessonPath } from "@/lib/lessons/enrollment-query";
import type { Database } from "@/lib/supabase/database.types";

/**
 * 요청마다 세션을 갱신하고, 강의 시청 주소는 수강권을 확인한다.
 *
 * 세션 갱신 —
 *   Supabase 접근 토큰은 짧게 살아 있다. 갱신하지 않으면 잠깐 자리를 비운 사용자가
 *   다시 돌아왔을 때 로그아웃된 것처럼 보인다.
 *   서버 컴포넌트는 쿠키를 쓸 수 없으므로 갱신은 여기서만 일어난다.
 *
 * 시청 차단 —
 *   구매하지 않은 사람에게는 **403**을 돌려준다.
 *   페이지에서 `forbidden()`을 쓰면 Next 15.5는 상태 코드를 404로 준다.
 *   유료 콘텐츠 차단은 "없는 페이지"가 아니라 "권한이 없다"여야 하므로 여기서 직접 정한다.
 *   페이지에도 같은 확인이 남아 있다 — 이중 방어이고, 규칙은 한 곳에서 온다
 *   (lib/lessons/enrollment-query.ts).
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const lessonPath = parseLessonPath(request.nextUrl.pathname);
  if (lessonPath) {
    if (!user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(login);
    }

    const enrolled = await hasActiveEnrollment(supabase, user.id, lessonPath.courseSlug);
    if (!enrolled) {
      return forbiddenLessonResponse();
    }
  }

  return response;
}
