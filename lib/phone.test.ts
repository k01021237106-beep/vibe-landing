import { describe, expect, it } from "vitest";

import { formatPhoneForDisplay, normalizePhone, validateApplication } from "@/lib/phone";

describe("연락처 정규화", () => {
  it("여러 형태로 적어도 같은 값이 된다", () => {
    const same = [
      "01012345678",
      "010-1234-5678",
      "010 1234 5678",
      " 010-1234-5678 ",
      "+82 10-1234-5678",
      "+821012345678",
      "82-10-1234-5678",
    ];
    for (const input of same) {
      expect(normalizePhone(input), `입력: ${input}`).toBe("01012345678");
    }
  });

  it("국번이 다른 번호도 처리한다", () => {
    expect(normalizePhone("011-234-5678")).toBe("0112345678");
    expect(normalizePhone("010-123-4567")).toBe("0101234567");
  });

  it("휴대폰 번호가 아니면 null이다", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("1234")).toBeNull();
    expect(normalizePhone("02-123-4567")).toBeNull(); // 유선전화
    expect(normalizePhone("010123456789")).toBeNull(); // 너무 김
    expect(normalizePhone("abc")).toBeNull();
  });

  it("보여 줄 때는 읽기 좋게 끊어 준다", () => {
    expect(formatPhoneForDisplay("01012345678")).toBe("010-1234-5678");
    expect(formatPhoneForDisplay("0112345678")).toBe("011-234-5678");
  });
});

describe("신청 내용 검사", () => {
  const valid = { name: "홍길동", phone: "010-1234-5678", consentPrivacy: true };

  it("제대로 채우면 통과한다", () => {
    const result = validateApplication(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("홍길동");
      expect(result.value.phone).toBe("01012345678");
    }
  });

  it("이름이 없으면 이름 칸에 한국어로 알려 준다", () => {
    const result = validateApplication({ ...valid, name: "  " });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBe("이름을 입력해 주세요.");
      expect(result.errors.phone).toBeUndefined();
    }
  });

  it("연락처가 틀리면 연락처 칸에 알려 준다", () => {
    const result = validateApplication({ ...valid, phone: "1234" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.phone).toBe("휴대폰 번호를 다시 확인해 주세요.");
    }
  });

  it("개인정보 수집에 동의하지 않으면 막는다", () => {
    const result = validateApplication({ ...valid, consentPrivacy: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.consentPrivacy).toBe("개인정보 수집에 동의해 주세요.");
    }
  });

  it("여러 칸이 틀리면 한 번에 다 알려 준다", () => {
    const result = validateApplication({ name: "", phone: "x", consentPrivacy: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual([
        "consentPrivacy",
        "name",
        "phone",
      ]);
    }
  });

  it("이름이 지나치게 길면 막는다", () => {
    const result = validateApplication({ ...valid, name: "가".repeat(101) });
    expect(result.ok).toBe(false);
  });

  it("오류 문구는 짧게 유지한다 — 좁은 화면에서 어색하게 잘리지 않도록", () => {
    const messages = [
      validateApplication({ ...valid, name: "" }),
      validateApplication({ ...valid, phone: "x" }),
      validateApplication({ ...valid, consentPrivacy: false }),
    ].flatMap((r) => (r.ok ? [] : Object.values(r.errors)));

    expect(messages.length).toBe(3);
    for (const message of messages) {
      // 375px에서 18px 글씨 기준 한 줄에 대략 20자가 들어간다. 2줄을 넘지 않게 한다.
      expect(message.length, message).toBeLessThanOrEqual(40);
      // 한국어인지 (한글이 들어 있는지)
      expect(message).toMatch(/[가-힣]/);
    }
  });
});
