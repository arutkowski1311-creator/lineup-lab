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
    const team = await ensureTeam();
    return NextResponse.json(team);
  } catch (error) {
    console.error("Failed to get team:", error);
    return NextResponse.json(
      { error: "Failed to get team" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    await ensureTeam();

    const team = await prisma.team.update({
      where: { id: TEAM_ID },
      data: { name: name.trim() },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Failed to update team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}
