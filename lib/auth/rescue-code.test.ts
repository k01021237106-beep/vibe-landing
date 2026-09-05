import { describe, expect, it } from "vitest";

import { authCodeToRescue } from "./rescue-code";

const at = (href: string) => authCodeToRescue(new URL(href, "https://example.com"));

describe("authCodeToRescue", () => {
  it("첫 화면에 떨어진 로그인 코드를 구해 낸다", () => {
    expect(at("/?code=abc123")).toBe("abc123");
  });

  it("코드가 없으면 아무것도 하지 않는다", () => {
    expect(at("/")).toBeNull();
    expect(at("/?next=/my")).toBeNull();
  });

  it("빈 코드는 코드가 아니다", () => {
    expect(at("/?code=")).toBeNull();
  });

  /*
   * 여기가 이 함수의 존재 이유다.
   * `code`는 결제 실패 화면에서 카드사 거절 코드로도 쓴다.
   * 넓게 잡으면 돈이 걸린 화면을 로그인으로 끌고 가 버린다.
   */
  it("결제 실패 화면의 code는 건드리지 않는다", () => {
    expect(at("/checkout/fail?slug=x&code=REJECT_CARD_COMPANY")).toBeNull();
  });

  it("첫 화면이 아니면 어디서도 구하지 않는다", () => {
    expect(at("/login?code=abc123")).toBeNull();
    expect(at("/free?code=abc123")).toBeNull();
    expect(at("/auth/callback?code=abc123")).toBeNull(); // 콜백은 스스로 처리한다
  });

  it("첫 화면을 흉내 낸 경로에는 속지 않는다", () => {
    expect(at("/index?code=abc123")).toBeNull();
    expect(at("/ko/?code=abc123")).toBeNull();
  });
});
