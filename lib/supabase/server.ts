import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * 서버 컴포넌트·라우트 핸들러에서 쓰는 Supabase 클라이언트.
 *
 * 로그인한 사용자의 세션으로 동작하므로 RLS가 그대로 적용된다.
 * 관리자 권한이나 vimeo_id처럼 RLS를 넘어야 하는 작업은 이 클라이언트로 하지 않는다.
 * (Phase 5·6에서 service_role 전용 클라이언트를 따로 만든다)
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // 서버 컴포넌트에서는 쿠키를 쓸 수 없다.
            // 세션 갱신은 middleware.ts가 담당하므로 여기서는 무시해도 된다.
          }
        },
      },
    },
  );
}

/**
 * 현재 로그인한 사용자를 확인한다.
 *
 * getSession()이 아니라 getUser()를 쓴다.
 * getSession()은 쿠키를 그대로 믿지만 getUser()는 Supabase 서버에 확인한다.
 * 접근 권한을 판단할 때 쿠키를 믿으면 안 된다.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
