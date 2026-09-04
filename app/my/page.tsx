import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { getMyEnrollments } from "@/lib/lessons/repository";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "내 강의실",
  robots: { index: false, follow: false },
};

export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/my");

  const supabase = await createClient();

  // RLS의 profiles_select_own 정책 때문에 본인 행만 돌아온다.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const enrollments = await getMyEnrollments();

  return (
    <section className="mx-auto max-w-4xl px-5 py-16 lg:py-24">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl">내 강의실</h1>
        {profile?.role === "admin" ? (
          <Link
            href="/admin"
            className="inline-flex min-h-12 items-center text-base text-muted underline decoration-line underline-offset-4 hover:text-fg"
          >
            관리자 화면
          </Link>
        ) : null}
      </div>

      <p className="mt-4 text-lg text-muted">
        {profile?.display_name ?? user.email ?? "회원"}님, 반갑습니다.
      </p>

      {enrollments.length > 0 ? (
        <ul className="mt-12">
          {enrollments.map((item) => (
            <li key={item.id} className="border-t-2 border-fg py-8">
              <h2 className="text-2xl leading-snug">{item.courses.title}</h2>
              {item.courses.subtitle ? (
                <p className="mt-3 text-base leading-relaxed text-muted">
                  {item.courses.subtitle}
                </p>
              ) : null}
              <div className="mt-6">
                <Button asChild size="md">
                  <Link href={`/my/${item.courses.slug}`}>이어서 보기</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-12 border-2 border-line bg-surface p-8">
          <h2 className="text-xl">아직 시작한 강의가 없습니다</h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            무료 1강부터 보시면 됩니다. 결제하지 않아도 됩니다.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="md">
              <Link href="/free">무료 1강 신청하기</Link>
            </Button>
            <Button asChild size="md" variant="outline">
              <Link href="/courses">강의 둘러보기</Link>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
