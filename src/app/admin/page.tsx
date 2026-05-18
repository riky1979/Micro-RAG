import { AdminTeamTable } from "@/components/AdminTeamTable";
import { getEnv } from "@/lib/config";
import { listAllTeams } from "@/lib/teams";

export default async function AdminPage() {
  const [teams, env] = await Promise.all([listAllTeams(), Promise.resolve(getEnv())]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-8 flex items-center justify-between">
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
    </div>
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
