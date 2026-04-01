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

    const players = await prisma.player.findMany({
      where: { teamId: TEAM_ID, active: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("Failed to get players:", error);
    return NextResponse.json(
      { error: "Failed to get players" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, dob, fieldingOverall, catching, throwing, battingOverall } = body;

    if (!firstName || !lastName || !dob) {
      return NextResponse.json(
        { error: "firstName, lastName, and dob are required" },
        { status: 400 }
      );
    }

    await ensureTeam();

    const player = await prisma.player.create({
      data: {
        teamId: TEAM_ID,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob: new Date(dob),
        fieldingOverall: fieldingOverall ?? 3,
        catching: catching ?? 3,
        throwing: throwing ?? 3,
        battingOverall: battingOverall ?? 3,
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error("Failed to create player:", error);
    return NextResponse.json(
      { error: "Failed to create player" },
      { status: 500 }
    );
  }
}
