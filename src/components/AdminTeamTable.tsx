"use client";

import { useState } from "react";
import type { Team } from "@/lib/types";

type Provider = "anthropic" | "openai" | null;

const ANTHROPIC_MODELS = ["claude-sonnet-4-6", "claude-opus-4-7", "claude-haiku-4-5-20251001"];
const OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"];

function modelOptions(provider: Provider): string[] {
  if (provider === "anthropic") return ANTHROPIC_MODELS;
  if (provider === "openai") return OPENAI_MODELS;
  return [];
}

function defaultModel(provider: Provider): string | null {
  if (provider === "anthropic") return ANTHROPIC_MODELS[0];
  if (provider === "openai") return OPENAI_MODELS[0];
  return null;
}

export function AdminTeamTable({
  teams: initialTeams,
  globalProvider,
  globalAnthropicModel,
  globalOpenaiModel,
}: {
  teams: Team[];
  globalProvider: string;
  globalAnthropicModel: string;
  globalOpenaiModel: string;
}) {
  const [teams, setTeams] = useState(initialTeams);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ slug: string; text: string; ok: boolean } | null>(null);

  async function handleSave(
    slug: string,
    llm_provider: Provider,
    llm_model: string | null,
    system_prompt: string | null,
  ) {
    setSaving(slug);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/teams/${slug}/model`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ llm_provider, llm_model, system_prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ slug, text: data.error ?? "저장 실패", ok: false });
        return;
      }
      setTeams((prev) => prev.map((t) => (t.slug === slug ? data.team : t)));
      setMessage({ slug, text: "저장됐습니다", ok: true });
    } catch {
      setMessage({ slug, text: "네트워크 오류", ok: false });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        전역 기본값 — 프로바이더: <strong>{globalProvider}</strong> ·
        Anthropic 모델: <strong>{globalAnthropicModel}</strong> ·
        OpenAI 모델: <strong>{globalOpenaiModel}</strong>
      </p>

      {teams.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
          등록된 팀이 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <TeamCard
              key={team.slug}
              team={team}
              isSaving={saving === team.slug}
              message={message?.slug === team.slug ? message : null}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({
  team,
  isSaving,
  message,
  onSave,
}: {
  team: Team;
  isSaving: boolean;
  message: { text: string; ok: boolean } | null;
  onSave: (
    slug: string,
    provider: Provider,
    model: string | null,
    systemPrompt: string | null,
  ) => void;
}) {
  const [provider, setProvider] = useState<Provider>(team.llm_provider as Provider);
  const [model, setModel] = useState<string | null>(team.llm_model);
  const [systemPrompt, setSystemPrompt] = useState<string>(team.system_prompt ?? "");

  function handleProviderChange(value: string) {
    const p = value === "" ? null : (value as Provider);
    setProvider(p);
    setModel(defaultModel(p));
  }

  const isDirty =
    provider !== team.llm_provider ||
    model !== team.llm_model ||
    (systemPrompt || null) !== team.system_prompt;

  return (
    <div className="rounded-2xl border border-line bg-surface-raised p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-ink">{team.slug}</span>
        <span className="text-ink-soft">·</span>
        <span className="text-sm text-ink-soft">{team.name}</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-soft">프로바이더</label>
          <select
            value={provider ?? ""}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="block rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="">전역 기본값</option>
            <option value="anthropic">Claude (Anthropic)</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-soft">모델</label>
          {provider ? (
            <select
              value={model ?? ""}
              onChange={(e) => setModel(e.target.value || null)}
              className="block rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            >
              {modelOptions(provider).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-soft">
              —
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-soft">
          시스템 프롬프트{" "}
          <span className="font-normal">(비우면 기본 프롬프트 사용)</span>
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={4}
          placeholder="당신은 소규모 모임 전용 비공개 AI 비서입니다…"
          className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-accent"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          disabled={!isDirty || isSaving}
          onClick={() =>
            onSave(team.slug, provider, model, systemPrompt.trim() || null)
          }
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-40"
        >
          {isSaving ? "저장 중…" : "저장"}
        </button>
        {message && (
          <span className={`text-sm ${message.ok ? "text-emerald-600" : "text-red-600"}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
