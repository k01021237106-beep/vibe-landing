import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * 브라우저에서 쓰는 Supabase 클라이언트.
 *
 * 이 클라이언트가 볼 수 있는 것은 전적으로 RLS 정책이 정한다.
 * 여기서 무엇을 조회하든 서버가 다시 검증한다고 가정하지 않는다 — 정책이 최종 방어선이다.
 */
export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabasePublishableKey,
  );
}
