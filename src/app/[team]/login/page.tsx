import { notFound } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getTeamBySlug } from "@/lib/teams";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ team: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { team } = await params;
  const { next } = await searchParams;
  const found = await getTeamBySlug(team);
  if (!found) notFound();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <p className="text-xs font-bold uppercase tracking-wide text-accent">
        팀 입장
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
        {found.name}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        운영진 또는 멤버 패스코드를 입력하세요.
      </p>
      <LoginForm teamSlug={team} next={next ?? `/${team}`} />
    </main>
  );
}
