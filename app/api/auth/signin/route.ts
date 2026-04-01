import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    const user = await signIn(email, password);
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid credentials") {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    console.error("Failed to sign in:", error);
    return NextResponse.json(
      { error: "Failed to sign in" },
      { status: 500 }
    );
  }
}
