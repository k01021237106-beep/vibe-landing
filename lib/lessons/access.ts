/**
 * 강의 시청 접근 통제.
 *
 * ⚠️ 원칙 하나: **수강권을 확인하기 전에는 영상 주소를 읽지 않는다.**
 *
 * 순서가 중요하다. 영상 주소를 먼저 가져와 놓고 나중에 자격을 보면,
 * 그 사이에 실수 하나만 있어도 유료 영상이 새 나간다.
 * 코드가 위에서 아래로 읽히는 순서 자체가 방어선이 되게 짰다.
 *
 * 의존성을 인터페이스로 받는 이유는 Phase 5의 결제 검증과 같다 —
 * 데이터베이스 없이 차단 시나리오를 검증하기 위해서다.
 */

export type LessonRecord = {
  id: string;
  courseId: string;
  courseSlug: string;
  title: string;
  position: number;
  isFreePreview: boolean;
  /** ⚠️ 민감 정보. 이 값이 담긴 객체를 그대로 클라이언트로 넘기지 않는다. */
  vimeoId: string | null;
};

export type LessonAccessDeps = {
  /** 활성 수강권이 있는지. 환불되면 false가 된다. */
  findActiveEnrollment(userId: string, courseSlug: string): Promise<boolean>;
  /** 영상 주소를 포함한 차시. 자격 확인을 통과한 뒤에만 부른다. */
  findLessonWithVideo(lessonId: string): Promise<LessonRecord | null>;
};

export type LessonAccessInput = {
  userId: string | null;
  courseSlug: string;
  lessonId: string;
};

export type LessonAccessResult =
  | { status: "ok"; lesson: LessonRecord }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not_found" };

export async function resolveLessonVideo(
  input: LessonAccessInput,
  deps: LessonAccessDeps,
): Promise<LessonAccessResult> {
  const { userId, courseSlug, lessonId } = input;

  // 1. 누구인지 모르면 여기서 끝이다.
  if (!userId) {
    return { status: "unauthenticated" };
  }

  /*
   * 2. 수강권 확인.
   *
   * 무료 공개 차시라도 예외를 두지 않는다.
   * 무료 1강은 /free/watch에 따로 있고, 여기서 예외를 만들면 규칙이 흐려진다.
   * 규칙이 흐려지면 나중에 그 틈으로 유료 영상이 샌다.
   */
  const enrolled = await deps.findActiveEnrollment(userId, courseSlug);
  if (!enrolled) {
    return { status: "forbidden" };
  }

  // 3. 여기까지 왔을 때만 영상 주소를 읽는다.
  const lesson = await deps.findLessonWithVideo(lessonId);
  if (!lesson) {
    return { status: "not_found" };
  }

  /*
   * 4. 차시가 정말 이 강의의 것인지 확인한다.
   *    A강의 수강권으로 B강의 차시 id를 끼워 넣는 시도를 막는다.
   */
  if (lesson.courseSlug !== courseSlug) {
    return { status: "not_found" };
  }

  return { status: "ok", lesson };
}
