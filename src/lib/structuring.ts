import type { StructuredDoc } from "./types";

/**
 * 구조화 레코드를 임베딩·검색 대상 텍스트 한 덩어리로 평탄화한다.
 * title + summary + entity(key-value)를 합쳐 검색 키워드 적중률을 높인다.
 * title과 summary가 동일하면 중복을 제거한다.
 */
export function buildContent(doc: StructuredDoc): string {
  const title = doc.title.trim();
  const summary = doc.summary.trim();

  const lines: string[] = [];
  if (title) lines.push(title);
  if (summary && summary !== title) lines.push(summary);

  const entityPairs = Object.entries(doc.entities)
    .map(([key, value]) => `${key.trim()}: ${String(value).trim()}`)
    .filter((pair) => pair !== ": ");
  if (entityPairs.length) lines.push(entityPairs.join(", "));

  return lines.join("\n").trim();
}
