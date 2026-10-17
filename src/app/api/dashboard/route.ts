// src/app/api/dashboard/route.ts
// GET /api/dashboard            — chiffres clés + liste complète des membres (administrateur uniquement)
// GET /api/dashboard?summary=1  — seulement le nombre de paiements à valider (pastille du menu)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isAdminSession } from "@/lib/admin-auth";
import { getEffectivePlan, isAccessExpired, getSubscriptionStatus } from "@/lib/db-store";
// Statuts des photos d'album (la colonne n'accepte pas « COVER » : un filtre neq("COVER") échouait toujours)
const GALLERY_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!(await isAdminSession(session))) return NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 });

  const { getSupabaseAdmin } = await import("@/lib/supabase-server");
  const admin = getSupabaseAdmin();

  const { count: pendingPayments } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("type", "ACTIVATION_REQUEST")
    .is("readAt", null);

  if (new URL(req.url).searchParams.get("summary")) {
    return NextResponse.json({ pendingPayments: pendingPayments || 0 });
  }

  // Chiffres seuls (accueil de l'espace de gestion) : requête légère
  const statsOnly = Boolean(new URL(req.url).searchParams.get("stats"));

  const [{ data: profiles }, { data: users }, { data: photos }] = await Promise.all([
    (async () => {
      const cols = (withCountry: boolean) =>
        statsOnly
          ? "id, userId, pseudo, plan, subscriptionStartedAt, subscriptionExpiresAt, createdAt"
          : `id, userId, firstName, lastName, pseudo, gender, city, ${withCountry ? "country, " : ""}profession, bio, relationshipGoal, plan, subscriptionStartedAt, subscriptionExpiresAt, likesCount, isVisible, createdAt, updatedAt`;
      const first = await admin.from("profiles").select(cols(true)).order("createdAt", { ascending: false }).limit(2000);
      // Colonne « country » absente tant que la migration v7 n'est pas exécutée
      return first.error ? admin.from("profiles").select(cols(false)).order("createdAt", { ascending: false }).limit(2000) : first;
    })(),
    statsOnly
      ? Promise.resolve({ data: [] as any[] })
      : admin.from("users").select("id, email, phone, status, role, dateOfBirth, createdAt").limit(5000),
    statsOnly
      ? Promise.resolve({ data: [] as any[] })
      : // Identifiants seulement (jamais le contenu) : chaque photo se charge ensuite à part,
        // via /api/dashboard/photo, quand elle apparaît à l'écran → liste légère et rapide
        admin.from("profile_photos").select("id, profileId, isMain, order").in("status", GALLERY_STATUSES).limit(10000),
  ]);

  const userById = new Map((users || []).map((u: any) => [u.id, u]));

  // Adresses de résidence (table privée, visibles uniquement par l'administrateur)
  const addressByUser = new Map<string, string>();
  if (!statsOnly) {
    const { data: priv } = await admin.from("member_private").select("userId, address").limit(5000);
    (priv || []).forEach((r: any) => r.address && addressByUser.set(r.userId, r.address));
  }
  const photosByProfile = new Map<string, Array<{ url: string; isMain: boolean; order: number }>>();
  for (const ph of photos || []) {
    const list = photosByProfile.get(ph.profileId) || [];
    list.push({ url: `/api/dashboard/photo?id=${encodeURIComponent(ph.id)}`, isMain: Boolean(ph.isMain), order: ph.order || 0 });
    photosByProfile.set(ph.profileId, list);
  }

  const now = Date.now();
  const members = (profiles || []).map((p: any) => {
    const u: any = userById.get(p.userId) || {};
    const memberPhotos = (photosByProfile.get(p.id) || []).sort(
      (a, b) => Number(b.isMain) - Number(a.isMain) || a.order - b.order
    );
    const merged = { ...p, email: u.email, createdAt: p.createdAt || u.createdAt };
    const status = getSubscriptionStatus(merged);
    let age: number | null = null;
    if (u.dateOfBirth) {
      const d = new Date(u.dateOfBirth);
      age = new Date().getFullYear() - d.getFullYear() - (new Date() < new Date(new Date().getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
    }
    return {
      userId: p.userId,
      firstName: p.firstName,
      lastName: p.lastName,
      pseudo: p.pseudo,
      gender: p.gender,
      age,
      city: p.city,
      country: p.country,
      address: addressByUser.get(p.userId) || null,
      profession: p.profession,
      bio: p.bio,
      email: u.email || null,
      phone: u.phone || null,
      accountStatus: u.status || "ACTIVE",
      role: u.role || "MEMBER",
      plan: getEffectivePlan(merged),
      storedPlan: p.plan || "FREE",
      expired: isAccessExpired(merged),
      expiresAt: status.expiresAt,
      daysLeft: status.isExpired ? 0 : status.daysRemaining,
      likesCount: p.likesCount || 0,
      photos: memberPhotos.slice(0, 4).map((x) => x.url),
      createdAt: p.createdAt || u.createdAt,
      lastUpdate: p.updatedAt,
    };
  });

  const dayMs = 24 * 3600 * 1000;
  const stats = {
    total: members.length,
    newToday: members.filter((m) => m.createdAt && now - new Date(m.createdAt).getTime() < dayMs).length,
    newThisWeek: members.filter((m) => m.createdAt && now - new Date(m.createdAt).getTime() < 7 * dayMs).length,
    vip: members.filter((m) => m.plan === "VIP").length,
    complice: members.filter((m) => m.plan === "COMPLICE").length,
    essential: members.filter((m) => m.plan === "ESSENTIAL").length,
    freeActive: members.filter((m) => m.plan === "FREE" && !m.expired).length,
    expired: members.filter((m) => m.expired).length,
    pendingPayments: pendingPayments || 0,
  };

  return NextResponse.json(statsOnly ? { stats } : { stats, members });
}
