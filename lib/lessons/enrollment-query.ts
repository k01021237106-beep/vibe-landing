import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/**
 * 활성 수강권 확인.
 *
 * 클라이언트를 인자로 받는다 — 미들웨어와 페이지가 **같은 규칙**을 쓰게 하기 위해서다.
 * 두 곳에 같은 질의를 따로 적어 두면 언젠가 한쪽만 고쳐지고, 그 틈으로 새 나간다.
 *
 * 세션 클라이언트로 부르면 RLS의 enrollments_select_own 정책이
 * 본인 행만 돌려주므로 실수로 남의 수강권을 읽을 수 없다.
 */
export async function hasActiveEnrollment(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseSlug: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id, courses!inner(slug)")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("courses.slug", courseSlug)
    .maybeSingle();

  if (error) {
    // 확인에 실패하면 막는 쪽으로 처리한다.
    console.error("[lessons] 수강권 확인 실패", error);
    return false;
  }
  return Boolean(data);
}

/**
 * 시청 주소에서 강의와 차시를 뽑아낸다.
 *   /my/{강의}/{차시}  →  { courseSlug, lessonId }
 * 목록 화면(/my, /my/{강의})은 대상이 아니다.
 */
export function parseLessonPath(
  pathname: string,
): { courseSlug: string; lessonId: string } | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 3 || parts[0] !== "my") return null;
  return { courseSlug: parts[1], lessonId: parts[2] };
}
