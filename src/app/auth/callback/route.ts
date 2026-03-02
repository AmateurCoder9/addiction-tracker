// Firebase doesn't need a callback route — auth is handled client-side
import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_SITE_URL || "https://addiction-tracker-omega.vercel.app"));
}
