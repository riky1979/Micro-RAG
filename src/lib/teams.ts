import { hashPasscode } from "./auth";
import { conflict, notFound } from "./errors";
import { getSupabase } from "./supabase";
import type { Team } from "./types";

const PUBLIC_COLUMNS = "id, slug, name, created_at";

/** slug로 팀을 조회한다. 없으면 null. 패스코드 해시는 노출하지 않는다. */
export async function getTeamBySlug(slug: string): Promise<Team | null> {
  const { data, error } = await getSupabase()
    .from("teams")
    .select(PUBLIC_COLUMNS)
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

export interface TeamSecrets {
  operator_passcode_hash: string | null;
  member_passcode_hash: string | null;
}

/** 인증 검증용. 패스코드 해시만 반환한다. */
export async function getTeamSecrets(slug: string): Promise<TeamSecrets | null> {
  const { data, error } = await getSupabase()
    .from("teams")
    .select("operator_passcode_hash, member_passcode_hash")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`팀 보안 조회 실패: ${error.message}`);
  return (data as TeamSecrets | null) ?? null;
}

/** 새 팀을 생성한다. 같은 slug가 이미 있으면 409. */
export async function createTeam(
  slug: string,
  name: string,
  operatorPasscode: string,
  memberPasscode: string,
): Promise<Team> {
  if (await getTeamBySlug(slug)) {
    throw conflict(`'${slug}' 팀 식별자는 이미 사용 중입니다.`);
  }

  const [operator_passcode_hash, member_passcode_hash] = await Promise.all([
    hashPasscode(operatorPasscode),
    hashPasscode(memberPasscode),
  ]);

  const { data, error } = await getSupabase()
    .from("teams")
    .insert({ slug, name, operator_passcode_hash, member_passcode_hash })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error) throw new Error(`팀 생성 실패: ${error.message}`);
  return data as Team;
}
