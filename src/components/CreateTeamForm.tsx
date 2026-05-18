"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "create" | "enter";

export function CreateTeamForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("create");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanSlug = slug.trim().toLowerCase();
    if (!/^[a-z0-9-]{2,40}$/.test(cleanSlug)) {
      setError("팀 식별자는 영소문자·숫자·하이픈 2자 이상이어야 합니다.");
      return;
    }

    if (mode === "enter") {
      router.push(`/${cleanSlug}`);
      return;
    }

    if (!name.trim()) {
      setError("팀 이름을 입력하세요.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: cleanSlug, name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "팀 생성에 실패했습니다.");
        return;
      }
      router.push(`/${cleanSlug}/inject`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-line bg-surface-raised p-7 shadow-[0_24px_48px_-24px_oklch(50%_0.05_60_/_0.35)]">
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-surface p-1">
        {(["create", "enter"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === m ? "bg-accent text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            {m === "create" ? "새 팀 만들기" : "기존 팀 입장"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">팀 식별자</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="orchestra-2026"
            autoComplete="off"
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none placeholder:text-ink-soft/60 focus:border-accent"
          />
          <span className="mt-1 block text-xs text-ink-soft">
            URL에 쓰이는 짧은 영문 이름이에요.
          </span>
        </label>

        {mode === "create" && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">팀 이름</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="아마추어 오케스트라"
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none placeholder:text-ink-soft/60 focus:border-accent"
            />
          </label>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-60"
        >
          {busy ? "처리 중…" : mode === "create" ? "팀 만들고 시작하기" : "입장하기"}
        </button>
      </form>
    </div>
  );
}
