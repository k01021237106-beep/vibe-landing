import { describe, expect, it } from "vitest";

import { parseLessonPath } from "@/lib/lessons/enrollment-query";
import { forbiddenLessonResponse } from "@/lib/lessons/forbidden-response";

/**
 * 미들웨어가 조합하는 두 조각.
 *
 * 접근 판단 자체는 lib/lessons/access.test.ts가 검증한다.
 * 여기서는 "어떤 주소를 막을지"와 "막을 때 무엇을 돌려줄지"를 본다.
 */
describe("시청 주소 판별", () => {
  it("차시 시청 주소를 알아본다", () => {
    expect(parseLessonPath("/my/first-deploy-vibecoding/lesson-2")).toEqual({
      courseSlug: "first-deploy-vibecoding",
      lessonId: "lesson-2",
    });
  });

  it("목록 화면은 대상이 아니다", () => {
    // 이 화면들은 페이지가 스스로 막는다. 미들웨어가 질의를 더 할 이유가 없다.
    expect(parseLessonPath("/my")).toBeNull();
    expect(parseLessonPath("/my/first-deploy-vibecoding")).toBeNull();
  });

  it("다른 주소를 잘못 잡지 않는다", () => {
    for (const path of [
      "/",
      "/courses/first-deploy-vibecoding",
      "/free/watch",
      "/admin",
      "/my/a/b/c",
      "/notmy/a/b",
    ]) {
      expect(parseLessonPath(path), path).toBeNull();
    }
  });

  it("끝에 슬래시가 붙어도 같게 본다", () => {
    expect(parseLessonPath("/my/course-1/lesson-1/")).toEqual({
      courseSlug: "course-1",
      lessonId: "lesson-1",
    });
  });
});

describe("차단 응답", () => {
  it("403을 돌려준다", () => {
    // Next 15.5의 forbidden()은 404를 주기 때문에 직접 만든다.
    expect(forbiddenLessonResponse().status).toBe(403);
  });

  it("사람이 읽을 수 있는 한국어 안내를 담는다", async () => {
    const text = await forbiddenLessonResponse().text();
    expect(text).toContain("아직 수강 중인 강의가 아닙니다");
    expect(text).toContain("무료 1강 신청하기");
    expect(text).toContain('lang="ko"');
  });

  it("캐시하지 않는다", () => {
    // 사람마다 다른 응답이다. 중간에 캐시되면 남의 차단 화면이 다른 사람에게 간다.
    expect(forbiddenLessonResponse().headers.get("cache-control")).toBe("no-store");
  });

  it("검색 결과에 노출되지 않게 한다", async () => {
    const text = await forbiddenLessonResponse().text();
    expect(text).toContain('name="robots" content="noindex"');
  });
});
