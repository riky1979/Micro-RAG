import { CreateTeamForm } from "@/components/CreateTeamForm";

const examples = [
  { from: "주입", text: "이번 주 합주 토요일 3시 사당 연습실 A룸으로 변경", tone: "ink" },
  { from: "주입", text: "오늘 뒷풀이 12만원, 6명 n분의1 정산", tone: "ink" },
  { from: "AI", text: "이번 주는 토요일 오후 3시 사당 연습실 A룸이에요. 뒷풀이는 1인당 2만원!", tone: "accent" },
];

export default function Home() {
  return (
    <main className="min-h-dvh">
      <div className="mx-auto grid max-w-6xl gap-16 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
        <section>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface-raised px-3 py-1 text-xs font-semibold tracking-wide text-ink-soft">
            <span className="size-1.5 rounded-full bg-accent" />
            Micro-RAG · 소규모 모임 전용 데이터 주입기
          </p>
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-ink break-keep sm:text-6xl">
            우리 모임의 사소한 데이터를,
            <br />
            <span className="text-accent">AI의 머릿속</span>으로.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft break-keep">
            회비 현황, 합주 일정, 창고 재고처럼 AI가 절대 모르는
            &lsquo;극도로 사적인 실시간 데이터&rsquo;. 한 줄 툭 던지면 1초 만에
            학습하고, 멤버 누구나 물어볼 수 있어요.
          </p>

          <div className="mt-10 space-y-2.5">
            {examples.map((ex, i) => (
              <div
                key={i}
                className={`flex max-w-md gap-3 rounded-2xl border px-4 py-3 text-sm ${
                  ex.tone === "accent"
                    ? "border-transparent bg-accent text-white"
                    : "border-line bg-surface-raised text-ink"
                } ${ex.from === "AI" ? "ml-auto" : ""}`}
              >
                <span
                  className={`shrink-0 text-xs font-bold ${
                    ex.tone === "accent" ? "text-white/70" : "text-accent"
                  }`}
                >
                  {ex.from}
                </span>
                <span className="leading-relaxed">{ex.text}</span>
              </div>
            ))}
          </div>
        </section>

        <CreateTeamForm />
      </div>
    </main>
  );
}
