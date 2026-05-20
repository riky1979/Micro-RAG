"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  teamSlug,
  next,
}: {
  teamSlug: string;
  next: string;
}) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passcode) {
      setError("패스코드를 입력하세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamSlug, passcode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">패스코드</span>
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          autoFocus
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none placeholder:text-ink-soft/60 focus:border-accent"
        />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-60"
      >
        {busy ? "확인 중…" : "입장하기"}
      </button>
    </form>
  );
}
