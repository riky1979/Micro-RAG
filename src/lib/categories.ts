import type { Category } from "./types";

/** 카테고리별 한국어 라벨 + 배지 스타일 (서버·클라이언트 공용 순수 데이터). */
export const categoryMeta: Record<Category, { label: string; badge: string }> = {
  schedule: { label: "일정", badge: "bg-blue-100 text-blue-700" },
  finance: { label: "회비", badge: "bg-emerald-100 text-emerald-700" },
  member: { label: "멤버", badge: "bg-violet-100 text-violet-700" },
  resource: { label: "자원", badge: "bg-cyan-100 text-cyan-700" },
  general: { label: "공지", badge: "bg-stone-200 text-stone-700" },
};
