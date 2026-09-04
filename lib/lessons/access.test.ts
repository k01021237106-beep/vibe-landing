import { describe, expect, it, vi } from "vitest";

import { resolveLessonVideo } from "@/lib/lessons/access";
import type { LessonAccessDeps, LessonRecord } from "@/lib/lessons/access";

/**
 * 강의 시청 접근 통제.
 *
 * 이 파일이 지키는 것: **수강권을 확인하기 전에는 영상 주소를 읽지 않는다.**
 *
 * 순서가 중요하다. 영상 주소를 먼저 가져와 놓고 나중에 자격을 보면,
 * 그 사이에 실수 하나만 있어도 유료 영상이 새 나간다.
 * 그래서 아래 테스트는 "거부되는가"뿐 아니라
 * **"영상 주소를 아예 조회하지 않는가"** 까지 본다.
 */
const 유료차시: LessonRecord = {
  id: "lesson-2",
  courseId: "course-1",
  courseSlug: "first-deploy-vibecoding",
  title: "도구 설치",
  position: 2,
  isFreePreview: false,
  vimeoId: "123456789",
};

function 가짜의존성(options: {
  enrolled?: boolean;
  lesson?: LessonRecord | null;
}): LessonAccessDeps & {
  findActiveEnrollment: ReturnType<typeof vi.fn>;
  findLessonWithVideo: ReturnType<typeof vi.fn>;
} {
  return {
    findActiveEnrollment: vi.fn(async () => options.enrolled ?? false),
    findLessonWithVideo: vi.fn(async () =>
      options.lesson === undefined ? 유료차시 : options.lesson,
    ),
  };
}

describe("미구매자 차단", () => {
  it("로그인하지 않으면 막고, 영상 주소를 조회하지 않는다", async () => {
    const deps = 가짜의존성({});
    const result = await resolveLessonVideo(
      { userId: null, courseSlug: "first-deploy-vibecoding", lessonId: "lesson-2" },
      deps,
    );

    expect(result.status).toBe("unauthenticated");
    expect(deps.findLessonWithVideo).not.toHaveBeenCalled();
  });

  it("수강권이 없으면 막고, 영상 주소를 조회하지 않는다", async () => {
    const deps = 가짜의존성({ enrolled: false });
    const result = await resolveLessonVideo(
      { userId: "user-1", courseSlug: "first-deploy-vibecoding", lessonId: "lesson-2" },
      deps,
    );

    expect(result.status).toBe("forbidden");
    // 가장 중요한 단언 — 자격이 없으면 영상 주소에 손도 대지 않는다
    expect(deps.findLessonWithVideo).not.toHaveBeenCalled();
  });

  it("무료 공개 차시라도 수강권 없이는 이 경로로 볼 수 없다", async () => {
    // 무료 1강은 /free/watch에 따로 있다. 여기서 예외를 두면 규칙이 흐려진다.
    const deps = 가짜의존성({
      enrolled: false,
      lesson: { ...유료차시, isFreePreview: true },
    });
    const result = await resolveLessonVideo(
      { userId: "user-1", courseSlug: "first-deploy-vibecoding", lessonId: "lesson-1" },
      deps,
    );
    expect(result.status).toBe("forbidden");
    expect(deps.findLessonWithVideo).not.toHaveBeenCalled();
  });

  it("수강권이 회수됐으면 막는다", async () => {
    // 환불하면 enrollments.status가 revoked가 된다. 그때부터 못 본다.
    const deps = 가짜의존성({ enrolled: false });
    const result = await resolveLessonVideo(
      { userId: "user-1", courseSlug: "first-deploy-vibecoding", lessonId: "lesson-2" },
      deps,
    );
    expect(result.status).toBe("forbidden");
  });
});

describe("수강생 접근", () => {
  it("수강권이 있으면 영상 주소를 준다", async () => {
    const deps = 가짜의존성({ enrolled: true });
    const result = await resolveLessonVideo(
      { userId: "user-1", courseSlug: "first-deploy-vibecoding", lessonId: "lesson-2" },
      deps,
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.lesson.vimeoId).toBe("123456789");
    }
    // 자격 확인이 먼저다
    expect(deps.findActiveEnrollment).toHaveBeenCalled();
  });

  it("다른 강의의 차시를 끼워 넣으면 막는다", async () => {
    // 수강권은 A강의인데 B강의 차시 id를 넣는 경우
    const deps = 가짜의존성({
      enrolled: true,
      lesson: { ...유료차시, courseSlug: "another-course" },
    });
    const result = await resolveLessonVideo(
      { userId: "user-1", courseSlug: "first-deploy-vibecoding", lessonId: "lesson-2" },
      deps,
    );
    expect(result.status).toBe("not_found");
  });

  it("없는 차시는 not_found다", async () => {
    const deps = 가짜의존성({ enrolled: true, lesson: null });
    const result = await resolveLessonVideo(
      { userId: "user-1", courseSlug: "first-deploy-vibecoding", lessonId: "없는거" },
      deps,
    );
    expect(result.status).toBe("not_found");
  });
});
