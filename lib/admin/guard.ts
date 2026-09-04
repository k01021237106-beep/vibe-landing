import "server-only";

import { createClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * 관리자 판별.
 *
 * 근거는 `profiles.role` 하나뿐이다. 이메일 목록을 코드에 박아 두거나
 * 환경변수로 관리하지 않는다 — 그러면 사람이 바뀔 때마다 배포해야 하고,
 * 어디가 진짜 기준인지 흐려진다.
 *
 * ⚠️ 사용자는 자기 role을 바꿀 수 없다. `profiles.role`의 update 컬럼 권한을
 *    회수해 뒀다 (Phase 2). 승격은 데이터베이스에서 직접 해야 한다.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = await createClient();

  // 세션 클라이언트로 본인 행만 읽는다. RLS가 남의 행을 막는다.
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    // 확인에 실패하면 막는 쪽으로 처리한다.
    console.error("[admin] 관리자 확인 실패", error);
    return false;
  }

  return data?.role === "admin";
}
