import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * 서버 전용 Supabase 클라이언트.
 *
 * ⚠️ 이 클라이언트는 **RLS를 우회한다.** 모든 행, 모든 컬럼을 읽고 쓴다.
 *    그래서 쓰는 곳을 최소로 줄이고, 쓸 때마다 왜 필요한지 적는다.
 *
 * 지금 필요한 이유:
 *  - `lessons.vimeo_id`는 anon·authenticated에 컬럼 권한이 없다 (Phase 2).
 *    영상 주소는 접근 자격을 확인한 뒤 서버가 직접 읽어 넘겨야 한다.
 *  - 주문·수강권은 클라이언트가 만들 수 없다. 서버만 쓴다 (Phase 5·6).
 *
 * 규칙:
 *  - 이 파일을 클라이언트 컴포넌트에서 import하지 않는다.
 *    `server-only`가 그런 import를 빌드 단계에서 막는다.
 *  - 접근 자격 확인을 **먼저** 하고 이 클라이언트를 부른다. 순서가 반대면 의미가 없다.
 */

let cached: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createAdminClient() {
  if (cached) return cached;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "환경변수 SUPABASE_SERVICE_ROLE_KEY가 없습니다. " +
        "Supabase 대시보드 → Project Settings → API → service_role 키를 " +
        ".env.local에 넣으세요. 이 키는 서버 전용이며 절대 커밋하지 않습니다.",
    );
  }

  cached = createSupabaseClient<Database>(publicEnv.supabaseUrl, serviceRoleKey, {
    auth: {
      // 서버에서 쓰는 클라이언트다. 세션을 저장하거나 갱신할 이유가 없다.
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cached;
}

/** service_role 키가 설정돼 있는지. 화면에서 안내 문구를 고르는 데 쓴다. */
export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
