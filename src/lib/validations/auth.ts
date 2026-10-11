// src/lib/validations/auth.ts
// Zod schemas for authentication endpoints

import { z } from "zod";

// ── Helpers ─────────────────────────────────────────────────────

const togoPhoneRegex = /^\+228[0-9]{8}$/;
const minAge = 18;

function getMinDateOfBirth() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - minAge);
  return d;
}

// ── Auth schemas ────────────────────────────────────────────────

export const SendOtpSchema = z.object({
  target: z
    .string()
    .min(1, "Téléphone ou email requis")
    .refine(
      (v) => togoPhoneRegex.test(v) || z.string().email().safeParse(v).success,
      "Numéro de téléphone (+228XXXXXXXX) ou email valide requis"
    ),
  type: z.enum(["SMS", "EMAIL", "WHATSAPP"]).default("SMS"),
  purpose: z
    .enum(["REGISTRATION", "LOGIN", "RESET", "PHONE_CHANGE"])
    .default("LOGIN"),
  dateOfBirth: z
    .string()
    .optional()
    .refine((v) => {
      if (!v) return true;
      const d = new Date(v);
      return !isNaN(d.getTime()) && d <= getMinDateOfBirth();
    }, `Vous devez avoir au moins ${minAge} ans pour vous inscrire.`),
});

export const VerifyOtpSchema = z.object({
  target: z.string().min(1),
  code: z
    .string()
    .length(6, "Le code doit contenir 6 chiffres")
    .regex(/^\d{6}$/, "Le code doit être numérique"),
  purpose: z.enum(["REGISTRATION", "LOGIN", "RESET", "PHONE_CHANGE"]),
});

export const RegisterSchema = z.object({
  phone: z
    .string()
    .regex(togoPhoneRegex, "Numéro au format +228XXXXXXXX requis")
    .optional(),
  email: z.string().email("Email invalide").optional(),
  dateOfBirth: z
    .string()
    .refine((v) => {
      const d = new Date(v);
      return !isNaN(d.getTime()) && d <= getMinDateOfBirth();
    }, `Vous devez avoir au moins ${minAge} ans.`),
}).refine((d) => d.phone || d.email, {
  message: "Téléphone ou email requis",
  path: ["phone"],
});

// ── Profile schemas ──────────────────────────────────────────────

export const OnboardingStep1Schema = z.object({
  firstName: z
    .string()
    .min(2, "Prénom trop court")
    .max(50, "Prénom trop long")
    .regex(/^[A-Za-zÀ-ÿ\s'-]+$/, "Caractères invalides"),
  pseudo: z
    .string()
    .min(3, "Pseudo trop court")
    .max(30, "Pseudo trop long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Lettres, chiffres, _ et - uniquement")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
});

export const OnboardingStep2Schema = z.object({
  city: z.string().min(1, "Ville requise"),
  neighborhood: z.string().optional(),
});

export const OnboardingStep3Schema = z.object({
  profession: z.string().max(100).optional(),
  educationLevel: z
    .enum(["NONE", "PRIMARY", "SECONDARY", "BACHELOR", "MASTER", "PHD", "VOCATIONAL"])
    .optional(),
  relationshipStatus: z
    .enum(["SINGLE", "DIVORCED", "WIDOWED", "SEPARATED"])
    .optional(),
});

export const OnboardingStep4Schema = z.object({
  height: z.number().int().min(100).max(250).optional(),
  religion: z.string().max(50).optional(),
  hasChildren: z.boolean().optional(),
});

export const OnboardingStep5Schema = z.object({
  languages: z
    .array(z.enum(["fr", "en", "ewe", "kabiye", "other"]))
    .min(1, "Au moins une langue requise"),
});

export const OnboardingStep6Schema = z.object({
  interestIds: z
    .array(z.string().cuid())
    .min(1, "Choisissez au moins un centre d'intérêt")
    .max(15, "Maximum 15 centres d'intérêt"),
});

export const OnboardingStep7Schema = z.object({
  relationshipGoal: z.enum(["FRIENDSHIP", "SERIOUS", "MARRIAGE", "CASUAL"]),
  bio: z
    .string()
    .max(500, "Maximum 500 caractères")
    .optional()
    .or(z.literal("")),
});

export const OnboardingStep8Schema = z.object({
  availabilities: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM requis"),
        endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM requis"),
      })
    )
    .optional(),
});

// Privacy settings
export const PrivacySchema = z.object({
  photoPrivacy: z.enum(["ALL", "VERIFIED", "MATCHES"]),
  isVisible: z.boolean(),
});
