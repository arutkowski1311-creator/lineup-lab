import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, ensureUserTeam } from "@/lib/auth";

async function getTeamId(): Promise<string> {
  const session = await getSession();
  if (session) {
    const membership = await ensureUserTeam(session.userId);
    return membership.team.id;
  }
  return "default-team"; // fallback for unauthenticated access during MVP
}

export async function GET() {
  try {
    const teamId = await getTeamId();

    const players = await prisma.player.findMany({
      where: { teamId, active: true },
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

    const teamId = await getTeamId();

    const player = await prisma.player.create({
      data: {
        teamId,
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
