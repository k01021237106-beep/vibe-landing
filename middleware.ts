import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 정적 파일과 이미지는 세션 갱신이 필요 없다.
     * 특히 폰트 서브셋이 수백 개라 여기서 걸러 주지 않으면 헛일이 많아진다.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
