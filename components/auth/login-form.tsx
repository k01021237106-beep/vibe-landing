"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { loginErrorMessage } from "@/lib/auth/login-error";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

/**
 * 카카오 로그인을 앞에 둔다. 타겟에 시니어가 포함되므로
 * 이메일과 비밀번호를 새로 만들게 하는 것 자체가 이탈 요인이다.
 *
 * 이메일은 폴백이다. 카카오 앱 설정이 늦어져도 로그인이 막히지 않게 한다.
 * 비밀번호 대신 링크를 보낸다 — 외울 것이 없다.
 *
 * 카카오 버튼은 `NEXT_PUBLIC_KAKAO_LOGIN_ENABLED=1`일 때만 나온다.
 * 비즈 앱 전환 전에는 눌러도 KOE205로 막히는데, 오류가 나는 버튼은
 * 없느니만 못하다. 그럴 때는 이메일 로그인이 유일한 길이므로
 * 안내 문구를 붙여 첫 화면으로 올린다. (docs/SUPABASE.md 참고)
 */
export function LoginForm() {
  const kakaoEnabled = publicEnv.kakaoLoginEnabled;
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [email, setEmail] = useState("");

  // 로그인 후 돌아갈 곳. 우리 사이트 안의 경로만 허용한다.
  const rawNext = searchParams.get("next") ?? "/my";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/my";

  const callbackUrl = (path: string) =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(path)}`;

  async function signInWithKakao() {
    setStatus({ kind: "working" });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: callbackUrl(next) },
    });
    if (error) {
      setStatus({
        kind: "error",
        message: "카카오 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
    }
    // 성공하면 카카오 화면으로 넘어가므로 여기서 더 할 일이 없다.
  }

  async function sendEmailLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "working" });

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl(next) },
    });

    if (error) {
      // 원인마다 해야 할 일이 다르다. 그래서 다르게 말한다 (lib/auth/login-error.ts)
      setStatus({ kind: "error", message: loginErrorMessage(error) });
      return;
    }
    setStatus({ kind: "sent", email });
  }

  const working = status.kind === "working";

  if (status.kind === "sent") {
    return (
      <div className="rounded border-2 border-fg bg-surface p-6">
        <h2 className="text-xl">메일을 보냈습니다</h2>
        <p className="mt-3 text-base leading-relaxed text-muted">
          <strong className="font-medium text-fg">{status.email}</strong> 으로 로그인 링크를
          보냈습니다. 메일함을 열어 링크를 눌러 주세요.
        </p>
        <p className="mt-3 text-base leading-relaxed text-muted">
          메일이 보이지 않으면 스팸함도 확인해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      {kakaoEnabled ? (
        <>
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={signInWithKakao}
            disabled={working}
          >
            카카오로 3초 만에 시작하기
          </Button>
          <p className="mt-3 text-base text-muted">
            새로 만들 것도, 외울 것도 없습니다.
          </p>

          <div className="my-8 flex items-center gap-4" role="separator">
            <span className="h-px flex-1 bg-line" />
            <span className="text-base text-muted">또는</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      ) : null}

      <form onSubmit={sendEmailLink} noValidate>
        <label htmlFor="email" className="block text-base font-medium text-fg">
          {kakaoEnabled ? "이메일로 받기" : "이메일 주소"}
        </label>
        {kakaoEnabled ? null : (
          <p className="mt-2 text-base leading-relaxed text-muted">
            비밀번호는 없습니다. 적어 주신 주소로 로그인 링크를 보내 드립니다.
          </p>
        )}
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="mail@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 h-14 w-full rounded border-2 border-line bg-bg px-4 text-base text-fg placeholder:text-muted/60 focus:border-fg"
        />
        {/* 카카오가 없으면 이것이 유일한 길이다. 보조 버튼처럼 보이면 안 된다. */}
        <Button
          type="submit"
          size="lg"
          variant={kakaoEnabled ? "outline" : "primary"}
          className="mt-3 w-full"
          disabled={working || email.length === 0}
        >
          로그인 링크 받기
        </Button>
      </form>

      {status.kind === "error" ? (
        <p role="alert" className="mt-4 text-base leading-relaxed text-fg">
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
