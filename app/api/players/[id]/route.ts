import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TEAM_ID = "default-team";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const player = await prisma.player.findFirst({
      where: { id, teamId: TEAM_ID },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error("Failed to get player:", error);
    return NextResponse.json(
      { error: "Failed to get player" },
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

    const existing = await prisma.player.findFirst({
      where: { id, teamId: TEAM_ID },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (body.firstName !== undefined) data.firstName = body.firstName.trim();
    if (body.lastName !== undefined) data.lastName = body.lastName.trim();
    if (body.dob !== undefined) data.dob = new Date(body.dob);
    if (body.fieldingOverall !== undefined) data.fieldingOverall = body.fieldingOverall;
    if (body.catching !== undefined) data.catching = body.catching;
    if (body.throwing !== undefined) data.throwing = body.throwing;
    if (body.battingOverall !== undefined) data.battingOverall = body.battingOverall;
    if (body.active !== undefined) data.active = body.active;

    const player = await prisma.player.update({
      where: { id },
      data,
    });

    return NextResponse.json(player);
  } catch (error) {
    console.error("Failed to update player:", error);
    return NextResponse.json(
      { error: "Failed to update player" },
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

    const existing = await prisma.player.findFirst({
      where: { id, teamId: TEAM_ID },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    const player = await prisma.player.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json(player);
  } catch (error) {
    console.error("Failed to delete player:", error);
    return NextResponse.json(
      { error: "Failed to delete player" },
      { status: 500 }
    );
  }
}
