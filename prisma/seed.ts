// prisma/seed.ts
// Seed initial data: interests, admin settings

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INTERESTS = [
  // Loisirs
  { name: "Voyages", icon: "✈️", category: "Loisirs", nameEn: "Travel", nameEwe: "Gbɔgbɔe", order: 1 },
  { name: "Musique", icon: "🎵", category: "Loisirs", nameEn: "Music", nameEwe: "Heno", order: 2 },
  { name: "Cinéma", icon: "🎬", category: "Loisirs", nameEn: "Movies", nameEwe: "Sinema", order: 3 },
  { name: "Lecture", icon: "📚", category: "Loisirs", nameEn: "Reading", nameEwe: "Gɔme xle", order: 4 },
  { name: "Danse", icon: "💃", category: "Loisirs", nameEn: "Dancing", nameEwe: "Aɖaŋu", order: 5 },
  { name: "Art & Peinture", icon: "🎨", category: "Loisirs", nameEn: "Art & Painting", nameEwe: "Nuŋɔŋlɔ", order: 6 },
  { name: "Photographie", icon: "📷", category: "Loisirs", nameEn: "Photography", order: 7 },
  { name: "Jeux vidéo", icon: "🎮", category: "Loisirs", nameEn: "Video Games", order: 8 },
  // Sport
  { name: "Football", icon: "⚽", category: "Sport", nameEn: "Football", order: 10 },
  { name: "Basketball", icon: "🏀", category: "Sport", nameEn: "Basketball", order: 11 },
  { name: "Fitness", icon: "💪", category: "Sport", nameEn: "Fitness", order: 12 },
  { name: "Natation", icon: "🏊", category: "Sport", nameEn: "Swimming", order: 13 },
  { name: "Yoga", icon: "🧘", category: "Sport", nameEn: "Yoga", order: 14 },
  { name: "Course à pied", icon: "🏃", category: "Sport", nameEn: "Running", order: 15 },
  // Gastronomie
  { name: "Cuisine", icon: "👨‍🍳", category: "Gastronomie", nameEn: "Cooking", order: 20 },
  { name: "Restaurants", icon: "🍽️", category: "Gastronomie", nameEn: "Restaurants", order: 21 },
  { name: "Café & Lounge", icon: "☕", category: "Gastronomie", nameEn: "Café & Lounge", order: 22 },
  // Lifestyle
  { name: "Mode & Style", icon: "👗", category: "Lifestyle", nameEn: "Fashion", order: 30 },
  { name: "Nature", icon: "🌿", category: "Lifestyle", nameEn: "Nature", order: 31 },
  { name: "Animaux", icon: "🐾", category: "Lifestyle", nameEn: "Pets", order: 32 },
  { name: "Spiritualité", icon: "🙏", category: "Lifestyle", nameEn: "Spirituality", order: 33 },
  { name: "Bénévolat", icon: "❤️", category: "Lifestyle", nameEn: "Volunteering", order: 34 },
  // Professionnel
  { name: "Business", icon: "💼", category: "Professionnel", nameEn: "Business", order: 40 },
  { name: "Tech & Innovation", icon: "💻", category: "Professionnel", nameEn: "Tech", order: 41 },
  { name: "Entrepreneuriat", icon: "🚀", category: "Professionnel", nameEn: "Entrepreneurship", order: 42 },
];

const DEFAULT_SETTINGS = [
  { key: "min_age", value: 18 },
  { key: "max_photos", value: 8 },
  { key: "otp_ttl_minutes", value: 5 },
  { key: "otp_max_attempts", value: 3 },
  { key: "platform_commission_percent", value: 15 },
  { key: "cancelled_refund_hours", value: 24 },
  { key: "maintenance_mode", value: false },
  {
    key: "pack_discovery",
    value: {
      name: "Découverte",
      price: 2000,
      description: "Rencontre simple en lieu public",
      features: ["Lieu public", "Chat inclus", "Rappels automatiques"],
      color: "#6B7280",
    },
  },
  {
    key: "pack_complice",
    value: {
      name: "Complice",
      price: 5000,
      description: "Table réservée + 1 boisson par personne",
      features: ["Table réservée", "1 boisson incluse", "Chat dédié", "Rappels"],
      color: "#0B2E6B",
    },
  },
  {
    key: "pack_dinner",
    value: {
      name: "Dîner",
      price: 12000,
      description: "Menu complet dans un lieu partenaire",
      features: ["Table réservée", "Menu entrée/plat/boisson", "Ambiance soignée", "Rappels"],
      color: "#E10600",
    },
  },
  {
    key: "pack_vip",
    value: {
      name: "VIP Premium",
      price: 30000,
      description: "Espace privatif, menu complet, accueil dédié",
      features: ["Espace privatif", "Menu complet", "Boissons au choix", "Accueil dédié", "Options : fleurs, gâteau"],
      color: "#B8860B",
    },
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Upsert interests
  for (const interest of INTERESTS) {
    await prisma.interest.upsert({
      where: { name: interest.name },
      update: interest,
      create: interest,
    });
  }
  console.log(`✅ ${INTERESTS.length} interests seeded`);

  // Upsert admin settings
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.adminSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value as any },
      create: { key: setting.key, value: setting.value as any },
    });
  }
  console.log(`✅ ${DEFAULT_SETTINGS.length} admin settings seeded`);

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
