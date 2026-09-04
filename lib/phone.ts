/**
 * 연락처 정규화와 신청 내용 검사.
 *
 * 순수 함수만 둔다 — 데이터베이스도 쿠키도 건드리지 않는다.
 * 무료 신청은 사이트의 최우선 전환 지점이라 여기서 막히면 안 되고,
 * 그래서 테스트로 촘촘히 덮는다.
 */

/**
 * 사람이 적는 여러 형태를 하나로 모은다.
 *
 * 이 값이 `leads.phone`의 유일 키가 된다 — 같은 사람이 다른 형태로 다시 신청해도
 * 같은 값이 나와야 중복으로 인식된다.
 *
 * @returns 숫자만 남은 번호(01012345678). 휴대폰 번호가 아니면 null.
 */
export function normalizePhone(input: string): string | null {
  if (!input) return null;

  let digits = input.replace(/[^\d]/g, "");

  // +82 10-1234-5678 → 01012345678
  if (digits.startsWith("82")) {
    digits = `0${digits.slice(2)}`;
  }

  // 휴대폰은 010·011·016·017·018·019로 시작하고 전체 10~11자리다.
  if (!/^01[016789]\d{7,8}$/.test(digits)) return null;

  return digits;
}

/** 화면에 보여 줄 때 끊어 준다. 01012345678 → 010-1234-5678 */
export function formatPhoneForDisplay(normalized: string): string {
  if (normalized.length === 11) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`;
  }
  if (normalized.length === 10) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  }
  return normalized;
}

export type ApplicationInput = {
  name: string;
  phone: string;
  consentPrivacy: boolean;
  consentMarketing?: boolean;
};

export type ApplicationErrors = Partial<
  Record<"name" | "phone" | "consentPrivacy" | "form", string>
>;

export type ValidationResult =
  | {
      ok: true;
      value: {
        name: string;
        phone: string;
        consentPrivacy: true;
        consentMarketing: boolean;
      };
    }
  | { ok: false; errors: ApplicationErrors };

const MAX_NAME_LENGTH = 100;

/**
 * 신청 내용을 검사한다.
 *
 * 오류 문구는 짧고 부드러운 한국어로 쓴다.
 * "유효하지 않은 입력입니다" 같은 말은 시니어 사용자를 위축시킨다.
 * 길이도 40자 이내로 둔다 — 375px 화면에서 세 줄로 늘어지면 읽기 어렵다.
 *
 * 틀린 곳이 여러 개면 한 번에 다 알려 준다. 하나씩 고치게 하면 지쳐서 떠난다.
 */
export function validateApplication(input: ApplicationInput): ValidationResult {
  const errors: ApplicationErrors = {};

  const name = input.name.trim();
  if (name.length === 0) {
    errors.name = "이름을 입력해 주세요.";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = "이름이 너무 깁니다.";
  }

  const phone = normalizePhone(input.phone);
  if (!phone) {
    errors.phone = "휴대폰 번호를 다시 확인해 주세요.";
  }

  if (!input.consentPrivacy) {
    errors.consentPrivacy = "개인정보 수집에 동의해 주세요.";
  }

  if (Object.keys(errors).length > 0 || !phone) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name,
      phone,
      consentPrivacy: true,
      consentMarketing: Boolean(input.consentMarketing),
    },
  };
}
