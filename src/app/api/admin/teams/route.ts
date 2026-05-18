import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { listAllTeams } from "@/lib/teams";

export async function GET() {
  try {
    const teams = await listAllTeams();
    return NextResponse.json({ teams });
  } catch (err) {
    return errorResponse(err);
  }
}
