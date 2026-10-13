// src/app/(public)/rejoindre/page.tsx
// Redirection / Accès direct à la page d'inscription et de présentation du club

import { redirect } from "next/navigation";

export default function RejoindrePage() {
  redirect("/inscription");
}
