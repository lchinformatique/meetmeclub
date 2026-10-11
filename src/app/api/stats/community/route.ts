// src/app/api/stats/community/route.ts
// Public real-time statistics API — Aggregate figures only (no private user data)

import { NextResponse } from "next/server";
import { getCommunityStats } from "@/lib/db-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = getCommunityStats();
    return NextResponse.json({
      success: true,
      stats,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("[GET /api/stats/community]", error);
    return NextResponse.json({ error: "Erreur statistiques" }, { status: 500 });
  }
}
