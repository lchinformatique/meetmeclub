// src/lib/id-check.ts
// Pré-contrôle automatique d'une pièce d'identité par Claude (lecture du document).
// L'IA décrit ce qu'elle lit ; la DÉCISION est prise ici, par des règles fixes :
// approbation automatique seulement si tout concorde, sinon contrôle par l'équipe.
// Limite assumée : l'IA ne compare pas les visages.

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { DOCUMENT_TYPES } from "./verification";

const IdReading = z.object({
  isOfficialIdentityDocument: z
    .boolean()
    .describe("true si l'image montre une vraie pièce officielle (carte, passeport, permis…) avec une photo du titulaire"),
  detectedType: z.enum(Object.keys(DOCUMENT_TYPES) as [string, ...string[]]),
  hasHolderPhoto: z.boolean().describe("une photo du visage du titulaire figure sur la pièce"),
  readable: z.boolean().describe("le nom et les informations principales sont lisibles"),
  fullName: z.string().nullable().describe("nom complet du titulaire tel qu'écrit sur la pièce"),
  dateOfBirth: z.string().nullable().describe("date de naissance au format AAAA-MM-JJ, null si absente ou illisible"),
  expiryDate: z.string().nullable().describe("date d'expiration au format AAAA-MM-JJ, null si absente"),
  nameMatchesProfile: z
    .boolean()
    .describe("le prénom ET le nom du profil correspondent au titulaire (ordre, accents, tirets et prénoms supplémentaires tolérés)"),
  suspicious: z
    .boolean()
    .describe("signes de falsification, montage, photo d'écran, capture, modèle/spécimen ou image trouvée sur Internet"),
  observations: z.string().describe("en une ou deux phrases, en français, ce qui pose problème (vide si rien)"),
});

export type IdReadingResult = z.infer<typeof IdReading>;

export interface IdCheckDecision {
  approved: boolean;
  /** Raisons du renvoi vers l'équipe (vides si approuvé) */
  reasons: string[];
  reading: IdReadingResult | null;
}

function age(dob: string): number | null {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  return now.getFullYear() - d.getFullYear() - (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
}

export function isAiCheckConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function checkIdentityDocument(input: {
  front: Buffer;
  back?: Buffer | null;
  declaredType: string;
  profile: { firstName?: string | null; lastName?: string | null };
}): Promise<IdCheckDecision> {
  if (!isAiCheckConfigured()) {
    return { approved: false, reasons: [], reading: null };
  }

  const client = new Anthropic();
  const images: Anthropic.Beta.BetaContentBlockParam[] = [
    { type: "image", source: { type: "base64", media_type: "image/jpeg", data: input.front.toString("base64") } },
  ];
  if (input.back) {
    images.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: input.back.toString("base64") } });
  }

  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(IdReading) },
      system:
        "Tu aides l'équipe d'un club de rencontres au Togo à vérifier les pièces d'identité de ses membres majeurs. " +
        "Lis la ou les photos de la pièce (recto, puis verso éventuel) et décris fidèlement ce que tu vois. " +
        "N'invente aucune information : si un champ est illisible ou absent, mets null. Sois strict sur les signes de falsification.",
      messages: [
        {
          role: "user",
          content: [
            ...images,
            {
              type: "text",
              text:
                `Type de pièce déclaré par le membre : ${DOCUMENT_TYPES[input.declaredType] || input.declaredType}.\n` +
                `Nom indiqué sur son profil : prénom « ${input.profile.firstName || ""} », nom « ${input.profile.lastName || ""} ».\n` +
                `Date du jour : ${new Date().toISOString().slice(0, 10)}.`,
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return { approved: false, reasons: ["Lecture automatique impossible : vérification par l'équipe."], reading: null };
    }

    const r = response.parsed_output;
    const reasons: string[] = [];
    if (!r.isOfficialIdentityDocument) reasons.push("Le document ne ressemble pas à une pièce d'identité officielle.");
    if (!r.hasHolderPhoto) reasons.push("Aucune photo du titulaire sur la pièce.");
    if (!r.readable) reasons.push("Pièce illisible (floue, sombre ou coupée).");
    if (r.suspicious) reasons.push(`Doute sur l'authenticité${r.observations ? ` : ${r.observations}` : "."}`);
    if (!r.nameMatchesProfile) reasons.push(`Le nom sur la pièce (${r.fullName || "illisible"}) ne correspond pas au profil.`);
    const years = r.dateOfBirth ? age(r.dateOfBirth) : null;
    if (years === null) reasons.push("Date de naissance absente ou illisible : âge non vérifiable.");
    else if (years < 18) reasons.push("Titulaire mineur selon la pièce.");
    if (r.expiryDate && !isNaN(new Date(r.expiryDate).getTime()) && new Date(r.expiryDate) < new Date()) {
      reasons.push("Pièce expirée.");
    }

    return { approved: reasons.length === 0, reasons, reading: r };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) console.error("[id-check] Clé ANTHROPIC_API_KEY invalide");
    else if (err instanceof Anthropic.RateLimitError) console.warn("[id-check] Limite de requêtes atteinte");
    else if (err instanceof Anthropic.APIError) console.warn(`[id-check] Erreur API ${err.status}:`, err.message);
    else console.warn("[id-check]", err);
    return { approved: false, reasons: ["Contrôle automatique indisponible : vérification par l'équipe."], reading: null };
  }
}
