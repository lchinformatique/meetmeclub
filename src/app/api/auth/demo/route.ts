// src/app/api/auth/demo/route.ts
// POST /api/auth/demo — Connexion démo instantanée en 1-clic pour tester

import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/session";
import { saveProfile, getProfileByUserId } from "@/lib/db-store";

export async function POST() {
  const userId = "demo_user_lome";

  // Ensure demo profile exists
  if (!getProfileByUserId(userId)) {
    saveProfile({
      userId,
      firstName: "Armand",
      lastName: "Adzra",
      pseudo: "Armand_MMC",
      gender: "MALE",
      age: 30,
      phone: "+22890123456",
      city: "Lomé",
      neighborhood: "Bè Plage",
      profession: "Informaticien",
      bio: "Passionné d'échanges, de rencontres authentiques et de bons moments dans les meilleurs cadres de Lomé. Ouvert pour discuter et faire de belles connaissances !",
      relationshipGoal: "SERIOUS",
      plan: "FREE",
      partnersContacted: [],
      photos: [
        { id: "demo_p1", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80", isMain: true }
      ],
      interests: ["Technologie", "Sorties Plage", "Cafés & Lounges", "Musique"],
      availabilities: [{ dayOfWeek: 5, startTime: "18:00", endTime: "22:00" }, { dayOfWeek: 6, startTime: "14:00", endTime: "20:00" }],
      isVerified: true,
      isVisible: true,
    });
  }

  await setSessionCookie({
    userId,
    role: "MEMBER",
    status: "ACTIVE",
    phone: "+22890123456",
    email: "testeur@meetmeclub.tg",
  });

  return NextResponse.json({ success: true, redirect: "/decouverte" });
}
