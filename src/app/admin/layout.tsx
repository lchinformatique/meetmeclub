// src/app/admin/layout.tsx
// Espace de gestion : accessible uniquement à l'administrateur (vérifié côté serveur).
// Tout autre visiteur est renvoyé vers son profil, sans jamais voir ces pages.

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/connexion?callbackUrl=/admin");
  if (!(await isAdminSession(session))) redirect("/profil");
  return <>{children}</>;
}
