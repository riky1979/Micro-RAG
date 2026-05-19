import { AdminTeamTable } from "@/components/AdminTeamTable";
import { getEnv } from "@/lib/config";
import { listAllTeams } from "@/lib/teams";
import { getMonthlyUsageSummary, type UsageSummaryEntry } from "@/lib/usage";

export default async function AdminPage() {
  const [teams, env, usage] = await Promise.all([
    listAllTeams(),
    Promise.resolve(getEnv()),
    getMonthlyUsageSummary().catch(() => null),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">어드민 — 모델 관리</h1>
          <p className="mt-1 text-sm text-ink-soft">팀별 LLM 프로바이더와 모델을 설정합니다.</p>
        </div>
        <LogoutButton />
      </div>

      <AdminTeamTable
        teams={teams}
        globalProvider={env.DEFAULT_LLM_PROVIDER}
        globalAnthropicModel={env.ANTHROPIC_MODEL}
        globalOpenaiModel={env.OPENAI_CHAT_MODEL}
      />

      <UsageSection usage={usage} />
    </div>
  );
}

function UsageSection({ usage }: { usage: { month: string; byTeam: UsageSummaryEntry[] } | null }) {
  if (!usage) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-ink">
        이번 달 사용량{" "}
        <span className="text-sm font-normal text-ink-soft">({usage.month})</span>
      </h2>

      {usage.byTeam.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-soft">
          이번 달 사용 기록이 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left text-ink-soft">
                <th className="px-4 py-3 font-medium">팀</th>
                <th className="px-4 py-3 text-right font-medium">호출 수</th>
                <th className="px-4 py-3 text-right font-medium">입력 토큰</th>
                <th className="px-4 py-3 text-right font-medium">출력 토큰</th>
                <th className="px-4 py-3 text-right font-medium">합계 토큰</th>
              </tr>
            </thead>
            <tbody>
              {usage.byTeam.map((entry) => (
                <tr key={entry.teamId} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-mono text-ink">{entry.teamSlug}</span>
                    <span className="ml-2 text-ink-soft">{entry.teamName}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">
                    {entry.callCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">
                    {entry.totalInputTokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">
                    {entry.totalOutputTokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-ink">
                    {(entry.totalInputTokens + entry.totalOutputTokens).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        const { cookies } = await import("next/headers");
        (await cookies()).delete("admin-token");
      }}
    >
      <button
        type="submit"
        className="rounded-xl border border-line px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
      >
        로그아웃
      </button>
    </form>
  );
}
