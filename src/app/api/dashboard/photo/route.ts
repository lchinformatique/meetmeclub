// src/app/api/dashboard/photo/route.ts
// GET /api/dashboard/photo?id=<photoId> — photo d'un membre pour l'espace de gestion (administrateur).
// Les photos hébergées sont redirigées ; les anciennes photos stockées en texte (base64) sont
// converties en image et mises en cache par le navigateur.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!(await isAdminSession(session))) return new NextResponse(null, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return new NextResponse(null, { status: 400 });

  const { getSupabaseAdmin } = await import("@/lib/supabase-server");
  const { data } = await getSupabaseAdmin().from("profile_photos").select("url").eq("id", id).maybeSingle();
  const url: string | undefined = data?.url;
  if (!url) return new NextResponse(null, { status: 404 });

  if (url.startsWith("http")) return NextResponse.redirect(url, 302);
  if (url.startsWith("/")) return NextResponse.redirect(new URL(url, req.url), 302);

  const match = url.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return new NextResponse(null, { status: 404 });
  const bytes = Buffer.from(match[2], "base64");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": match[1] || "image/jpeg",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
