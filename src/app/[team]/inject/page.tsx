import { notFound } from "next/navigation";
import { InjectConsole } from "@/components/InjectConsole";
import { TeamHeader } from "@/components/TeamHeader";
import { listRecentDocuments } from "@/lib/rag";
import { getTeamBySlug } from "@/lib/teams";

export const dynamic = "force-dynamic";

export default async function InjectPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team } = await params;
  const found = await getTeamBySlug(team);
  if (!found) notFound();

  const docs = await listRecentDocuments(team, 20);

  return (
    <>
      <TeamHeader teamSlug={team} teamName={found.name} active="inject" />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <InjectConsole teamSlug={team} initialDocs={docs} />
      </main>
    </>
  );
}
