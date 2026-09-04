import { Eyebrow, Section, SectionLead, SectionTitle } from "@/components/landing/section";

/*
 * TODO: 실제 수강생 결과물 화면을 넣는다.
 *       지금은 글로만 설명한다 — 가짜 화면을 만들어 붙이면 광고에 어긋난다.
 */
const outcomes = [
  {
    title: "남에게 보낼 수 있는 주소",
    body: "내 컴퓨터에만 있는 파일이 아니라, 카카오톡으로 보내면 상대가 바로 열어 보는 인터넷 주소가 생깁니다.",
  },
  {
    title: "휴대폰에서도 제대로 보이는 화면",
    body: "글씨가 잘리거나 옆으로 밀리지 않습니다. 컴퓨터에서도 휴대폰에서도 읽을 수 있게 만듭니다.",
  },
  {
    title: "내가 직접 고칠 수 있는 상태",
    body: "강의가 끝나도 남에게 부탁하지 않습니다. 글을 바꾸고 사진을 갈아 끼우는 일을 혼자 하시게 됩니다.",
  },
];

export function Outcome() {
  return (
    <Section id="outcome" tone="cream">
      <Eyebrow>강의가 끝나면</Eyebrow>
      <SectionTitle>
        손에 남는 것은
        <br />
        지식이 아니라 서비스입니다
      </SectionTitle>
      <SectionLead>
        다 듣고 나서 &ldquo;배우긴 했는데&rdquo;로 끝나지 않게 만들었습니다. 마지막
        시간이 끝나면 주소 하나가 남습니다.
      </SectionLead>

      <ul className="mt-14 grid gap-10 sm:grid-cols-3">
        {outcomes.map((item) => (
          <li key={item.title}>
            <span aria-hidden="true" className="block h-1 w-12 bg-accent" />
            <h3 className="mt-5 text-xl leading-snug sm:text-2xl">{item.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-muted">{item.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
