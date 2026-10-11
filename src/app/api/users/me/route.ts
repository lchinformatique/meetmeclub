// src/app/api/users/me/route.ts
// DELETE /api/users/me — GDPR soft delete user account and invalidate session

import { NextResponse } from "next/server";
import { getSession, deleteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    // Soft delete user and hide profile
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.userId },
        data: {
          deletedAt: new Date(),
          status: "SUSPENDED",
        },
      }),
      prisma.profile.updateMany({
        where: { userId: session.userId },
        data: { isVisible: false },
      }),
      prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "ACCOUNT_DELETED_BY_USER",
          entity: "users",
          entityId: session.userId,
        },
      }),
    ]);

    await deleteSession();

    return NextResponse.json({ success: true, message: "Votre compte a été supprimé." });
  } catch (error) {
    console.error("[users/me DELETE]", error);
    return NextResponse.json({ error: "Erreur lors de la suppression du compte." }, { status: 500 });
  }
}
