import { beforeAll, describe, expect, it } from "vitest";

import { issueFreeAccessToken, verifyFreeAccessToken } from "@/lib/free-access";

/**
 * 무료 1강 접근권 검증.
 *
 * 무료 1강은 로그인 없이 이름·연락처만 받는다. 그래서 "신청한 사람"임을
 * 증명하는 수단이 서명된 쿠키 하나뿐이다. 이 서명이 뚫리면 신청 없이 영상을 본다.
 *
 * 아래는 전부 '막혀야 하는' 경우다.
 */
const SECRET = "테스트용-비밀키-절대-운영에-쓰지-않는다";

beforeAll(() => {
  process.env.LEAD_ACCESS_SECRET = SECRET;
});

describe("무료 1강 접근권", () => {
  it("신청한 사람의 표는 통과한다", () => {
    const token = issueFreeAccessToken("01012345678");
    expect(verifyFreeAccessToken(token)).toBe(true);
  });

  it("표가 없으면 막힌다", () => {
    expect(verifyFreeAccessToken(undefined)).toBe(false);
    expect(verifyFreeAccessToken("")).toBe(false);
  });

  it("아무 말이나 넣으면 막힌다", () => {
    expect(verifyFreeAccessToken("아무거나")).toBe(false);
    expect(verifyFreeAccessToken("v1.a.b.c")).toBe(false);
  });

  it("서명을 고치면 막힌다", () => {
    const token = issueFreeAccessToken("01012345678");
    const parts = token.split(".");
    parts[3] = "0".repeat(parts[3].length);
    expect(verifyFreeAccessToken(parts.join("."))).toBe(false);
  });

  it("만료 시각을 늘리면 막힌다 — 서명이 만료 시각까지 덮기 때문이다", () => {
    const token = issueFreeAccessToken("01012345678");
    const parts = token.split(".");
    parts[2] = String(Number(parts[2]) + 60 * 60 * 24 * 365);
    expect(verifyFreeAccessToken(parts.join("."))).toBe(false);
  });

  it("만료된 표는 막힌다", () => {
    const token = issueFreeAccessToken("01012345678", { ttlSeconds: -1 });
    expect(verifyFreeAccessToken(token)).toBe(false);
  });

  it("다른 비밀키로 만든 표는 막힌다", () => {
    const token = issueFreeAccessToken("01012345678");
    process.env.LEAD_ACCESS_SECRET = "다른-비밀키";
    expect(verifyFreeAccessToken(token)).toBe(false);
    process.env.LEAD_ACCESS_SECRET = SECRET;
  });

  it("쿠키에 연락처를 그대로 담지 않는다", () => {
    const token = issueFreeAccessToken("01012345678");
    expect(token).not.toContain("01012345678");
    expect(token).not.toContain("1234");
  });
});
