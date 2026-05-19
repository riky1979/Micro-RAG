"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StructuredCard } from "@/components/StructuredCard";
import type { DocumentRecord, StructuredDoc } from "@/lib/types";

const PLACEHOLDER =
  "예) 이번 주 합주 토요일 오후 3시 사당 연습실 A룸으로 변경. 준비 곡 아리랑 앙상블 편곡.";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InjectConsole({
  teamSlug,
  initialDocs,
}: {
  teamSlug: string;
  initialDocs: DocumentRecord[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<StructuredDoc | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/documents/${id}?teamSlug=${encodeURIComponent(teamSlug)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "삭제에 실패했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = text.trim();
    if (!trimmed) {
      setError("주입할 내용을 입력하세요.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/inject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamSlug, text: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "주입에 실패했습니다.");
        return;
      }
      setLastResult(data.structured as StructuredDoc);
      setText("");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          데이터 주입
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          비정형 텍스트를 던지면 AI가 구조화해 우리 모임 지식창고에 저장해요.
        </p>

        <form onSubmit={handleSubmit} className="mt-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={4}
            className="w-full resize-y rounded-2xl border border-line bg-surface-raised p-4 text-ink outline-none placeholder:text-ink-soft/60 focus:border-accent"
          />
          {error && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-3 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-60"
          >
            {busy ? "AI가 구조화 중…" : "주입하기"}
          </button>
        </form>
      </section>

      {lastResult && (
        <section>
          <p className="mb-2 text-sm font-semibold text-emerald-700">
            ✓ 방금 학습했어요
          </p>
          <StructuredCard doc={lastResult} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold text-ink-soft">
          최근 주입 ({initialDocs.length})
        </h2>
        {initialDocs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
            아직 주입된 데이터가 없어요. 첫 메시지를 던져보세요.
          </p>
        ) : (
          <div className="space-y-3">
            {initialDocs.map((doc) => (
              <div key={doc.id} className="group relative">
                <StructuredCard doc={doc.structured} meta={formatDate(doc.created_at)} />
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="absolute right-3 top-3 hidden rounded-lg px-2 py-1 text-xs text-ink-soft/60 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 group-hover:flex"
                >
                  {deleting === doc.id ? "삭제 중…" : "삭제"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
