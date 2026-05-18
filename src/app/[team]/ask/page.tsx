import { notFound } from "next/navigation";
import { AskChat } from "@/components/AskChat";
import { TeamHeader } from "@/components/TeamHeader";
import { getTeamBySlug } from "@/lib/teams";

export default async function AskPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team } = await params;
  const found = await getTeamBySlug(team);
  if (!found) notFound();

  return (
    <>
      <TeamHeader teamSlug={team} teamName={found.name} active="ask" />
      <AskChat teamSlug={team} />
    </>
  );
}
