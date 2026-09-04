import { Eyebrow, Section, SectionLead, SectionTitle } from "@/components/landing/section";

/**
 * 페인 해소.
 *
 * 이 섹션이 세 번째에 오는 이유: 기능을 자랑하기 전에
 * "당신은 이번엔 안 막힌다"는 확신을 먼저 줘야 한다.
 * 타겟의 가장 큰 페인이 '시작 자체가 막힘'이기 때문이다.
 */
const blockers = [
  {
    blocker: "설치에서 막힌다",
    relief: "제 화면과 여러분 화면이 같게 만들었습니다",
    detail:
      "운영체제별로 화면이 다른 지점은 따로 찍었습니다. 눌러야 할 버튼을 하나씩 짚어 드립니다. 건너뛰는 단계가 없습니다.",
  },
  {
    blocker: "영어 화면이 나오면 덮는다",
    relief: "나오는 영어는 그때그때 우리말로 읽어 드립니다",
    detail:
      "영어를 공부할 필요는 없습니다. 이 화면에서 무엇을 누르면 되는지만 알면 됩니다.",
  },
  {
    blocker: "빨간 오류가 뜨면 무섭다",
    relief: "오류는 고장이 아니라 안내문입니다",
    detail:
      "자주 나오는 오류를 미리 만들어 놓고 같이 읽습니다. 처음 보는 오류를 만나도 AI에게 물어보는 방법을 익히게 됩니다.",
  },
  {
    blocker: "혼자 하다 결국 그만둔다",
    relief: "막히면 물어볼 곳이 있습니다",
    detail:
      "카카오톡 채널로 질문하실 수 있습니다. 어디까지 하셨는지 화면만 보내 주시면 됩니다.",
  },
];

export function PainRelief() {
  return (
    <Section id="pain-relief" tone="surface">
      <Eyebrow>막히는 곳은 이미 알고 있습니다</Eyebrow>
      <SectionTitle>이번에는 안 막힙니다</SectionTitle>
      <SectionLead>
        포기하게 되는 지점은 대부분 정해져 있습니다. 그 네 곳을 어떻게 넘는지 먼저
        보여 드립니다.
      </SectionLead>

      <dl className="mt-14">
        {blockers.map((item) => (
          <div
            key={item.blocker}
            className="border-t border-line py-8 sm:grid sm:grid-cols-[1fr_1.6fr] sm:gap-10"
          >
            <dt className="text-base text-muted line-through decoration-accent decoration-2">
              {item.blocker}
            </dt>
            <dd className="mt-3 sm:mt-0">
              <h3 className="text-xl leading-snug sm:text-2xl">{item.relief}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted">{item.detail}</p>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
