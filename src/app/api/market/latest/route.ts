// src/app/api/market/latest/route.ts
// GET — date de la dernière annonce publiée (pastille « nouveau » sur l'onglet Marché)

import { NextResponse } from "next/server";
import { latestListingAt } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ latest: await latestListingAt() });
  } catch {
    return NextResponse.json({ latest: null });
  }
}
