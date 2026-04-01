import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TEAM_ID = "default-team";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const game = await prisma.game.findFirst({
      where: { id, teamId: TEAM_ID },
      include: {
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
      },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error("Failed to get game:", error);
    return NextResponse.json(
      { error: "Failed to get game" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.game.findFirst({
      where: { id, teamId: TEAM_ID },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (body.opponentName !== undefined) data.opponentName = body.opponentName.trim();
    if (body.gameDate !== undefined) data.gameDate = new Date(body.gameDate);
    if (body.coachMode !== undefined) data.coachMode = body.coachMode;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.lineupLocked !== undefined) data.lineupLocked = body.lineupLocked;
    if (body.gameStatus !== undefined) data.gameStatus = body.gameStatus;
    if (body.currentInning !== undefined) data.currentInning = body.currentInning;
    if (body.currentHalf !== undefined) data.currentHalf = body.currentHalf;
    if (body.currentOuts !== undefined) data.currentOuts = body.currentOuts;

    const game = await prisma.game.update({
      where: { id },
      data,
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error("Failed to update game:", error);
    return NextResponse.json(
      { error: "Failed to update game" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.game.findFirst({
      where: { id, teamId: TEAM_ID },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    await prisma.game.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete game:", error);
    return NextResponse.json(
      { error: "Failed to delete game" },
      { status: 500 }
    );
  }
}
