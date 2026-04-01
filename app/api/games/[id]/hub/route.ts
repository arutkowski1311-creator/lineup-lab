import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, ensureUserTeam } from "@/lib/auth";

async function getTeamId(): Promise<string> {
  const session = await getSession();
  if (session) {
    const membership = await ensureUserTeam(session.userId);
    return membership.team.id;
  }
  return "default-team";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const teamId = await getTeamId();
    const { id } = await params;

    const game = await prisma.game.findFirst({
      where: { id, teamId },
      include: {
        team: { select: { name: true } },
        battingOrder: {
          include: { player: true },
          orderBy: { battingSlot: "asc" },
        },
        fieldingAssignments: {
          include: { player: true },
          orderBy: [{ inningNumber: "asc" }, { position: "asc" }],
        },
        scoreByInning: {
          orderBy: [{ inningNumber: "asc" }, { half: "asc" }],
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        awards: {
          include: { player: true },
        },
        mediaItems: {
          where: { visibility: "team" },
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...game,
      teamName: game.team.name,
      recapText: game.recapText,
      recapStatus: game.recapStatus,
    });
  } catch (error) {
    console.error("Failed to get game hub:", error);
    return NextResponse.json(
      { error: "Failed to get game hub data" },
      { status: 500 }
    );
  }
}
