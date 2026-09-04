import "server-only";

import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

/**
 * 무료 1강의 영상 주소를 가져온다.
 *
 * ⚠️ 이 함수를 부르기 전에 **접근 자격을 반드시 먼저 확인한다.**
 *    이 함수 자체는 자격을 보지 않는다 — 부르는 쪽의 책임이다.
 *    (app/free/watch/page.tsx가 쿠키를 확인한 뒤에 부른다)
 *
 * anon·authenticated에는 lessons.vimeo_id의 컬럼 권한이 없으므로
 * RLS를 우회하는 서버 전용 클라이언트로만 읽을 수 있다.
 */
export type FreeLessonVideo =
  | { status: "ok"; vimeoId: string | null }
  | { status: "not_configured" };

export async function getFreeLessonVideo(courseSlug: string): Promise<FreeLessonVideo> {
  if (!hasServiceRoleKey()) {
    // 키가 없으면 영상 주소를 읽을 방법이 없다. 페이지를 깨뜨리는 대신 안내로 대체한다.
    console.error(
      "[free] SUPABASE_SERVICE_ROLE_KEY가 없어 영상 주소를 읽지 못했습니다. " +
        ".env.local을 확인하세요.",
    );
    return { status: "not_configured" };
  }

  try {
    const admin = createAdminClient();

    const { data: course, error: courseError } = await admin
      .from("courses")
      .select("id")
      .eq("slug", courseSlug)
      .eq("is_published", true)
      .maybeSingle();

    if (courseError || !course) return { status: "ok", vimeoId: null };

    const { data: lesson, error: lessonError } = await admin
      .from("lessons")
      .select("vimeo_id")
      .eq("course_id", course.id)
      .eq("is_free_preview", true)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (lessonError) {
      console.error("[free] 영상 주소 조회 실패", lessonError);
      return { status: "not_configured" };
    }

    return { status: "ok", vimeoId: lesson?.vimeo_id ?? null };
  } catch (cause) {
    console.error("[free] 영상 주소 조회 중 오류", cause);
    return { status: "not_configured" };
  }
}
