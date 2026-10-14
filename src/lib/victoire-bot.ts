// src/lib/victoire-bot.ts
// Automated realistic & charming conversational engine for Victoire (@victoire_lome)

export const VICTOIRE_USER_ID = "user_victoire_lome";

export function isVictoire(userId?: string, pseudo?: string, firstName?: string): boolean {
  if (!userId && !pseudo && !firstName) return false;
  return (
    userId === VICTOIRE_USER_ID ||
    userId === "prof_victoire_lome" ||
    pseudo?.toLowerCase() === "victoire_lome" ||
    pseudo?.toLowerCase() === "@victoire_lome" ||
    firstName?.toLowerCase() === "victoire"
  );
}

export function getVictoireReply(userMessage: string, mediaType?: "image" | "audio" | "location"): string {
  const text = (userMessage || "").toLowerCase().trim();

  // 1. Réponse si photo envoyée
  if (mediaType === "image" || text.includes("photo") || text.includes("📷")) {
    const photoReplies = [
      "Waouh, magnifique photo ! Tu as vraiment beaucoup de charme et une très belle énergie ✨",
      "J'adore cette photo ! C'est super de pouvoir mettre un visage sur nos échanges. Tu as l'air très sympa 😊",
      "Superbe cliché ! Tu es très élégant. Tu as pris cette photo où à Lomé ?",
    ];
    return photoReplies[Math.floor(Math.random() * photoReplies.length)];
  }

  // 2. Réponse si localisation partagée
  if (mediaType === "location" || text.includes("📍") || text.includes("gps") || text.includes("maps")) {
    return "Super repère ! J'adore ce coin à Lomé, c'est tellement agréable pour se poser et discuter. On pourrait s'y croiser un de ces jours pour un café ou un verre en terrasse 🍹 Qu'en dis-tu ?";
  }

  // 3. Réponse si note vocale
  if (mediaType === "audio" || text.includes("🎙️") || text.includes("vocale")) {
    return "J'ai bien écouté ta note vocale ! Tu as une voix très douce et chaleureuse, c'est très agréable à écouter 😊";
  }

  // 4. Salutations
  if (
    text.match(/\b(salut|bonjour|coucou|hello|bonsoir|hey|hi|yo)\b/) ||
    text === "cc" ||
    text === "bjr" ||
    text === "slt"
  ) {
    const greetings = [
      "Coucou ! Ravie de faire ta connaissance 😊 Comment vas-tu aujourd'hui ? Tu es dans quel quartier à Lomé ?",
      "Bonjour ! 👋 Ça me fait vraiment plaisir de te lire. Tu as passé une bonne journée ?",
      "Coucou toi ! Bienvenue sur le club. J'espère que tout va bien pour toi aujourd'hui ! Qu'est-ce qui t'amène sur Meet Me Club ? ✨",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // 5. Compliments
  if (
    text.includes("belle") ||
    text.includes("jolie") ||
    text.includes("magnifique") ||
    text.includes("canon") ||
    text.includes("charme") ||
    text.includes("beauté") ||
    text.includes("ravissante") ||
    text.includes("mignonne")
  ) {
    const compliments = [
      "Oh c'est adorable, merci beaucoup ! 🥰 Tu es très galant. Toi aussi tu as l'air d'être quelqu'un de super gentil. Tu fais quoi dans la vie ?",
      "C'est très gentil à toi, tu me fais sourire ! 😊 Qu'est-ce qui t'a le plus plu dans mon profil ?",
      "Merci du fond du cœur ! 🥰 J'aime les personnes attentionnées comme toi. Raconte-moi un peu tes passions !",
    ];
    return compliments[Math.floor(Math.random() * compliments.length)];
  }

  // 6. Activité / Métier
  if (
    text.includes("tu fais quoi") ||
    text.includes("travail") ||
    text.includes("boulot") ||
    text.includes("profession") ||
    text.includes("styliste") ||
    text.includes("mode")
  ) {
    return "Je suis styliste et créatrice de mode ici à Lomé ! 👗 J'adore imaginer des pièces uniques et profiter des soirées calmes en bord de mer. Et toi, dans quel domaine travailles-tu ?";
  }

  // 7. Rencontre / Rendez-vous / Sortie
  if (
    text.includes("rencontrer") ||
    text.includes("rendez-vous") ||
    text.includes("sortie") ||
    text.includes("café") ||
    text.includes("boire") ||
    text.includes("resto") ||
    text.includes("dîner") ||
    text.includes("verre") ||
    text.includes("voir")
  ) {
    return "J'adorerais ! J'aime les personnes spontanées qui savent ce qu'elles veulent. Tu préfères un endroit calme pour discuter ou plutôt un lieu branché avec de la bonne musique ? 🍸";
  }

  // 8. Demande de numéro / WhatsApp
  if (
    text.includes("numéro") ||
    text.includes("whatsapp") ||
    text.includes("téléphone") ||
    text.includes("numero") ||
    text.includes("contact")
  ) {
    return "On apprend un peu plus à se connaître ici sur le club d'abord, c'est tellement plus convivial et direct ! Mais promis, si le feeling passe bien, on échangera nos numéros très vite 😉 Tu habites vers où à Lomé ?";
  }

  // 9. Âge / Présentation
  if (text.includes("âge") || text.includes("ans") || text.includes("age")) {
    return "J'ai 24 ans ! Et toi, quel âge as-tu ? 😊";
  }

  // 10. Quartier / Lomé
  if (text.includes("lome") || text.includes("lomé") || text.includes("quartier") || text.includes("habite")) {
    return "Je suis entre Tokoin et Nyékonakpoè ! J'aime beaucoup me promener vers la marina ou la plage de Lomé le soir. Et toi, tu es dans quel quartier ?";
  }

  // 11. Réponses contextuelles générales et engageantes
  const generalReplies = [
    "C'est super intéressant ! Dis-moi, tu cherches quoi comme type de relation sur Meet Me Club ? Une belle rencontre sérieuse ou plutôt des sorties conviviales ? 😊",
    "J'aime beaucoup ta façon d'échanger ! Tu as des projets sympas prévus pour ce week-end à Lomé ? ✨",
    "Tout à fait d'accord avec toi ! D'ailleurs, quels sont tes endroits préférés pour te détendre à Lomé ?",
    "Tu as l'air d'être quelqu'un de très ouvert d'esprit. C'est rare et très agréable ! Dis-moi en plus sur toi 😉",
    "C'est noté ! Et si on devait organiser une sortie idéale selon toi, ce serait quoi le programme ? 💖",
  ];

  return generalReplies[Math.floor(Math.random() * generalReplies.length)];
}
