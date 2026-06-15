// Auth API Route
// Placeholder for future authentication logic.
// Phase 2: Will handle user login/signup via Firebase Auth.
// Phase 1 MVP: No authentication required — users identified by phone number only.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "auth placeholder" });
}
