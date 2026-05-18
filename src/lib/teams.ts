import { conflict, notFound } from "./errors";
import { getSupabase } from "./supabase";
import type { Team } from "./types";

/** slug로 팀을 조회한다. 없으면 null. */
export async function getTeamBySlug(slug: string): Promise<Team | null> {
  const { data, error } = await getSupabase()
    .from("teams")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`팀 조회 실패: ${error.message}`);
  return (data as Team | null) ?? null;
}

/** 팀을 조회하되 없으면 404 에러를 던진다. */
export async function requireTeam(slug: string): Promise<Team> {
  const team = await getTeamBySlug(slug);
  if (!team) throw notFound(`'${slug}' 팀을 찾을 수 없습니다.`);
  return team;
}

/** 새 팀을 생성한다. 같은 slug가 이미 있으면 409. */
export async function createTeam(slug: string, name: string): Promise<Team> {
  if (await getTeamBySlug(slug)) {
    throw conflict(`'${slug}' 팀 식별자는 이미 사용 중입니다.`);
  }

  const { data, error } = await getSupabase()
    .from("teams")
    .insert({ slug, name })
    .select("*")
    .single();

  if (error) throw new Error(`팀 생성 실패: ${error.message}`);
  return data as Team;
}
