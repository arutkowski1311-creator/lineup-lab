import { NextResponse } from "next/server";
import { signUp } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "email, password, and name are required" },
        { status: 400 }
      );
    }

    const user = await signUp(email, password, name);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Email already registered") {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }
    console.error("Failed to sign up:", error);
    return NextResponse.json(
      { error: "Failed to sign up" },
      { status: 500 }
    );
  }
}
