// src/app/api/interests/route.ts
// GET /api/interests — public list of interests grouped by category

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FALLBACK_INTERESTS = [
  { id: "1", name: "Voyages", icon: "✈️", category: "Loisirs", order: 1 },
  { id: "2", name: "Musique", icon: "🎵", category: "Loisirs", order: 2 },
  { id: "3", name: "Cinéma", icon: "🎬", category: "Loisirs", order: 3 },
  { id: "4", name: "Lecture", icon: "📚", category: "Loisirs", order: 4 },
  { id: "5", name: "Danse", icon: "💃", category: "Loisirs", order: 5 },
  { id: "6", name: "Sport", icon: "⚽", category: "Sport", order: 10 },
  { id: "7", name: "Fitness", icon: "💪", category: "Sport", order: 12 },
  { id: "8", name: "Cuisine", icon: "👨‍🍳", category: "Gastronomie", order: 20 },
  { id: "9", name: "Sorties", icon: "🍽️", category: "Gastronomie", order: 21 },
  { id: "10", name: "Tech & Innovation", icon: "💻", category: "Professionnel", order: 41 },
];

export async function GET() {
  let interests = FALLBACK_INTERESTS;
  try {
    const dbInterests = await prisma.interest.findMany({
      orderBy: [{ category: "asc" }, { order: "asc" }],
    });
    if (dbInterests.length > 0) {
      interests = dbInterests as typeof FALLBACK_INTERESTS;
    }
  } catch (error) {
    console.warn("[GET /api/interests] Database not reachable, using fallback list:", error);
  }

  // Group by category
  const grouped = interests.reduce(
    (acc: Record<string, typeof interests>, item: (typeof interests)[number]) => {
      const cat = item.category || "Autres";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {}
  );

  return NextResponse.json({ interests, grouped });
}
