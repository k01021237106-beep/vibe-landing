import { describe, expect, it } from "vitest";

import { callbackErrorMessage, loginErrorMessage } from "./login-error";

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

/*
 * 2026-09-07에 실제로 겪은 일이다.
 *
 * 지메일이 제목 같은 메일을 한 대화로 묶고 접어 두는 바람에,
 * 접힌 옛 메일의 링크(이미 한 번 쓴 링크)를 눌렀다.
 * 교환이 실패해 /login?error=exchange_failed 로 돌아왔는데
 * 폼이 그 값을 읽지 않아 **빈 로그인 화면**만 보였다.
 *
 * 그때 우리는 살아 있던 옛 세션 덕에 /my로 튕겨서 성공한 줄 알았다.
 * 세션이 없는 손님이었다면 아무 설명 없이 같은 링크를 계속 눌렀을 것이다.
 */
describe("callbackErrorMessage", () => {
  it("오류가 없으면 아무 말도 하지 않는다", () => {
    expect(callbackErrorMessage(null)).toBeNull();
    expect(callbackErrorMessage("")).toBeNull();
  });

  it("이미 쓴 링크라는 것과, 최근 메일을 열라는 것을 함께 알려 준다", () => {
    const message = callbackErrorMessage("exchange_failed");
    expect(message).toContain("이미 사용");
    // 지메일이 옛 메일을 접어 두는 탓에 생기는 실수라, 이 한 줄이 실제로 문제를 푼다
    expect(message).toContain("가장 최근");
  });

  /* 어느 경우든 손님이 할 일은 하나 — 새 링크를 받는 것. 그걸 반드시 말한다. */
  it("모든 경우에 다음에 할 일을 말한다", () => {
    for (const code of ["exchange_failed", "missing_code", "무슨값인지모름"]) {
      expect(callbackErrorMessage(code), code).toContain("새 링크를 받아");
    }
  });

  it("모르는 값이 와도 빈 화면에 두지 않는다", () => {
    expect(callbackErrorMessage("weird_code")).not.toBeNull();
  });

  /* 손님은 우리 코드 이름을 모른다. 그대로 보여 주면 겁만 준다. */
  it("내부 코드 이름을 그대로 노출하지 않는다", () => {
    for (const code of ["exchange_failed", "missing_code"]) {
      expect(callbackErrorMessage(code)).not.toContain(code);
    }
  });
});
