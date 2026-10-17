// src/app/api/market/latest/route.ts
// GET — date de la dernière annonce publiée (pastille « nouveau » sur l'onglet Marché)

import { NextResponse } from "next/server";
import { latestListing } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const listing = await latestListing();
    return NextResponse.json({ latest: listing?.at || null, listing });
  } catch {
    return NextResponse.json({ latest: null });
  }
}
