"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }
      router.push("/admin");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface-raised p-8 shadow-lg">
        <h1 className="mb-1 text-xl font-extrabold text-ink">어드민 로그인</h1>
        <p className="mb-6 text-sm text-ink-soft">관리자 비밀키를 입력하세요.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="비밀키"
            autoFocus
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none placeholder:text-ink-soft/60 focus:border-accent"
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy || !secret}
            className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-60"
          >
            {busy ? "확인 중…" : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
