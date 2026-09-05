import { describe, expect, it } from "vitest";

import { isPlaceholderVimeoId, parseVimeoRef, vimeoEmbedUrl } from "./vimeo";

describe("parseVimeoRef", () => {
  it("번호만 있으면 그대로 쓴다", () => {
    expect(parseVimeoRef("123456789")).toEqual({ id: "123456789" });
  });

  /*
   * 비공개 영상의 핵심. 보안 문자열을 잃어버리면 화면이 비어 버리고,
   * "설정은 다 했는데 영상만 안 나온다"가 된다.
   */
  it("비공개 영상의 보안 문자열을 지킨다", () => {
    expect(parseVimeoRef("123456789/abcdef1234")).toEqual({
      id: "123456789",
      hash: "abcdef1234",
    });
  });

  it("Vimeo 화면의 주소를 그대로 붙여넣어도 된다", () => {
    expect(parseVimeoRef("https://vimeo.com/123456789")).toEqual({ id: "123456789" });
    expect(parseVimeoRef("https://vimeo.com/123456789/abcdef1234")).toEqual({
      id: "123456789",
      hash: "abcdef1234",
    });
    expect(parseVimeoRef("https://player.vimeo.com/video/123456789?h=abcdef1234")).toEqual({
      id: "123456789",
      hash: "abcdef1234",
    });
  });

  it("앞뒤 공백은 붙여넣기 사고이므로 봐준다", () => {
    expect(parseVimeoRef("  123456789/abcdef1234  ")).toEqual({
      id: "123456789",
      hash: "abcdef1234",
    });
  });

  it("자리표시와 빈 값은 재생하지 않는다", () => {
    expect(parseVimeoRef("TODO-VIMEO-ID-01")).toBeNull();
    expect(parseVimeoRef("")).toBeNull();
    expect(parseVimeoRef(null)).toBeNull();
    expect(parseVimeoRef("   ")).toBeNull();
  });

  /* 알아볼 수 없는 값으로 깨진 화면을 보여 주느니 '준비 중'이 낫다. */
  it("알아볼 수 없는 값은 재생하지 않는다", () => {
    expect(parseVimeoRef("영상주소")).toBeNull();
    expect(parseVimeoRef("https://youtube.com/watch?v=abc")).toBeNull();
  });
});

describe("vimeoEmbedUrl", () => {
  it("보안 문자열이 있으면 h로 넘긴다", () => {
    const url = vimeoEmbedUrl({ id: "123456789", hash: "abcdef1234" });
    expect(url).toContain("player.vimeo.com/video/123456789");
    expect(url).toContain("h=abcdef1234");
  });

  it("보안 문자열이 없으면 h를 넣지 않는다", () => {
    expect(vimeoEmbedUrl({ id: "123456789" })).not.toContain("h=");
  });

  /* 손님을 Vimeo의 추적 쿠키에 노출시키지 않는다 — 개인정보처리방침과도 맞아야 한다. */
  it("추적을 끈 채로 재생한다", () => {
    expect(vimeoEmbedUrl({ id: "123456789" })).toContain("dnt=1");
  });
});

describe("isPlaceholderVimeoId", () => {
  it("자리표시를 알아본다", () => {
    expect(isPlaceholderVimeoId("TODO-VIMEO-ID-03")).toBe(true);
    expect(isPlaceholderVimeoId("123456789")).toBe(false);
  });
});
