import { categoryMeta } from "@/lib/categories";
import type { StructuredDoc } from "@/lib/types";

/** 구조화 레코드를 사람이 읽기 좋은 카드로 렌더링한다. */
export function StructuredCard({
  doc,
  meta,
  onDelete,
}: {
  doc: StructuredDoc;
  meta?: string;
  onDelete?: () => void;
}) {
  const cat = categoryMeta[doc.category];
  const entities = Object.entries(doc.entities);

  return (
    <article className="rounded-2xl border border-line bg-surface-raised p-5">
      <div className="flex items-center gap-2">
        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${cat.badge}`}>
          {cat.label}
        </span>
        {doc.effective_date && (
          <span className="text-xs text-ink-soft">{doc.effective_date}</span>
        )}
        {meta && <span className="ml-auto text-xs text-ink-soft">{meta}</span>}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="문서 삭제"
            className={`text-xs font-semibold text-ink-soft transition hover:text-red-600 ${
              meta ? "" : "ml-auto"
            }`}
          >
            삭제
          </button>
        )}
      </div>

      <h3 className="mt-3 font-bold text-ink">{doc.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{doc.summary}</p>

      {entities.length > 0 && (
        <dl className="mt-3 flex flex-wrap gap-1.5">
          {entities.map(([key, value]) => (
            <div
              key={key}
              className="rounded-lg bg-surface px-2.5 py-1 text-xs text-ink"
            >
              <dt className="inline font-semibold text-ink-soft">{key}</dt>
              <dd className="inline"> · {value}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}
