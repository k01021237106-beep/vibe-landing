import { Eyebrow, Section, SectionTitle } from "@/components/landing/section";

/*
 * ⚠️ TODO: 강사 소개가 아직 실제 내용이 아니다. 오픈 전 반드시 교체한다.
 *
 * 아래 문구는 "이런 톤으로 쓰면 된다"는 예시일 뿐이다.
 * 경력·이력을 사실과 다르게 두고 판매를 시작하면 표시광고법 문제가 된다.
 * 사진도 아직 없다 — 준비되면 이 자리에 넣는다.
 */
export function Instructor() {
  return (
    <Section id="instructor" tone="surface">
      <Eyebrow>가르치는 사람</Eyebrow>
      <SectionTitle>
        저도 개발자가
        <br />
        아니었습니다
      </SectionTitle>

      <div className="mt-12 max-w-2xl">
        <p className="text-lg leading-relaxed">
          비개발자로 시작해 AI와 함께 직접 만들고 배포하며 배웠습니다. 그 과정에서
          어디서 막히는지, 왜 그 지점에서 그만두게 되는지를 몸으로 겪었습니다.
        </p>
        <p className="mt-5 text-lg leading-relaxed">
          그래서 이 강의는 &ldquo;이 정도는 아시죠&rdquo;라고 넘어가는 곳이 없습니다.
          제가 막혔던 곳마다 화면을 멈추고 짚습니다.
        </p>

        <p className="mt-8 text-base text-muted">
          {/* TODO: 실제 이름·이력·사진으로 교체 */}
          강사 소개는 준비 중입니다. 오픈 전 실제 내용으로 채워집니다.
        </p>
      </div>
    </Section>
  );
}
