/**
 * `lessons.vimeo_id`에 적힌 값을 재생에 쓸 수 있는 형태로 푼다.
 *
 * 왜 그냥 숫자만 받지 않나 —
 * Vimeo에서 영상을 **비공개**로 두면 주소에 번호 말고 **보안 문자열**이 하나 더 붙는다.
 *   https://vimeo.com/123456789/abcdef1234
 *                     ^번호      ^보안 문자열
 * 이때 재생 주소에 `h=abcdef1234`를 함께 넘기지 않으면 화면이 비어 버린다.
 * 번호만 저장해 두면 "설정은 다 했는데 영상만 안 나온다"가 된다.
 *
 * 그래서 **Vimeo 화면에서 보이는 주소를 그대로 붙여넣어도** 되게 했다.
 * 운영자가 무엇을 떼고 무엇을 남길지 고민하지 않아야 한다.
 * 받아들이는 형태:
 *   123456789
 *   123456789/abcdef1234
 *   https://vimeo.com/123456789
 *   https://vimeo.com/123456789/abcdef1234
 *   https://player.vimeo.com/video/123456789?h=abcdef1234
 *
 * ⚠️ 보안 문자열은 비밀이 아니다. 페이지를 볼 수 있는 사람에게는 어차피 보인다.
 *    영상을 지키는 것은 Vimeo의 **도메인 제한**이다. (docs/DEPLOY.md)
 */
export type VimeoRef = { id: string; hash?: string };

/** 시드 데이터의 자리표시. 실제 값으로 바뀌기 전까지는 '준비 중'으로 보여 준다. */
export function isPlaceholderVimeoId(raw: string | null | undefined): boolean {
  return !raw || raw.trim().length === 0 || raw.trim().startsWith("TODO-");
}

export function parseVimeoRef(raw: string | null | undefined): VimeoRef | null {
  if (isPlaceholderVimeoId(raw)) return null;

  const value = (raw as string).trim();

  // player.vimeo.com/video/123456789?h=abcdef1234
  const playerMatch = value.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (playerMatch) {
    const hash = value.match(/[?&]h=([A-Za-z0-9]+)/)?.[1];
    return hash ? { id: playerMatch[1], hash } : { id: playerMatch[1] };
  }

  // vimeo.com/123456789 또는 vimeo.com/123456789/abcdef1234
  const linkMatch = value.match(/vimeo\.com\/(\d+)(?:\/([A-Za-z0-9]+))?/);
  if (linkMatch) {
    return linkMatch[2] ? { id: linkMatch[1], hash: linkMatch[2] } : { id: linkMatch[1] };
  }

  // 123456789 또는 123456789/abcdef1234
  const bareMatch = value.match(/^(\d+)(?:\/([A-Za-z0-9]+))?$/);
  if (bareMatch) {
    return bareMatch[2] ? { id: bareMatch[1], hash: bareMatch[2] } : { id: bareMatch[1] };
  }

  // 알아볼 수 없는 값. 깨진 화면을 보여 주느니 '준비 중'으로 둔다.
  return null;
}

/** 재생 주소를 만든다. `dnt=1`은 Vimeo에 추적 쿠키를 심지 말라는 뜻이다. */
export function vimeoEmbedUrl(ref: VimeoRef): string {
  const params = new URLSearchParams({
    dnt: "1",
    title: "0",
    byline: "0",
    portrait: "0",
  });
  if (ref.hash) params.set("h", ref.hash);
  return `https://player.vimeo.com/video/${ref.id}?${params.toString()}`;
}
