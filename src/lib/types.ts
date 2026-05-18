import { z } from "zod";

/** 주입 데이터 분류 — 동호회·소상공인 도메인에 맞춘 카테고리 */
export const CATEGORIES = [
  "schedule", // 일정·장소 변경
  "finance", // 회비·정산·예산
  "member", // 멤버 상태·역할·숙련도
  "resource", // 재고·자재·악보 등 자원
  "general", // 그 외 공지
] as const;

export const categorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof categorySchema>;

/** Claude 구조화 출력 스키마 */
export const structuredDocSchema = z.object({
  category: categorySchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  entities: z.record(z.string(), z.string()),
  effective_date: z.string().nullable(),
});
export type StructuredDoc = z.infer<typeof structuredDocSchema>;

/** API 요청 스키마 */
export const teamSlugSchema = z
  .string()
  .trim()
  .min(2, "팀 식별자는 2자 이상이어야 합니다")
  .max(40)
  .regex(/^[a-z0-9-]+$/, "팀 식별자는 영소문자·숫자·하이픈만 허용됩니다");

export const createTeamSchema = z.object({
  slug: teamSlugSchema,
  name: z.string().trim().min(1, "팀 이름을 입력하세요").max(80),
});
export type CreateTeamRequest = z.infer<typeof createTeamSchema>;

export const injectRequestSchema = z.object({
  teamSlug: teamSlugSchema,
  text: z.string().trim().min(1, "주입할 내용을 입력하세요").max(4000),
});
export type InjectRequest = z.infer<typeof injectRequestSchema>;

export const queryRequestSchema = z.object({
  teamSlug: teamSlugSchema,
  question: z.string().trim().min(1, "질문을 입력하세요").max(1000),
});
export type QueryRequest = z.infer<typeof queryRequestSchema>;

/** 도메인 엔티티 */
export interface Team {
  id: string;
  slug: string;
  name: string;
  created_at: string;
  llm_provider: string | null;
  llm_model: string | null;
}

export interface DocumentRecord {
  id: string;
  team_id: string;
  raw_input: string;
  category: Category;
  structured: StructuredDoc;
  content: string;
  created_at: string;
}

/** 질의 결과로 회수된 출처 문서 */
export interface RetrievedSource {
  id: string;
  content: string;
  category: Category;
  structured: StructuredDoc;
  distance: number;
}

export interface AnswerResult {
  answer: string;
  sources: RetrievedSource[];
}
