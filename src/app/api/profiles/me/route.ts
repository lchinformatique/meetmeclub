// src/app/api/profiles/me/route.ts
// GET  /api/profiles/me -- get current user profile, plan & quota
// POST /api/profiles/me -- create profile
// PATCH /api/profiles/me -- update profile fields & photos directly

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getProfileByUserId, saveProfile, PLAN_LIMITS } from '@/lib/db-store';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  let profile = getProfileByUserId(session.userId);

  // Synchronisation Supabase REST en priorité pour persistence garantie
  try {
    const { getProfileFromSupabase } = await import('@/lib/supabase-server');
    const supa = await getProfileFromSupabase(session.userId);
    if (supa) {
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
        bio: supa.bio || profile?.bio || 'Nouveau membre sur Meet Me Club.',
        relationshipGoal: (supa.relationshipGoal as any) || profile?.relationshipGoal || 'SERIOUS',
        coverUrl: supa.coverUrl || profile?.coverUrl || undefined,
        plan: profile?.plan || 'FREE',
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

  // ── S'assurer que chaque utilisateur a DIRECTEMENT une photo de profil ──
  if (!profile.photos || profile.photos.length === 0) {
    // Vérifier Supabase d'abord
    try {
      const { getProfileFromSupabase } = await import('@/lib/supabase-server');
      const supa = await getProfileFromSupabase(session.userId);
      if (supa?.photos && supa.photos.length > 0) {
        profile.photos = supa.photos.map((ph: any) => ({ id: ph.id, url: ph.url, isMain: ph.isMain }));
        saveProfile({ userId: session.userId, photos: profile.photos });
      }
    } catch {}

    // Si toujours aucune photo, attribuer un avatar professionnel personnalisé
    if (!profile.photos || profile.photos.length === 0) {
      const nameForSeed = profile.firstName || profile.pseudo || 'Membre';
      const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameForSeed)}&backgroundColor=0b2559,1d4ed8&textColor=ffffff`;
      const directPhoto = { id: `avatar_${session.userId}`, url: defaultAvatar, isMain: true };
      profile.photos = [directPhoto];
      saveProfile({ userId: session.userId, photos: [directPhoto] });

      // Synchroniser avec Supabase
      try {
        const { savePhotoInSupabase } = await import('@/lib/supabase-server');
        await savePhotoInSupabase(session.userId, defaultAvatar, true);
      } catch {}
    }
  }

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

    // 2. Gestion upload photo de couverture
    let coverUrl = body.coverUrl;
    if (coverUrl && coverUrl.startsWith('data:image/')) {
      try {
        const { uploadPhoto } = await import('@/lib/cloudinary');
        const result = await uploadPhoto(coverUrl, `meetmeclub/covers/${session.userId}`);
        coverUrl = result.secure_url;
      } catch {
        console.warn('[PATCH] Cover upload to Cloudinary failed, keeping base64');
      }
    }

    // 3. Gestion album photo complet (jusqu'a 8 photos) et Avatar
    const existingProfile = getProfileByUserId(session.userId);
    let updatedPhotos = existingProfile?.photos ? [...existingProfile.photos] : [];
    let finalAvatarUrl = body.avatarUrl || body.photoUrl;

    if (Array.isArray(body.photos)) {
      const processedPhotos: Array<{ id: string; url: string; isMain: boolean }> = [];
      for (let i = 0; i < Math.min(body.photos.length, 8); i++) {
        const item = body.photos[i];
        let url = item.url;
        if (url && url.startsWith('data:image/')) {
          try {
            const { uploadProfilePhoto } = await import('@/lib/cloudinary');
            const base64Data = url.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const result = await uploadProfilePhoto(buffer, session.userId);
            url = result.url;
          } catch {
            console.warn('[PATCH] Photo upload to Cloudinary failed, keeping base64');
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
          const { uploadProfilePhoto } = await import('@/lib/cloudinary');
          const base64Data = finalAvatarUrl.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const result = await uploadProfilePhoto(buffer, session.userId);
          finalAvatarUrl = result.url;
        } catch {
          console.warn('[PATCH] Avatar upload to Cloudinary failed, keeping base64');
        }
      }

      const newPhotoObj = { id: `photo_${Date.now()}`, url: finalAvatarUrl, isMain: true };
      updatedPhotos = [
        newPhotoObj,
        ...updatedPhotos.filter((p) => p.url !== finalAvatarUrl).map((p) => ({ ...p, isMain: false })),
      ].slice(0, 8);
    }

    // 4. Mise a jour immediate du store local
    const patchData: Record<string, any> = { ...body };
    if (coverUrl !== undefined) patchData.coverUrl = coverUrl;
    if (updatedPhotos.length > 0) patchData.photos = updatedPhotos;
    if (calculatedAge !== undefined) patchData.age = calculatedAge;

    const saved = saveProfile({ ...patchData, userId: session.userId });

    // 5. Synchronisation Supabase directe (REST HTTPS)
    try {
      const { upsertProfileInSupabase, savePhotoInSupabase } = await import('@/lib/supabase-server');
      await upsertProfileInSupabase(session.userId, {
        firstName: body.firstName || saved.firstName,
        lastName: body.lastName !== undefined ? body.lastName : saved.lastName,
        pseudo: body.pseudo !== undefined ? body.pseudo : saved.pseudo,
        gender: body.gender || saved.gender,
        dateOfBirth: body.dateOfBirth !== undefined ? body.dateOfBirth : saved.dateOfBirth,
        placeOfBirth: body.placeOfBirth !== undefined ? body.placeOfBirth : saved.placeOfBirth,
        age: calculatedAge !== undefined ? calculatedAge : saved.age,
        city: body.city || saved.city,
        neighborhood: body.neighborhood !== undefined ? body.neighborhood : saved.neighborhood,
        profession: body.profession !== undefined ? body.profession : saved.profession,
        bio: body.bio !== undefined ? body.bio : saved.bio,
        relationshipGoal: body.relationshipGoal || saved.relationshipGoal,
        relationshipStatus: body.relationshipStatus !== undefined ? body.relationshipStatus : saved.relationshipStatus,
        height: body.height !== undefined ? body.height : saved.height,
        religion: body.religion !== undefined ? body.religion : saved.religion,
        hasChildren: body.hasChildren !== undefined ? body.hasChildren : saved.hasChildren,
        languages: body.languages !== undefined ? body.languages : saved.languages,
        educationLevel: body.educationLevel !== undefined ? body.educationLevel : saved.educationLevel,
        phone: body.phone !== undefined ? body.phone : saved.phone,
        avatarUrl: finalAvatarUrl || undefined,
        coverUrl: coverUrl !== undefined ? coverUrl : saved.coverUrl,
      });

      // Synchroniser toutes les photos vers Supabase
      if (updatedPhotos && updatedPhotos.length > 0) {
        for (const ph of updatedPhotos) {
          try {
            await savePhotoInSupabase(session.userId, ph.url, ph.isMain);
          } catch {}
        }
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
        await prisma.profile.upsert({
          where: { userId: session.userId },
          update: updateData,
          create: {
            userId: session.userId,
            firstName: body.firstName || saved.firstName || 'Membre',
            gender: body.gender || saved.gender || 'OTHER',
            city: body.city || saved.city || 'Lomé',
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