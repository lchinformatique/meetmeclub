// src/app/api/profiles/me/route.ts
// GET  /api/profiles/me -- get current user profile, plan & quota
// POST /api/profiles/me -- create profile
// PATCH /api/profiles/me -- update profile fields & photos directly

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getProfileByUserId, saveProfile, PLAN_LIMITS } from '@/lib/db-store';
import { FREE_TRIAL_DAYS } from '@/lib/subscription-constants';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  let profile = getProfileByUserId(session.userId);

  // Synchronisation Supabase REST en priorité pour persistence garantie
  try {
    const { getProfileFromSupabase } = await import('@/lib/supabase-server');
    const supa = await getProfileFromSupabase(session.userId, session.email || undefined);
    if (supa) {
      // Première fois : on fige les dates du plan dans Supabase pour un décompte définitif
      if (!supa.subscriptionExpiresAt && supa.createdAt) {
        const start = supa.subscriptionStartedAt || supa.createdAt;
        const days = (supa.plan || 'FREE') === 'FREE' ? FREE_TRIAL_DAYS : 30;
        const { upsertProfileInSupabase } = await import('@/lib/supabase-server');
        await upsertProfileInSupabase(session.userId, {
          email: session.email || undefined,
          subscriptionStartedAt: new Date(start).toISOString(),
          subscriptionExpiresAt: new Date(new Date(start).getTime() + days * 24 * 3600 * 1000).toISOString(),
        }).catch(() => null);
      }
      const mergedPhotos = (supa.photos && supa.photos.length > 0)
        ? supa.photos.map((ph: any) => ({ id: ph.id, url: ph.url, isMain: ph.isMain }))
        : (profile?.photos || []);

      profile = saveProfile({
        ...(profile || {}),
        userId: session.userId,
        firstName: supa.firstName || profile?.firstName || 'Nouveau Membre',
        lastName: supa.lastName || profile?.lastName || undefined,
        pseudo: supa.pseudo || profile?.pseudo || undefined,
        email: session.email || profile?.email || undefined,
        phone: supa.phone || session.phone || profile?.phone || undefined,
        gender: (supa.gender as any) || profile?.gender || 'OTHER',
        dateOfBirth: supa.dateOfBirth || profile?.dateOfBirth || undefined,
        placeOfBirth: supa.placeOfBirth || profile?.placeOfBirth || undefined,
        age: supa.age || profile?.age || undefined,
        city: supa.city || profile?.city || 'Lomé',
        neighborhood: supa.neighborhood || profile?.neighborhood || undefined,
        profession: supa.profession || profile?.profession || undefined,
        relationshipStatus: supa.relationshipStatus || profile?.relationshipStatus || 'Célibataire',
        hasChildren: supa.hasChildren ?? profile?.hasChildren ?? false,
        religion: supa.religion || profile?.religion || undefined,
        height: supa.height || profile?.height || undefined,
        languages: supa.languages || profile?.languages || ['fr'],
        bio: supa.bio !== undefined && supa.bio !== null ? supa.bio : (profile?.bio || 'Nouveau membre sur Meet Me Club.'),
        relationshipGoal: (supa.relationshipGoal as any) || profile?.relationshipGoal || 'SERIOUS',
        coverUrl: supa.coverUrl || profile?.coverUrl || undefined,
        plan: supa.plan || profile?.plan || 'FREE',
        // Vrai décompte : dates enregistrées dans Supabase ; à défaut, l'essai gratuit
        // démarre à la création réelle du compte (jamais à un redémarrage du serveur)
        subscriptionStartedAt: supa.subscriptionStartedAt || supa.createdAt || profile?.subscriptionStartedAt || undefined,
        subscriptionExpiresAt:
          supa.subscriptionExpiresAt ||
          ((supa.plan || 'FREE') === 'FREE' && supa.createdAt
            ? new Date(new Date(supa.createdAt).getTime() + FREE_TRIAL_DAYS * 24 * 3600 * 1000).toISOString()
            : profile?.subscriptionExpiresAt || undefined),
        partnersContacted: profile?.partnersContacted || [],
        photos: mergedPhotos,
        interests: profile?.interests || [],
        availabilities: profile?.availabilities || [{ dayOfWeek: 5, startTime: '18:00', endTime: '22:00' }],
        isVerified: supa.isVerified ?? profile?.isVerified ?? false,
        isVisible: supa.isVisible ?? profile?.isVisible ?? true,
      });
    }
  } catch (supaErr) {
    console.warn('[GET profile from Supabase]', supaErr);
  }

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
      email: session.email || undefined,
      phone: session.phone || undefined,
      gender: (dbUser?.profile?.gender as any) || 'OTHER',
      city: dbUser?.profile?.city || 'Lomé',
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

  // ── S'assurer de récupérer la vraie photo de profil depuis Supabase ──
  if (!profile.photos || profile.photos.length === 0 || profile.photos[0]?.url?.includes("dicebear.com/7.x/initials")) {
    try {
      const { getProfileFromSupabase } = await import('@/lib/supabase-server');
      const supa = await getProfileFromSupabase(session.userId);
      if (supa?.photos && supa.photos.length > 0) {
        const validPhotos = supa.photos.filter((ph: any) => !ph.url?.includes("dicebear.com/7.x/initials"));
        if (validPhotos.length > 0) {
          profile.photos = validPhotos.map((ph: any) => ({ id: ph.id, url: ph.url, isMain: ph.isMain }));
          saveProfile({ userId: session.userId, photos: profile.photos });
        }
      }
    } catch {}
  }

  const { getSubscriptionStatus, getEffectivePlan } = await import('@/lib/db-store');
  const effectivePlan = getEffectivePlan(profile);
  const planInfo = PLAN_LIMITS[effectivePlan] || PLAN_LIMITS.FREE;
  const subscriptionStatus = getSubscriptionStatus(profile);

  return NextResponse.json({
    profile: {
      ...profile,
      effectivePlan,
      planInfo,
      subscriptionStatus,
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

    // 1. Validation obligatoire de la date de naissance (18+ ans)
    let calculatedAge: number | undefined = undefined;
    if (body.dateOfBirth) {
      const dob = new Date(body.dateOfBirth);
      if (isNaN(dob.getTime())) {
        return NextResponse.json({ error: 'Date de naissance invalide.' }, { status: 400 });
      }
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 18) {
        return NextResponse.json(
          { error: "Vous devez avoir au moins 18 ans pour utiliser Meet Me Club. L'accès aux personnes mineures est strictement interdit." },
          { status: 400 }
        );
      }
      calculatedAge = age;
      body.age = calculatedAge;
    }

    // 2. Gestion upload photo de couverture via Supabase Storage
    let coverUrl = body.coverUrl;
    if (coverUrl && coverUrl.startsWith('data:image/')) {
      try {
        const { uploadToSupabaseStorage } = await import('@/lib/supabase-storage');
        const uploadRes = await uploadToSupabaseStorage(session.userId, 'cover', coverUrl, 'image/webp', 'cover');
        coverUrl = uploadRes.url;
      } catch (stErr) {
        console.warn('[PATCH] Cover upload to Supabase Storage warning, trying fallback:', stErr);
        try {
          const { uploadPhoto } = await import('@/lib/cloudinary');
          const result = await uploadPhoto(coverUrl, `meetmeclub/covers/${session.userId}`);
          coverUrl = result.secure_url;
        } catch {}
      }
    }

    // 3. Gestion album photo complet (jusqu'a 8 photos) et Avatar via Supabase Storage
    const existingProfile = getProfileByUserId(session.userId);
    let updatedPhotos = existingProfile?.photos ? [...existingProfile.photos] : [];
    // Album actuel : Supabase fait foi (le store local de ce serveur peut être périmé)
    if (!Array.isArray(body.photos) && (body.avatarUrl || body.photoUrl)) {
      try {
        const { getProfileFromSupabase } = await import('@/lib/supabase-server');
        const supaNow = await getProfileFromSupabase(session.userId, session.email || undefined);
        if (supaNow?.photos) updatedPhotos = supaNow.photos.map((p: any) => ({ id: p.id, url: p.url, isMain: p.isMain }));
      } catch {}
    }
    let finalAvatarUrl = body.avatarUrl || body.photoUrl;

    if (Array.isArray(body.photos)) {
      const processedPhotos: Array<{ id: string; url: string; isMain: boolean }> = [];
      const { uploadToSupabaseStorage } = await import('@/lib/supabase-storage');
      for (let i = 0; i < Math.min(body.photos.length, 4); i++) {
        const item = body.photos[i];
        let url = item.url;
        if (url && url.startsWith('data:image/')) {
          try {
            const uploadRes = await uploadToSupabaseStorage(
              session.userId,
              item.isMain ? 'avatar' : 'gallery',
              url,
              'image/webp',
              `photo_${i + 1}`
            );
            url = uploadRes.url;
          } catch (stErr) {
            console.warn('[PATCH] Photo upload to Supabase Storage warning:', stErr);
          }
        }
        processedPhotos.push({
          id: item.id || `photo_${Date.now()}_${i}`,
          url,
          isMain: Boolean(item.isMain),
        });
      }
      if (processedPhotos.length > 0 && !processedPhotos.some((p) => p.isMain)) {
        processedPhotos[0].isMain = true;
      }
      updatedPhotos = processedPhotos;
      const mainPhoto = updatedPhotos.find((p) => p.isMain) || updatedPhotos[0];
      if (mainPhoto) {
        finalAvatarUrl = mainPhoto.url;
      }
    } else if (finalAvatarUrl) {
      if (finalAvatarUrl.startsWith('data:image/')) {
        try {
          const { uploadToSupabaseStorage } = await import('@/lib/supabase-storage');
          const uploadRes = await uploadToSupabaseStorage(
            session.userId,
            'avatar',
            finalAvatarUrl,
            'image/webp',
            'avatar'
          );
          finalAvatarUrl = uploadRes.url;
        } catch (stErr) {
          console.warn('[PATCH] Avatar upload to Supabase Storage warning:', stErr);
        }
      }

      const newPhotoObj = { id: `photo_${Date.now()}`, url: finalAvatarUrl, isMain: true };
      updatedPhotos = [
        newPhotoObj,
        ...updatedPhotos.filter((p) => p.url !== finalAvatarUrl).map((p) => ({ ...p, isMain: false })),
      ].slice(0, 4);
    }

    // 4. Mise a jour immediate du store local
    const patchData: Record<string, any> = { ...body };
    if (coverUrl !== undefined) patchData.coverUrl = coverUrl;
    if (Array.isArray(body.photos) || body.avatarUrl || body.photoUrl) patchData.photos = updatedPhotos;
    delete patchData.avatarUrl; // jamais de base64 brut dans le store
    delete patchData.photoUrl;
    if (calculatedAge !== undefined) patchData.age = calculatedAge;
    if (session.email && !patchData.email) patchData.email = session.email;

    const saved = saveProfile({ ...patchData, userId: session.userId });

    // 5. Synchronisation Supabase directe (REST HTTPS)
    try {
      const { upsertProfileInSupabase, syncAlbumPhotosInSupabase, getProfileFromSupabase } = await import('@/lib/supabase-server');
      const syncAlbum = Array.isArray(body.photos) || Boolean(body.avatarUrl || body.photoUrl);

      // Seuls les champs réellement envoyés par le formulaire sont écrits : le store local de ce
      // serveur peut être périmé et ne doit jamais écraser des données plus récentes.
      const FIELDS = [
        'firstName', 'lastName', 'pseudo', 'gender', 'dateOfBirth', 'placeOfBirth', 'city', 'neighborhood',
        'profession', 'bio', 'relationshipGoal', 'relationshipStatus', 'height', 'religion', 'hasChildren',
        'languages', 'educationLevel', 'phone',
      ] as const;
      const changes: Record<string, any> = { email: session.email || saved.email };
      for (const f of FIELDS) if (body[f] !== undefined) changes[f] = body[f];
      if (calculatedAge !== undefined) changes.age = calculatedAge;
      if (coverUrl !== undefined) changes.coverUrl = coverUrl;

      // Premier enregistrement dans Supabase : on transmet le profil complet
      const existsInSupabase = await getProfileFromSupabase(session.userId, session.email || undefined);
      const payload = existsInSupabase
        ? changes
        : {
            firstName: saved.firstName, lastName: saved.lastName, pseudo: saved.pseudo, gender: saved.gender,
            city: saved.city, neighborhood: saved.neighborhood, profession: saved.profession, bio: saved.bio,
            relationshipGoal: saved.relationshipGoal, relationshipStatus: saved.relationshipStatus,
            languages: saved.languages, plan: saved.plan, ...changes,
          };
      await upsertProfileInSupabase(session.userId, {
        ...payload,
        // L'avatar est géré par la synchronisation de l'album quand des photos sont envoyées
        avatarUrl: syncAlbum ? undefined : finalAvatarUrl || undefined,
      });

      // Album envoyé par le formulaire (même vide = toutes les photos supprimées)
      if (syncAlbum) {
        await syncAlbumPhotosInSupabase(session.userId, updatedPhotos.slice(0, 4));
      }
    } catch (supaErr) {
      console.warn('[PATCH supabase sync]', supaErr);
    }

    // ── 5. Synchronisation Prisma (best-effort) ──────────────────
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
        const existingProf = await prisma.profile.findFirst({
          where: {
            OR: [
              { userId: session.userId },
              ...(body.pseudo ? [{ pseudo: { equals: body.pseudo, mode: "insensitive" as const } }] : []),
            ],
          },
        });

        if (existingProf) {
          await prisma.profile.update({
            where: { id: existingProf.id },
            data: { ...updateData, userId: session.userId },
          });
        } else {
          await prisma.profile.create({
            data: {
              userId: session.userId,
              firstName: body.firstName || saved.firstName || "Membre",
              gender: body.gender || saved.gender || "OTHER",
              city: body.city || saved.city || "Lomé",
              bio: body.bio || saved.bio || "Membre actif.",
              relationshipGoal: body.relationshipGoal || saved.relationshipGoal || "SERIOUS",
              pseudo: body.pseudo || saved.pseudo || null,
              neighborhood: body.neighborhood || saved.neighborhood || null,
              profession: body.profession || saved.profession || null,
              isVisible: true,
              profileCompleteness: 75,
              ...updateData,
            },
          });
        }
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