import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "내 강의실",
};

/*
 * Phase 2에서는 로그인 왕복과 프로필 자동 생성을 확인하는 최소 화면이다.
 * TODO(Phase 6): 구매한 강의 목록과 이어보기로 교체한다.
 */
export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/my");

  const supabase = await createClient();

  // RLS의 profiles_select_own 정책 때문에 본인 행만 돌아온다.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  // 아직 산 강의가 없으면 빈 배열이다. 역시 본인 것만 보인다.
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, status, granted_at, courses(slug, title)")
    .eq("status", "active");

  return (
    <section className="mx-auto max-w-3xl px-5 py-16 lg:py-24">
      <h1 className="text-3xl sm:text-4xl">내 강의실</h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        {profile?.display_name ?? user.email ?? "회원"}님, 반갑습니다.
      </p>

      {enrollments && enrollments.length > 0 ? (
        <ul className="mt-10">
          {enrollments.map((item) => (
            <li key={item.id} className="border-b border-line py-5">
              <h2 className="text-xl">{item.courses?.title ?? "강의"}</h2>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 rounded border-2 border-line bg-surface p-6">
          <h2 className="text-xl">아직 시작한 강의가 없습니다</h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            무료 1강부터 보시면 됩니다. 결제하지 않아도 됩니다.
          </p>
        </div>
      )}
    </section>
  );
}
