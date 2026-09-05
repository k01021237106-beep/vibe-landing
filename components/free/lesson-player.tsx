import { parseVimeoRef, vimeoEmbedUrl } from "@/lib/lessons/vimeo";

/**
 * 강의 영상 재생 자리.
 *
 * Vimeo ID는 서버에서 접근 자격을 확인한 뒤에만 이 컴포넌트로 넘어온다.
 * 클라이언트가 스스로 조회할 방법은 없다 — anon·authenticated는
 * lessons.vimeo_id에 컬럼 권한이 없다 (Phase 2).
 *
 * ⚠️ 영상 자체를 지키는 것은 Vimeo의 도메인 제한이다.
 *    iframe 주소는 페이지를 볼 수 있는 사람에게는 어차피 보인다.
 *    우리 도메인 밖에서는 재생되지 않도록 Vimeo에서 설정해야 한다. (Phase 6)
 */
export function LessonPlayer({
  vimeoId,
  title,
}: {
  vimeoId: string | null;
  title: string;
}) {
  /*
   * 비공개 영상은 번호 말고 보안 문자열이 하나 더 필요하다.
   * 저장된 값이 무엇이든(번호·주소 통째로) 여기서 푼다 (lib/lessons/vimeo.ts).
   * 알아볼 수 없으면 깨진 화면 대신 '준비 중'을 보여 준다.
   */
  const ref = parseVimeoRef(vimeoId);

  if (!ref) {
    return (
      <div className="flex aspect-video w-full items-center justify-center border-2 border-line bg-surface p-6">
        <div className="text-center">
          <p className="text-lg font-medium">영상을 준비하고 있습니다</p>
          <p className="mt-2 text-base leading-relaxed text-muted">
            준비가 끝나면 알려 드리겠습니다. 조금만 기다려 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden bg-ink">
      <iframe
        src={vimeoEmbedUrl(ref)}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}
