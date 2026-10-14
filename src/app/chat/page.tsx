// src/app/chat/page.tsx
// Redirection transparente vers la messagerie
import { redirect } from "next/navigation";

export default function ChatPage() {
  redirect("/messages");
}
