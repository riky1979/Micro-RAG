import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "./config";

let cached: SupabaseClient | null = null;

/**
 * 서버 전용 Supabase 클라이언트 (service-role 키).
 * 절대 클라이언트 번들로 노출하지 말 것 — API route / 서버 코드에서만 사용.
 */
export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const env = getEnv();
  cached = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return cached;
}
