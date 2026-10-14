// src/app/discuter/page.tsx
// Redirection transparente vers la messagerie
import { redirect } from "next/navigation";

export default function DiscuterPage() {
  redirect("/messages");
}
