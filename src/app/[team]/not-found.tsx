import Link from "next/link";

export default function TeamNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-wide text-accent">404</p>
      <h1 className="mt-3 text-2xl font-extrabold text-ink">
        그런 팀을 찾을 수 없어요
      </h1>
      <p className="mt-2 text-ink-soft">
        팀 식별자를 다시 확인하거나 새 팀을 만들어보세요.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition hover:brightness-95"
      >
        처음으로 돌아가기
      </Link>
    </main>
  );
}
