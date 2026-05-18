"use client";

import { useEffect, useRef, useState } from "react";
import { categoryMeta } from "@/lib/categories";
import type { RetrievedSource } from "@/lib/types";

type ChatMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; sources: RetrievedSource[] }
  | { role: "error"; text: string };

const SUGGESTIONS = [
  "이번 주 어디서 모여?",
  "회비 정산 어떻게 됐어?",
  "내가 준비할 거 뭐 있어?",
];

export function AskChat({ teamSlug }: { teamSlug: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || busy) return;

    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamSlug, question: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "error", text: data.error ?? "답변을 가져오지 못했습니다." },
        ]);
        return;
      }
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.answer, sources: data.sources ?? [] },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "error", text: "네트워크 오류가 발생했습니다." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-57px)] flex-col">
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
        {messages.length === 0 ? (
          <div className="pt-10">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              무엇이든 물어보세요
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              우리 모임이 등록한 정보를 바탕으로 AI 비서가 답해드려요.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-line bg-surface-raised px-3.5 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {busy && (
              <p className="text-sm text-ink-soft">AI 비서가 찾아보는 중…</p>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 border-t border-line bg-surface/85 backdrop-blur">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="mx-auto flex max-w-3xl gap-2 px-5 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="질문을 입력하세요"
            className="flex-1 rounded-xl border border-line bg-surface-raised px-4 py-3 text-ink outline-none placeholder:text-ink-soft/60 focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-50"
          >
            물어보기
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === "user") {
    return (
      <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm leading-relaxed text-white">
        {msg.text}
      </div>
    );
  }

  if (msg.role === "error") {
    return (
      <div className="max-w-[80%] rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
        {msg.text}
      </div>
    );
  }

  return (
    <div className="max-w-[85%]">
      <div className="rounded-2xl rounded-bl-md border border-line bg-surface-raised px-4 py-3 text-sm leading-relaxed text-ink">
        {msg.text}
      </div>
      {msg.sources.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {msg.sources.map((s) => {
            const cat = categoryMeta[s.category];
            return (
              <span
                key={s.id}
                title={s.content}
                className={`rounded-md px-2 py-0.5 text-xs font-medium ${cat.badge}`}
              >
                {cat.label} · {s.structured.title}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
