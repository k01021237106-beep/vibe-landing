import { describe, expect, it } from "vitest";

import { loginErrorMessage } from "./login-error";

describe("loginErrorMessage", () => {
  /*
   * 실제로 겪은 경우다. 로그에 찍힌 값 그대로 쓴다:
   *   error: "429: email rate limit exceeded"
   *   error_code: "over_email_send_rate_limit"
   * 이때 "주소를 확인하라"고 말하면 멀쩡한 주소를 고치게 만든다.
   */
  it("발송 한도에 걸리면 기다리라고 말한다 — 주소를 고치라고 하지 않는다", () => {
    const message = loginErrorMessage({
      status: 429,
      code: "over_email_send_rate_limit",
      message: "email rate limit exceeded",
    });
    expect(message).toContain("잠시 뒤");
    expect(message).not.toContain("주소를 다시 확인");
  });

  it("코드가 없어도 429면 한도로 본다", () => {
    expect(loginErrorMessage({ status: 429 })).toContain("잠시 뒤");
  });

  it("주소가 틀리면 주소를 고치라고 말한다", () => {
    expect(loginErrorMessage({ status: 400, code: "validation_failed" })).toBe(
      "메일 주소를 다시 확인해 주세요.",
    );
    expect(loginErrorMessage({ code: "email_address_invalid" })).toBe(
      "메일 주소를 다시 확인해 주세요.",
    );
  });

  it("모르는 오류는 다시 시도하라고만 말한다", () => {
    expect(loginErrorMessage({ status: 500 })).toBe(
      "메일을 보내지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
    );
    expect(loginErrorMessage({})).toBe("메일을 보내지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
  });

  /* 우리 쪽 사정을 손님에게 알려 주면 남용의 힌트가 된다. */
  it("한도의 구체적인 숫자를 노출하지 않는다", () => {
    const message = loginErrorMessage({ status: 429, code: "over_email_send_rate_limit" });
    expect(message).not.toMatch(/\d+\s*통/);
    expect(message).not.toContain("429");
  });
});
