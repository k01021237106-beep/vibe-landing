/**
 * 수강권 없는 사람에게 돌려주는 403 응답.
 *
 * 왜 미들웨어에서 직접 HTML을 만드나 —
 * Next 15.5의 `forbidden()`은 페이지를 보여 주긴 하지만 상태 코드를 **404**로 돌려준다
 * (정적·동적 모두 확인함). 유료 콘텐츠 차단은 "없는 페이지"가 아니라
 * "권한이 없다"여야 하므로, 상태 코드를 우리가 직접 정한다.
 *
 * 화면은 일부러 단출하게 둔다. 자주 보일 페이지가 아니고,
 * 헤더·푸터·폰트를 끌어오지 않으면 그만큼 빨리 뜬다.
 * 색은 디자인 토큰과 같은 값을 쓴다 (app/globals.css).
 */
const HTML = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>아직 수강 중인 강의가 아닙니다 · 첫배포</title>
<style>
  :root { color-scheme: light; }
  * { word-break: keep-all; overflow-wrap: break-word; box-sizing: border-box; }
  body {
    margin: 0; padding: 4rem 1.25rem;
    background: #FBF7F0; color: #14110F;
    font-family: -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo",
                 "Malgun Gothic", sans-serif;
    font-size: 18px; line-height: 1.7; letter-spacing: -0.01em;
  }
  main { max-width: 34rem; margin: 0 auto; }
  h1 { font-size: 1.75rem; line-height: 1.3; font-weight: 900; letter-spacing: -0.03em; margin: 0; }
  p { margin: 1.5rem 0 0; color: #5A524B; }
  .actions { margin-top: 2.5rem; display: flex; flex-wrap: wrap; gap: 0.75rem; }
  a {
    display: inline-flex; align-items: center; min-height: 48px;
    padding: 0 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 500;
  }
  .primary { background: #FF5A1F; color: #14110F; }
  .secondary { border: 2px solid #14110F; color: #14110F; }
</style>
</head>
<body>
  <main>
    <h1>아직 수강 중인 강의가 아닙니다</h1>
    <p>이 강의를 구매하시면 바로 보실 수 있습니다. 먼저 무료 1강을 보시고 결정하셔도 됩니다.</p>
    <div class="actions">
      <a class="primary" href="/free">무료 1강 신청하기</a>
      <a class="secondary" href="/courses">강의 둘러보기</a>
    </div>
    <p>이미 구매하셨는데 이 화면이 보인다면 알려 주세요. 바로 확인해 드리겠습니다.</p>
  </main>
</body>
</html>`;

export function forbiddenLessonResponse(): Response {
  return new Response(HTML, {
    status: 403,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // 사람마다 다른 응답이므로 절대 캐시하지 않는다.
      "cache-control": "no-store",
    },
  });
}
