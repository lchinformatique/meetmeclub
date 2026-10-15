// src/app/api/vip/posts/[id]/like/route.ts
// Liker une publication dans l'espace VIP

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { likeVipPost } from "@/lib/db-store";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const updated = likeVipPost(id);

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase-server");
    const admin = getSupabaseAdmin();
    try {
      const { error: rpcErr } = await admin.rpc("increment_vip_post_likes", { post_id: id });
      if (rpcErr) throw rpcErr;
    } catch {
      // Fallback update
      const { data: cur } = await admin.from("vip_posts").select("likesCount").eq("id", id).maybeSingle();
      const nextLikes = ((cur?.likesCount as number) || 0) + 1;
      await admin.from("vip_posts").update({ likesCount: nextLikes }).eq("id", id);
    }
  } catch {}

  return NextResponse.json({ success: true, likesCount: updated?.likesCount || 1 });
}
