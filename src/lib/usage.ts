import { getSupabase } from "./supabase";

export type UsageCallback = (data: {
  provider: string;
  model: string;
  operation: "structure" | "answer";
  input_tokens: number;
  output_tokens: number;
}) => void;

/** 팀 ID에 묶인 fire-and-forget 사용량 기록 콜백을 반환한다. */
export function makeUsageCallback(teamId: string): UsageCallback {
  return (data) => {
    void getSupabase()
      .from("api_usage")
      .insert({ team_id: teamId, ...data })
      .then(({ error }) => {
        if (error) console.warn("[usage] 기록 실패:", error.message);
      });
  };
}

export type UsageSummaryEntry = {
  teamId: string;
  teamSlug: string;
  teamName: string;
  callCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
};

/** 이번 달 팀별 사용량 집계를 반환한다. */
export async function getMonthlyUsageSummary(): Promise<{
  month: string;
  byTeam: UsageSummaryEntry[];
}> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data, error } = await getSupabase()
    .from("api_usage")
    .select("team_id, input_tokens, output_tokens, teams(slug, name)")
    .gte("created_at", monthStart);

  if (error) throw new Error(`사용량 조회 실패: ${error.message}`);

  const map = new Map<string, UsageSummaryEntry>();
  for (const row of (data ?? []) as Array<{
    team_id: string;
    input_tokens: number;
    output_tokens: number;
    teams: { slug: string; name: string };
  }>) {
    if (!map.has(row.team_id)) {
      map.set(row.team_id, {
        teamId: row.team_id,
        teamSlug: row.teams.slug,
        teamName: row.teams.name,
        callCount: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
      });
    }
    const entry = map.get(row.team_id)!;
    entry.callCount += 1;
    entry.totalInputTokens += row.input_tokens;
    entry.totalOutputTokens += row.output_tokens;
  }

  return {
    month,
    byTeam: [...map.values()].sort((a, b) => a.teamSlug.localeCompare(b.teamSlug)),
  };
}
