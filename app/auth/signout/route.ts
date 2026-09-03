import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * 로그아웃.
 *
 * GET이 아니라 POST로만 받는다. 링크를 클릭하거나 이미지가 로드되는 것만으로
 * 로그아웃되면 안 되기 때문이다.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", request.url), {
    status: 303,
  });
}
