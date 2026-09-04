import type { NextRequest } from "next/server";

/*
 * ⚠️ 이 파일에서는 `@/` 별칭을 쓰지 않는다. 상대 경로로 적는다.
 *
 * Vercel이 저장소 뿌리의 middleware.ts를 자기 방식으로 번들할 때
 * tsconfig의 `paths` 별칭을 풀지 못한다. 그러면 배포가 이렇게 끝난다:
 *   The Edge Function "middleware" is referencing unsupported modules:
 *     - __vc__ns__/0/middleware.js: @/lib/supabase/middleware
 * 빌드는 전부 성공한 뒤 출력물을 올리는 단계에서 실패하므로 알아채기 어렵다.
 */
import { updateSession } from "./lib/supabase/middleware";

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
