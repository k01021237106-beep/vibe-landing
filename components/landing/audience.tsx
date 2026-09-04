import { Eyebrow, Section, SectionTitle } from "@/components/landing/section";

/*
 * TODO: 실제 수강생이 모이면 여기 문구를 그분들이 쓴 표현으로 바꾼다.
 *       지금은 인터뷰에서 나온 페인을 그대로 옮겼다.
 */
const audiences = [
  {
    title: "만들고 싶은 게 있는데 어디서 시작할지 모르겠다",
    body: "머릿속에는 있는데 첫 줄을 어디에 써야 할지 몰라 미뤄 두셨다면, 그 첫 줄부터 같이 씁니다.",
  },
  {
    title: "설치하다가 포기한 적이 있다",
    body: "검색해서 나온 글을 따라 했는데 제 화면과 달랐던 경험. 여기서는 화면이 같습니다.",
  },
  {
    title: "영어로 된 화면만 보면 덮게 된다",
    body: "영어를 몰라도 됩니다. 나오는 영어는 그때그때 우리말로 옮겨 읽어 드립니다.",
  },
  {
    title: "AI가 좋다는데 나한테는 먼 얘기 같다",
    body: "AI에게 무엇을 어떻게 말하면 되는지, 문장 몇 개만 익히면 충분합니다.",
  },
];

export function Audience() {
  return (
    <Section id="audience" tone="cream">
      <Eyebrow>이런 분을 위한 강의입니다</Eyebrow>
      <SectionTitle>
        지금 못 하는 게
        <br />
        정상입니다
      </SectionTitle>

      <ul className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2">
        {audiences.map((item, index) => (
          <li key={item.title} className="border-t-2 border-fg pt-6">
            <span
              aria-hidden="true"
              className="font-mono text-sm text-muted"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 text-xl leading-snug sm:text-2xl">{item.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-muted">{item.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
