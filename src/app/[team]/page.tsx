import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamHeader } from "@/components/TeamHeader";
import { getTeamBySlug } from "@/lib/teams";

export default async function TeamHub({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team } = await params;
  const found = await getTeamBySlug(team);
  if (!found) notFound();

  const cards = [
    {
      href: `/${team}/inject`,
      eyebrow: "운영진",
      title: "주입 콘솔",
      desc: "공지·영수증·일정을 텍스트로 툭 던지면 AI가 구조화해 저장해요.",
    },
    {
      href: `/${team}/ask`,
      eyebrow: "멤버",
      title: "질문하기",
      desc: "등록된 우리 모임 정보를 AI 비서에게 자연어로 물어보세요.",
    },
  ];

  return (
    <>
      <TeamHeader teamSlug={team} teamName={found.name} active={null} />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          {found.name}
        </h1>
        <p className="mt-2 text-ink-soft">우리 모임 전용 지식창고</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-line bg-surface-raised p-6 transition hover:border-accent hover:shadow-[0_18px_36px_-20px_oklch(50%_0.05_60_/_0.4)]"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-accent">
                {card.eyebrow}
              </p>
              <h2 className="mt-2 text-xl font-bold text-ink">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {card.desc}
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-accent transition group-hover:translate-x-0.5">
                들어가기 →
              </span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
