// src/app/api/profiles/me/route.ts
// GET  /api/profiles/me -- get current user profile, plan & quota
// POST /api/profiles/me -- create profile
// PATCH /api/profiles/me -- update profile fields

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getProfileByUserId, saveProfile, PLAN_LIMITS } from '@/lib/db-store';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  let profile = getProfileByUserId(session.userId);

  if (!profile) {
    let dbUser: any = null;
    try {
      const { prisma } = await import('@/lib/prisma');
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: session.userId },
            ...(session.email ? [{ email: { equals: session.email, mode: 'insensitive' as const } }] : []),
          ],
        },
        include: {
          profile: {
            include: {
              photos: { orderBy: { order: "asc" } },
            },
          },
        },
      });
    } catch {}

    const fallbackFirstName = dbUser?.profile?.firstName || session.email?.split('@')[0] || 'Nouveau Membre';
    const fallbackPseudo = dbUser?.profile?.pseudo || fallbackFirstName;

    profile = saveProfile({
      userId: session.userId,
      firstName: fallbackFirstName,
      pseudo: fallbackPseudo,
      email: session.email || undefined, // conservé pour reconnexion par email après déconnexion
      phone: session.phone || undefined,
      gender: (dbUser?.profile?.gender as any) || 'OTHER',
      city: dbUser?.profile?.city || 'Lome',
      age: 26,
      bio: dbUser?.profile?.bio || 'Nouveau membre sur Meet Me Club.',
      relationshipGoal: (dbUser?.profile?.relationshipGoal as any) || 'SERIOUS',
      plan: 'FREE',
      partnersContacted: [],
      photos: (dbUser?.profile?.photos && dbUser.profile.photos.length > 0)
        ? dbUser.profile.photos.map((ph: any) => ({ id: ph.id, url: ph.url, isMain: ph.isMain }))
        : [],
      interests: [],
      availabilities: [{ dayOfWeek: 5, startTime: '18:00', endTime: '22:00' }],
      isVerified: false,
      isVisible: true,
    });
  }

  if (profile && !profile.phone) {
    try {
      const { prisma } = await import('@/lib/prisma');
      const u = await prisma.user.findUnique({ where: { id: session.userId }, select: { phone: true } });
      if (u?.phone) profile.phone = u.phone;
    } catch {}
  }

  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });

  const planInfo = PLAN_LIMITS[profile.plan] || PLAN_LIMITS.FREE;
  return NextResponse.json({
    profile: {
      ...profile,
      planInfo,
      contactsRemaining: Math.max(0, (planInfo.maxPartners || 3) - (profile.partnersContacted?.length || 0)),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  try {
    const body = await request.json();
    const saved = saveProfile({ ...body, userId: session.userId });
    return NextResponse.json({ profile: saved }, { status: 201 });
  } catch (error) {
    console.error('[profiles/me POST]', error);
    return NextResponse.json({ error: 'Erreur enregistrement' }, { status: 500 });
  }
}


export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  try {
    const body = await request.json();

    // ── Gestion upload photo de couverture ────────────────────
    let coverUrl = body.coverUrl;
    if (coverUrl && coverUrl.startsWith('data:image/')) {
      // Tenter upload Cloudinary
      try {
        const { uploadPhoto } = await import('@/lib/cloudinary');
        const result = await uploadPhoto(coverUrl, `meetmeclub/covers/${session.userId}`);
        coverUrl = result.secure_url;
      } catch {
        // Conserver base64 en fallback local
        console.warn('[PATCH] Cover upload to Cloudinary failed, keeping base64');
      }
    }

    // ── Mise à jour store local (toujours en premier) ─────────
    const patchData = { ...body };
    if (coverUrl !== undefined) patchData.coverUrl = coverUrl;
    const saved = saveProfile({ ...patchData, userId: session.userId });

    // ── Synchronisation Prisma (best-effort) ──────────────────
    try {
      const { prisma } = await import('@/lib/prisma');
      if (body.phone !== undefined) {
        try {
          await prisma.user.update({
            where: { id: session.userId },
            data: { phone: body.phone ? body.phone.toString().trim() : null },
          });
        } catch (phoneErr) {
          console.warn('[PATCH phone]', phoneErr);
        }
      }
      const updateData: Record<string, unknown> = {};
      if (body.firstName !== undefined) updateData.firstName = body.firstName;
      if (body.pseudo !== undefined) updateData.pseudo = body.pseudo || null;
      if (body.gender !== undefined) updateData.gender = body.gender;
      if (body.city !== undefined) updateData.city = body.city;
      if (body.neighborhood !== undefined) updateData.neighborhood = body.neighborhood;
      if (body.profession !== undefined) updateData.profession = body.profession;
      if (body.bio !== undefined) updateData.bio = body.bio;
      if (body.relationshipGoal !== undefined) updateData.relationshipGoal = body.relationshipGoal;
      if (body.height !== undefined) updateData.height = body.height;
      if (body.religion !== undefined) updateData.religion = body.religion;
      if (body.relationshipStatus !== undefined) updateData.relationshipStatus = body.relationshipStatus;
      if (body.hasChildren !== undefined) updateData.hasChildren = body.hasChildren;
      if (body.languages !== undefined) updateData.languages = body.languages;
      if (body.educationLevel !== undefined) updateData.educationLevel = body.educationLevel;
      if (body.isVisible !== undefined) updateData.isVisible = body.isVisible;
      if (Object.keys(updateData).length > 0) {
        await prisma.profile.upsert({
          where: { userId: session.userId },
          update: updateData,
          create: {
            userId: session.userId,
            firstName: body.firstName || saved.firstName || 'Membre',
            gender: body.gender || saved.gender || 'OTHER',
            city: body.city || saved.city || 'Lome',
            bio: body.bio || saved.bio || 'Membre actif.',
            relationshipGoal: body.relationshipGoal || saved.relationshipGoal || 'SERIOUS',
            pseudo: body.pseudo || saved.pseudo || null,
            neighborhood: body.neighborhood || saved.neighborhood || null,
            profession: body.profession || saved.profession || null,
            isVisible: true,
            profileCompleteness: 75,
            ...updateData,
          },
        });
      }
    } catch (dbErr) {
      console.warn('[PATCH prisma sync]', dbErr);
    }
    return NextResponse.json({ profile: saved });
  } catch (error) {
    console.error('[profiles/me PATCH]', error);
    return NextResponse.json({ error: 'Erreur mise a jour' }, { status: 500 });
  }

}