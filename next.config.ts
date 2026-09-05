import type { NextConfig } from "next";

/*
 * 카카오톡에 링크를 붙였을 때 미리보기 카드가 뜨게 하는 설정.
 *
 * 무슨 일이 있었나 —
 * Next 15는 메타데이터(제목·설명·공유 카드)를 `<head>`에 넣지 않고
 * 본문 뒤로 흘려보낸 다음, 브라우저의 자바스크립트가 `<head>`로 끌어올린다.
 * 화면이 빨리 뜨게 하는 장치이고, 사람에게는 아무 문제가 없다.
 *
 * 그런데 **자바스크립트를 실행하지 않는 미리보기 봇**은 원본 HTML만 읽는다.
 * 그 봇들에게는 `<head>`가 텅 빈 채로 보인다. 실제로 재 봤다 (배포된 사이트 기준):
 *
 *   페이스북·트위터·네이버 → `<head>` 안에 og 태그 10개, 제목·설명 있음
 *   카카오톡              → `<head>` 안에 og 태그 **0개**, 제목·설명 **없음**
 *
 * 우리 손님은 카카오톡으로 링크를 주고받는다. 그 카드가 비어 있으면
 * 공유될 때마다 강의 제목도, 가격도, 공유 카드 이미지도 보이지 않는다.
 *
 * Next는 "이 봇들에게는 스트리밍하지 말고 완성된 HTML을 줘라"는 목록을 갖고 있는데
 * (node_modules/next/dist/shared/lib/router/utils/html-bots.js)
 * 국내 서비스가 거의 없다. 그래서 여기서 목록을 다시 정한다.
 *
 * ⚠️ 이 값은 기본 목록에 **더해지는 게 아니라 통째로 대신한다.**
 *    그래서 기본 목록을 그대로 옮겨 적고 뒤에 국내 봇을 붙였다.
 *    Next를 올릴 때 위 파일의 목록이 바뀌었는지 확인하고 맞춰 준다.
 *
 * 봇에게는 응답이 조금 느려진다. 대신 카드가 제대로 나온다. 그 편이 낫다.
 */
const NEXT_DEFAULT_HTML_BOTS =
  "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|" +
  "yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|" +
  "Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|" +
  "LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight";

/**
 * 국내에서 링크 미리보기를 만드는 것들. 카카오톡이 가장 중요하다.
 *
 * 이름을 좁게 적는다 — `Line`처럼 짧은 낱말을 넣으면 "Online"·"Inline"이 든
 * 평범한 브라우저 UA까지 걸려서 사람에게도 대기 렌더링이 걸린다.
 * (라인의 미리보기 봇은 UA에 `line-poker`를 붙인다)
 */
const KOREAN_PREVIEW_BOTS = "kakaotalk-scrap|KAKAOTALK|kakaostory|Daum|NaverBot|line-poker";

const nextConfig: NextConfig = {
  htmlLimitedBots: new RegExp(`${NEXT_DEFAULT_HTML_BOTS}|${KOREAN_PREVIEW_BOTS}`, "i"),
};

export default nextConfig;
