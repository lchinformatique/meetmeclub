// src/app/api/vip/posts/route.ts
// Espace VIP exclusif — Feed de publications communautaires réservé aux membres VIP

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getProfileByUserId, getAllVipPosts, createVipPost, likeVipPost } from "@/lib/db-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    try {
      const { getVipPostsFromSupabase } = await import("@/lib/supabase-server");
      const posts = await getVipPostsFromSupabase();
      return NextResponse.json({ posts });
    } catch {
      const posts = getAllVipPosts();
      return NextResponse.json({ posts });
    }
  } catch (error) {
    console.error("[GET /api/vip/posts]", error);
    return NextResponse.json({ posts: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const myProfile = getProfileByUserId(session.userId);
    const isVip = myProfile?.plan === "VIP";

    if (!isVip) {
      return NextResponse.json(
        {
          error: "Réservé exclusivement aux membres du Club VIP (15 000 FCFA).",
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content, mediaUrl, mediaType } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Le contenu de la publication est obligatoire." }, { status: 400 });
    }

    const authorName = myProfile?.firstName
      ? `${myProfile.firstName} ${myProfile.lastName || ""}`.trim()
      : session.email?.split("@")[0] || "Membre VIP";
    const authorAvatar = myProfile?.photos?.find((p) => p.isMain)?.url || myProfile?.photos?.[0]?.url || "";
    const authorPseudo = myProfile?.pseudo ? `@${myProfile.pseudo}` : "@membre_vip";

    let createdPost;
    try {
      const { createVipPostInSupabase } = await import("@/lib/supabase-server");
      createdPost = await createVipPostInSupabase({
        userId: session.userId,
        authorName,
        authorAvatar,
        authorPseudo,
        title: title?.trim() || undefined,
        content: content.trim(),
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || "IMAGE",
      });
    } catch {
      createdPost = createVipPost({
        userId: session.userId,
        authorName,
        authorAvatar,
        authorPseudo,
        title: title?.trim() || undefined,
        content: content.trim(),
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || "IMAGE",
      });
    }

    return NextResponse.json({ post: createdPost }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/vip/posts]", error);
    return NextResponse.json({ error: "Erreur lors de la publication" }, { status: 500 });
  }
}
