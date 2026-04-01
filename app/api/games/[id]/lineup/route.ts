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
    });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    const battingOrder = await prisma.gameBattingOrder.findMany({
      where: { gameId: id },
      include: { player: true },
      orderBy: { battingSlot: "asc" },
    });

    const fieldingAssignments = await prisma.gameFieldingAssignment.findMany({
      where: { gameId: id },
      include: { player: true },
      orderBy: [{ inningNumber: "asc" }, { position: "asc" }],
    });

    return NextResponse.json({
      battingOrder,
      fieldingAssignments,
      lineupLocked: game.lineupLocked,
    });
  } catch (error) {
    console.error("Failed to get lineup:", error);
    return NextResponse.json(
      { error: "Failed to get lineup" },
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
    const { battingOrder, fieldingAssignments, lineupLocked } = body;

    const game = await prisma.game.findFirst({
      where: { id, teamId: TEAM_ID },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Replace batting order
      if (Array.isArray(battingOrder)) {
        await tx.gameBattingOrder.deleteMany({ where: { gameId: id } });

        for (const entry of battingOrder) {
          await tx.gameBattingOrder.create({
            data: {
              gameId: id,
              battingSlot: entry.battingSlot,
              playerId: entry.playerId,
            },
          });
        }
      }

      // Replace fielding assignments
      if (Array.isArray(fieldingAssignments)) {
        await tx.gameFieldingAssignment.deleteMany({ where: { gameId: id } });

        for (const entry of fieldingAssignments) {
          await tx.gameFieldingAssignment.create({
            data: {
              gameId: id,
              inningNumber: entry.inningNumber,
              position: entry.position,
              playerId: entry.playerId,
              assignmentType: entry.assignmentType || "planned",
            },
          });
        }
      }

      // Update lineupLocked if provided
      if (lineupLocked !== undefined) {
        await tx.game.update({
          where: { id },
          data: { lineupLocked },
        });
      }
    });

    // Return the updated lineup
    const updatedBatting = await prisma.gameBattingOrder.findMany({
      where: { gameId: id },
      include: { player: true },
      orderBy: { battingSlot: "asc" },
    });

    const updatedFielding = await prisma.gameFieldingAssignment.findMany({
      where: { gameId: id },
      include: { player: true },
      orderBy: [{ inningNumber: "asc" }, { position: "asc" }],
    });

    const updatedGame = await prisma.game.findUnique({
      where: { id },
    });

    return NextResponse.json({
      battingOrder: updatedBatting,
      fieldingAssignments: updatedFielding,
      lineupLocked: updatedGame?.lineupLocked,
    });
  } catch (error) {
    console.error("Failed to save lineup:", error);
    return NextResponse.json(
      { error: "Failed to save lineup" },
      { status: 500 }
    );
  }
}
