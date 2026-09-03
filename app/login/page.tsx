import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "로그인",
  description: "카카오로 간편하게 로그인하고 내 강의실로 들어가세요.",
};

export default async function LoginPage() {
  // 이미 로그인했으면 로그인 화면을 다시 보여 줄 이유가 없다.
  const user = await getCurrentUser();
  if (user) redirect("/my");

  return (
    <section className="mx-auto max-w-md px-5 py-16 lg:py-24">
      <h1 className="text-3xl sm:text-4xl">로그인</h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        신청하신 강의를 이어서 보시려면 로그인해 주세요.
      </p>

      <div className="mt-10">
        {/* useSearchParams를 쓰므로 Suspense로 감싼다 */}
        <Suspense fallback={<div className="h-14 rounded bg-surface" />}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
