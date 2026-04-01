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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { players } = body;

    if (!Array.isArray(players) || players.length === 0) {
      return NextResponse.json(
        { error: "players array is required and must not be empty" },
        { status: 400 }
      );
    }

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p.firstName || !p.lastName || !p.dob) {
        return NextResponse.json(
          { error: `Player at index ${i} is missing firstName, lastName, or dob` },
          { status: 400 }
        );
      }
    }

    await ensureTeam();

    const created = await prisma.$transaction(
      players.map((p: { firstName: string; lastName: string; dob: string }) =>
        prisma.player.create({
          data: {
            teamId: TEAM_ID,
            firstName: p.firstName.trim(),
            lastName: p.lastName.trim(),
            dob: new Date(p.dob),
          },
        })
      )
    );

    return NextResponse.json({ players: created, count: created.length }, { status: 201 });
  } catch (error) {
    console.error("Failed to import players:", error);
    return NextResponse.json(
      { error: "Failed to import players" },
      { status: 500 }
    );
  }
}
