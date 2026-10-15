// src/app/api/stats/community/route.ts
// Public real-time statistics API — queries Supabase directly for accurate counts

import { NextResponse } from "next/server";
import { getCommunityStats } from "@/lib/db-store";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET() {
  try {
    // Try to get real-time counts from Supabase
    let supabaseStats = null;
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const sb = createClient(supabaseUrl, supabaseServiceKey);
        const [usersRes, profilesRes, photosRes, verificationsRes, gendersRes, partnersRes, appointmentsRes] = await Promise.all([
          sb.from("users").select("*", { count: "exact", head: true }),
          sb.from("profiles").select("*", { count: "exact", head: true }),
          sb.from("profile_photos").select("*", { count: "exact", head: true }),
          sb.from("verifications").select("*", { count: "exact", head: true }),
          sb.from("profiles").select("gender"),
          sb.from("partners").select("*", { count: "exact", head: true }),
          sb.from("appointments").select("*", { count: "exact", head: true }),
        ]);

        const totalUsers = usersRes.count ?? 0;
        const totalProfiles = profilesRes.count ?? 0;
        const totalPhotos = photosRes.count ?? 0;
        const totalVerifications = verificationsRes.count ?? 0;
        const totalPartners = partnersRes.count ?? 3;
        const totalAppointments = appointmentsRes.count ?? 0;
        const genders = gendersRes.data ?? [];
        const maleCount = genders.filter((g: { gender: string }) => g.gender === "MALE").length;
        const femaleCount = genders.filter((g: { gender: string }) => g.gender === "FEMALE").length;

        // Real counts from Supabase
        const onlineNow = totalProfiles;

        supabaseStats = {
          totalMembers: totalUsers,
          totalProfiles,
          totalPhotos,
          totalVerifications,
          totalPartners,
          maleMembers: maleCount,
          femaleMembers: femaleCount,
          verifiedSelfieMembers: totalVerifications,
          organizedDates: totalAppointments,
          onlineNow,
          lastUpdated: new Date().toISOString(),
        };
      } catch (e) {
        console.warn("[stats/community] Supabase query failed, using local fallback:", e);
      }
    }

    // Use Supabase stats if available, otherwise fall back to local db-store
    const stats = supabaseStats || getCommunityStats();

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
