import "server-only";

import type { LessonAccessDeps, LessonRecord } from "@/lib/lessons/access";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * 강의 시청에 필요한 데이터 조회.
 *
 * 두 가지를 서로 다른 클라이언트로 읽는다:
 *  - **수강권**: 로그인한 사용자의 세션으로 읽는다.
 *    RLS의 enrollments_select_own 정책이 본인 것만 돌려주므로,
 *    실수로 남의 수강권을 읽을 수가 없다.
 *  - **영상 주소**: 서버 전용 클라이언트로 읽는다.
 *    anon·authenticated에는 lessons.vimeo_id의 컬럼 권한이 아예 없다 (Phase 2).
 *
 * 권한이 높은 클라이언트를 쓰는 쪽을 최소로 줄이는 것이 요점이다.
 */
export function createLessonAccessDeps(): LessonAccessDeps {
  return {
    async findActiveEnrollment(userId, courseSlug) {
      const supabase = await createClient();

      // 세션 클라이언트다. RLS가 본인 행만 보여 준다.
      const { data, error } = await supabase
        .from("enrollments")
        .select("id, courses!inner(slug)")
        .eq("user_id", userId)
        .eq("status", "active")
        .eq("courses.slug", courseSlug)
        .maybeSingle();

      if (error) {
        // 조회에 실패하면 막는 쪽으로 처리한다.
        console.error("[lessons] 수강권 확인 실패", error);
        return false;
      }
      return Boolean(data);
    },

    async findLessonWithVideo(lessonId): Promise<LessonRecord | null> {
      if (!hasServiceRoleKey()) {
        console.error("[lessons] SUPABASE_SERVICE_ROLE_KEY가 없어 영상 주소를 읽지 못했습니다.");
        return null;
      }

      const admin = createAdminClient();
      const { data, error } = await admin
        .from("lessons")
        .select("id, course_id, title, position, is_free_preview, vimeo_id, courses!inner(slug)")
        .eq("id", lessonId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        courseId: data.course_id,
        courseSlug: data.courses.slug,
        title: data.title,
        position: data.position,
        isFreePreview: data.is_free_preview,
        vimeoId: data.vimeo_id,
      };
    },
  };
}

/** 내 강의실 목록. 세션 클라이언트로 읽으므로 본인 것만 나온다. */
export async function getMyEnrollments() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("enrollments")
    .select("id, granted_at, source, courses!inner(id, slug, title, subtitle)")
    .eq("status", "active")
    .order("granted_at", { ascending: false });

  if (error) {
    console.error("[lessons] 수강 목록 조회 실패", error);
    return [];
  }
  return data ?? [];
}

/**
 * 강의의 차시 목록.
 *
 * ⚠️ vimeo_id를 고르지 않는다. 목록에는 필요 없고,
 *    필요 없는 민감 정보를 서버 컴포넌트로 끌어오면 실수로 넘길 위험만 는다.
 */
export async function getLessonListForCourse(courseSlug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("id, position, title, summary, duration_seconds, is_free_preview, courses!inner(slug)")
    .eq("courses.slug", courseSlug)
    .order("position", { ascending: true });

  if (error) {
    console.error("[lessons] 차시 목록 조회 실패", error);
    return [];
  }
  return data ?? [];
}
