import Link from "next/link";

type Active = "inject" | "ask" | null;

export function TeamHeader({
  teamSlug,
  teamName,
  active,
}: {
  teamSlug: string;
  teamName: string;
  active: Active;
}) {
  const tabs: { key: Exclude<Active, null>; label: string; href: string }[] = [
    { key: "inject", label: "주입 콘솔", href: `/${teamSlug}/inject` },
    { key: "ask", label: "질문하기", href: `/${teamSlug}/ask` },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3">
        <Link href={`/${teamSlug}`} className="flex min-w-0 items-center gap-2">
          <span className="size-2 shrink-0 rounded-full bg-accent" />
          <span className="truncate font-bold text-ink">{teamName}</span>
        </Link>
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                active === tab.key
                  ? "bg-accent text-white"
                  : "text-ink-soft hover:bg-surface-raised hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
