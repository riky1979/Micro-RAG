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

  async function handleSave(slug: string, llm_provider: Provider, llm_model: string | null) {
    setSaving(slug);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/teams/${slug}/model`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ llm_provider, llm_model }),
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
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">
        전역 기본값 — 프로바이더: <strong>{globalProvider}</strong> ·
        Anthropic 모델: <strong>{globalAnthropicModel}</strong> ·
        OpenAI 모델: <strong>{globalOpenaiModel}</strong>
      </p>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface text-left text-ink-soft">
              <th className="px-4 py-3 font-medium">팀 식별자</th>
              <th className="px-4 py-3 font-medium">팀 이름</th>
              <th className="px-4 py-3 font-medium">프로바이더</th>
              <th className="px-4 py-3 font-medium">모델</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <TeamRow
                key={team.slug}
                team={team}
                isSaving={saving === team.slug}
                message={message?.slug === team.slug ? message : null}
                onSave={handleSave}
              />
            ))}
            {teams.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-soft">
                  등록된 팀이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamRow({
  team,
  isSaving,
  message,
  onSave,
}: {
  team: Team;
  isSaving: boolean;
  message: { text: string; ok: boolean } | null;
  onSave: (slug: string, provider: Provider, model: string | null) => void;
}) {
  const [provider, setProvider] = useState<Provider>(team.llm_provider as Provider);
  const [model, setModel] = useState<string | null>(team.llm_model);

  function handleProviderChange(value: string) {
    const p = value === "" ? null : (value as Provider);
    setProvider(p);
    setModel(defaultModel(p));
  }

  const isDirty = provider !== team.llm_provider || model !== team.llm_model;

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3 font-mono text-ink">{team.slug}</td>
      <td className="px-4 py-3 text-ink">{team.name}</td>
      <td className="px-4 py-3">
        <select
          value={provider ?? ""}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
        >
          <option value="">전역 기본값</option>
          <option value="anthropic">Claude (Anthropic)</option>
          <option value="openai">OpenAI</option>
        </select>
      </td>
      <td className="px-4 py-3">
        {provider ? (
          <select
            value={model ?? ""}
            onChange={(e) => setModel(e.target.value || null)}
            className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
          >
            {modelOptions(provider).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-ink-soft">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            disabled={!isDirty || isSaving}
            onClick={() => onSave(team.slug, provider, model)}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-95 disabled:opacity-40"
          >
            {isSaving ? "저장 중…" : "저장"}
          </button>
          {message && (
            <span className={`text-xs ${message.ok ? "text-emerald-600" : "text-red-600"}`}>
              {message.text}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
