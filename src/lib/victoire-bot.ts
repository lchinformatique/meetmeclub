// src/lib/victoire-bot.ts
// Victoire est l'ASSISTANTE AUTOMATIQUE de Meet Me Club — pas une vraie personne.
// Elle est toujours présentée comme telle (nom, bio, aucun badge « vérifié ») et ne répond
// qu'aux questions pratiques sur le club : vérification, pass, rendez-vous, sécurité.

export const VICTOIRE_USER_ID = "user_victoire_lome";

/** Présentation affichée partout sur le site (découverte, messagerie, fiche profil) */
export const VICTOIRE_ASSISTANT = {
  firstName: "Victoire · Assistante",
  lastName: "Meet Me Club",
  profession: "Assistante automatique du club",
  bio:
    "🤖 Je suis l'assistante automatique de Meet Me Club, pas une vraie personne. " +
    "Je réponds 24 h/24 à vos questions sur le club : vérification du profil, pass, rendez-vous et sécurité.",
  age: undefined as number | undefined,
  dateOfBirth: undefined as string | undefined,
  relationshipStatus: undefined as string | undefined,
  plan: "FREE",
  likesCount: 0,
  isBot: true,
  isVerified: false,
};

export function isVictoire(userId?: string, pseudo?: string): boolean {
  if (!userId && !pseudo) return false;
  return (
    userId === VICTOIRE_USER_ID ||
    userId === "prof_victoire_lome" ||
    pseudo?.toLowerCase() === "victoire_lome" ||
    pseudo?.toLowerCase() === "@victoire_lome"
  );
}

/** Remplace l'ancienne présentation de Victoire par celle de l'assistante */
export function asAssistant<T extends Record<string, any>>(p: T): T {
  return { ...p, ...VICTOIRE_ASSISTANT, verifications: [] };
}

const SIGNATURE = "\n\n— Victoire, assistante automatique 🤖";

export function getVictoireReply(userMessage: string, mediaType?: "image" | "audio" | "location"): string {
  const text = (userMessage || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
  const has = (...words: string[]) => words.some((w) => text.includes(w));
  const reply = (s: string) => s + SIGNATURE;

  if (mediaType === "image" || mediaType === "audio") {
    return reply(
      "Je suis une assistante automatique : je ne peux pas voir les photos ni écouter les notes vocales. Écrivez-moi votre question en quelques mots et je vous guide."
    );
  }
  if (mediaType === "location") {
    return reply("Merci ! Pour vos rendez-vous, choisissez de préférence un lieu public et fréquenté, et prévenez un proche.");
  }

  // Est-ce une vraie personne ?
  if (has("robot", "bot", "vraie", "vrai personne", "humain", "reel", "qui es-tu", "qui es tu", "t'es qui")) {
    return reply(
      "Je ne suis pas une vraie personne : je suis l'assistante automatique de Meet Me Club. Les autres profils, eux, sont de vrais membres dont le visage a été vérifié par l'équipe."
    );
  }

  // Vérification du visage
  if (has("verif", "selfie", "valid", "visage", "photo", "geste", "attente", "refus")) {
    return reply(
      "Vérification du profil (menu Profil → Sécurité → « Faire ma vérification ») : en essai gratuit, un selfie en direct avec le geste demandé ; avec un pack 3 000 ou 6 000, une photo de votre pièce d'identité (carte d'identité, passeport, permis, carte d'électeur, carte d'étudiant…) ; en VIP, une courte vidéo qui débloque aussi les appels. Dès la validation, vous apparaissez dans la découverte et pouvez échanger. Tout reste privé."
    );
  }

  // Pass / paiement
  if (has("pass", "prix", "tarif", "payer", "paiement", "abonnement", "vip", "complice", "essentiel", "flooz", "tmoney", "mixx")) {
    return reply(
      "Les pass se prennent dans « Tarifs » (paiement mobile sécurisé). Après le paiement, votre pass est activé automatiquement. En cas de souci, contactez le support depuis la page Contact avec la référence de votre paiement."
    );
  }

  // Rendez-vous
  if (has("rendez", "rdv", "sortie", "rencontrer", "lieu", "restaurant", "resto", "cafe", "diner")) {
    return reply(
      "Pour proposer un rendez-vous à un membre, ouvrez votre conversation avec lui puis le menu « Rendez-vous ». Conseils : un lieu public, en journée ou en début de soirée, et un proche prévenu de votre sortie."
    );
  }

  // Sécurité
  if (has("arnaque", "argent", "signaler", "harcel", "danger", "securite", "bloquer", "faux")) {
    return reply(
      "Sécurité : n'envoyez jamais d'argent à un membre et ne partagez pas vos codes. Pour signaler un comportement suspect, écrivez au support depuis la page Contact en indiquant le pseudo du membre."
    );
  }

  // Numéro / contact
  if (has("numero", "whatsapp", "telephone", "contact", "support", "aide")) {
    return reply(
      "Pour parler à l'équipe Meet Me Club, utilisez la page Contact ou le bouton d'aide en bas de l'écran. Entre membres, échangez d'abord sur la messagerie du club : elle est privée et sécurisée."
    );
  }

  // Salutations et le reste
  if (has("salut", "bonjour", "bonsoir", "coucou", "hello", "hey") || ["cc", "bjr", "slt"].includes(text)) {
    return reply(
      "Bonjour et bienvenue sur Meet Me Club ! Je suis l'assistante automatique du club. Je peux vous aider sur : la vérification de votre profil, les pass, les rendez-vous et la sécurité. Quelle est votre question ?"
    );
  }

  return reply(
    "Je suis l'assistante automatique du club et je réponds aux questions pratiques. Écrivez par exemple « vérification », « pass », « rendez-vous » ou « sécurité ». Pour une autre demande, contactez l'équipe depuis la page Contact."
  );
}
