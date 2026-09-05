import { describe, expect, it } from "vitest";

import { checkTossKeyPair, checkTossKeyRole, classifyTossKey } from "./toss-keys.mjs";

describe("classifyTossKey", () => {
  it("모드와 종류와 연동 방식을 읽는다", () => {
    expect(classifyTossKey("test_gck_abc")).toEqual({
      role: "client",
      mode: "test",
      family: "widget",
    });
    expect(classifyTossKey("live_sk_abc")).toEqual({
      role: "secret",
      mode: "live",
      family: "window",
    });
  });

  /* 2026-09-05에 실제로 이 값이 TOSS_SECRET_KEY 자리에 들어 있었다. */
  it("토스가 아닌 키를 알아본다", () => {
    expect(classifyTossKey("sk-live-abcdef")).toEqual({
      role: null,
      mode: null,
      family: null,
    });
    expect(classifyTossKey("sk_live_abcdef")).toEqual({
      role: null,
      mode: null,
      family: null,
    });
    expect(classifyTossKey("")).toEqual({ role: null, mode: null, family: null });
  });
});

describe("checkTossKeyRole", () => {
  it("제자리에 있으면 아무 말도 하지 않는다", () => {
    expect(checkTossKeyRole("test_gck_abc", "client")).toBeNull();
    expect(checkTossKeyRole("test_gsk_abc", "secret")).toBeNull();
  });

  it("토스 키가 아니면 신고한다", () => {
    expect(checkTossKeyRole("sk-live-abc", "secret")).toContain("토스 키가 아닙니다");
  });

  /*
   * 가장 위험한 실수. 시크릿 키가 공개 변수에 들어가면 브라우저로 나가고,
   * 그러면 누구나 결제를 임의로 승인할 수 있게 된다.
   */
  it("시크릿 키가 공개 변수에 들어가면 폐기하라고 말한다", () => {
    const problem = checkTossKeyRole("test_gsk_abc", "client");
    expect(problem).toContain("브라우저로 나갑니다");
    expect(problem).toContain("폐기");
  });

  it("클라이언트 키가 시크릿 자리에 있으면 알려 준다", () => {
    expect(checkTossKeyRole("test_gck_abc", "secret")).toContain("Secret Key가 필요합니다");
  });
});

describe("checkTossKeyPair", () => {
  it("제대로 짝이 맞으면 문제가 없다", () => {
    const { problems, notes } = checkTossKeyPair({
      clientKey: "test_gck_abc",
      secretKey: "test_gsk_abc",
    });
    expect(problems).toEqual([]);
    expect(notes).toContain("둘 다 test 키");
  });

  /*
   * 오늘 걸린 함정이다. 결제위젯 클라이언트 키(gck) 옆에
   * 결제창(일반) 승인 키(sk)를 넣으면 결제창은 열리는데 승인에서 실패한다.
   * 화면만 봐서는 원인을 알 수 없다.
   */
  it("gck 옆에 sk를 넣으면 잡는다", () => {
    const { problems } = checkTossKeyPair({
      clientKey: "test_gck_abc",
      secretKey: "test_sk_abc",
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("연동 방식이 다릅니다");
    expect(problems[0]).toContain("test_gsk_");
  });

  it("ck 옆에 gsk를 넣어도 잡는다", () => {
    const { problems } = checkTossKeyPair({
      clientKey: "test_ck_abc",
      secretKey: "test_gsk_abc",
    });
    expect(problems[0]).toContain("연동 방식이 다릅니다");
  });

  it("테스트와 라이브를 섞으면 잡는다", () => {
    const { problems } = checkTossKeyPair({
      clientKey: "test_gck_abc",
      secretKey: "live_gsk_abc",
    });
    expect(problems.some((p) => p.includes("같은 쪽으로 맞추세요"))).toBe(true);
  });

  it("라이브 키 조합에는 실제 돈이 오간다고 경고한다", () => {
    const { notes } = checkTossKeyPair({
      clientKey: "live_gck_abc",
      secretKey: "live_gsk_abc",
    });
    expect(notes.some((n) => n.includes("실제 돈"))).toBe(true);
  });

  /* 모양을 못 알아본 키는 낱개 검사가 이미 신고했다. 두 번 말하지 않는다. */
  it("토스 키가 아니면 짝 검사는 조용히 넘어간다", () => {
    expect(
      checkTossKeyPair({ clientKey: "test_gck_abc", secretKey: "sk-live-abc" }).problems,
    ).toEqual([]);
  });

  it("키가 하나라도 없으면 짝을 따지지 않는다", () => {
    expect(checkTossKeyPair({ clientKey: "test_gck_abc" }).problems).toEqual([]);
    expect(checkTossKeyPair({}).problems).toEqual([]);
  });
});
