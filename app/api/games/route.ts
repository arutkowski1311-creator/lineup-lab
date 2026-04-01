import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TEAM_ID = "default-team";

async function ensureTeam() {
  return prisma.team.upsert({
    where: { id: TEAM_ID },
    create: { id: TEAM_ID, name: "My Team" },
    update: {},
  });
}

export async function GET() {
  try {
    await ensureTeam();

    const games = await prisma.game.findMany({
      where: { teamId: TEAM_ID },
      orderBy: { gameDate: "desc" },
      include: {
        _count: {
          select: { battingOrder: true },
        },
      },
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error("Failed to get games:", error);
    return NextResponse.json(
      { error: "Failed to get games" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { opponentName, gameDate, coachMode, notes, playerIds } = body;

    if (!opponentName || !gameDate) {
      return NextResponse.json(
        { error: "opponentName and gameDate are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      return NextResponse.json(
        { error: "playerIds array is required and must not be empty" },
        { status: 400 }
      );
    }

    await ensureTeam();

    const game = await prisma.game.create({
      data: {
        teamId: TEAM_ID,
        opponentName: opponentName.trim(),
        gameDate: new Date(gameDate),
        coachMode: coachMode || "balanced",
        notes: notes || null,
      },
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error("Failed to create game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}
