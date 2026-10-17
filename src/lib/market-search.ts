// src/lib/market-search.ts
// Recherche « intelligente » du Marché : insensible aux accents, majuscules et pluriels,
// mot par mot, avec synonymes courants ; tient compte du titre, de la description, de la
// catégorie, de la ville et du nom de l'annonceur. Les annonces les plus pertinentes d'abord.

import { CATEGORIES } from "./market-constants";

/** Retire accents, majuscules et ponctuation */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Forme de base d'un mot : pluriels et terminaisons simples retirés */
function stem(word: string): string {
  if (word.length <= 3) return word;
  return word.replace(/(aux)$/, "al").replace(/(eaux|eux)$/, "eu").replace(/(es|s|x)$/, "");
}

/** Mots vides ignorés dans la recherche */
const STOP = new Set(["le", "la", "les", "un", "une", "des", "de", "du", "d", "l", "a", "au", "aux", "et", "ou", "en", "pour", "avec", "sur", "dans", "je", "cherche", "recherche", "besoin", "veux", "the", "a", "for"]);

/** Synonymes : chaque groupe désigne la même chose */
const SYNONYMS: string[][] = [
  ["hotel", "hebergement", "chambre", "residence", "auberge", "motel", "nuitee", "sejour", "lodge", "guesthouse"],
  ["appartement", "appart", "studio", "logement", "maison", "villa", "location", "louer", "immobilier", "terrain", "parcelle", "bureau", "local"],
  ["restaurant", "resto", "maquis", "bar", "snack", "fastfood", "cuisine", "plat", "repas", "traiteur", "manger", "boisson"],
  ["voiture", "vehicule", "auto", "automobile", "moto", "scooter", "camion", "taxi", "transport"],
  ["telephone", "tel", "smartphone", "portable", "mobile", "iphone", "samsung", "android", "tablette", "ordinateur", "pc", "laptop", "electronique"],
  ["coiffure", "coiffeur", "coiffeuse", "tresse", "perruque", "salon", "beaute", "maquillage", "esthetique", "manucure", "onglerie"],
  ["vetement", "habit", "robe", "chemise", "pagne", "couture", "couturier", "couturiere", "tailleur", "mode", "chaussure", "sac"],
  ["evenement", "fete", "soiree", "concert", "club", "boite", "anniversaire", "mariage", "dj", "sono", "decoration", "deco"],
  ["artisan", "menuisier", "menuiserie", "soudeur", "plombier", "plomberie", "electricien", "maconnerie", "macon", "peintre", "reparation", "depannage"],
  ["emploi", "travail", "job", "poste", "recrutement", "stage", "formation", "cours", "professeur", "enseignant"],
  ["sante", "massage", "spa", "sport", "salle", "fitness", "coach", "pharmacie", "bienetre"],
  ["meuble", "canape", "lit", "matelas", "frigo", "refrigerateur", "climatiseur", "clim", "electromenager", "television", "tv"],
  ["nourriture", "alimentation", "epicerie", "supermarche", "boutique", "marche", "courses"],
];

const SYN_INDEX = new Map<string, string[]>();
for (const group of SYNONYMS) {
  const stems = group.map(stem);
  for (const w of stems) SYN_INDEX.set(w, Array.from(new Set([...(SYN_INDEX.get(w) || []), ...stems])));
}

/** Mots de la requête, chacun avec ses variantes (synonymes) */
export function queryTerms(q: string): string[][] {
  return normalize(q)
    .split(" ")
    .filter((w) => w && !STOP.has(w))
    .slice(0, 8)
    .map((w) => {
      const s = stem(w);
      return Array.from(new Set([s, ...(SYN_INDEX.get(s) || [])]));
    });
}

function wordsOf(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean).map(stem);
}

/** Un mot du texte correspond à une variante : égalité, ou début de mot (au moins 3 lettres) */
function matches(words: string[], variants: string[]): boolean {
  // Début de mot : « tel » → « telephone » ; un mot du texte à peine plus court que la variante
  // (« appart » → « appartement » non, « coiffeu » → « coiffeuse » oui) pour éviter « maquis » → « maquillage »
  return variants.some((v) =>
    words.some((w) => w === v || (v.length >= 3 && w.startsWith(v)) || (w.length >= 5 && v.startsWith(w) && v.length - w.length <= 2))
  );
}

export interface Searchable {
  title: string;
  description: string | null;
  category: string;
  city: string | null;
  pro?: { name?: string | null; city?: string | null } | null;
}

/** Score de pertinence (0 = ne correspond pas) */
export function scoreListing(l: Searchable, terms: string[][]): number {
  if (!terms.length) return 1;
  const title = wordsOf(l.title);
  const cat = wordsOf(`${CATEGORIES[l.category]?.label || ""} ${l.category}`);
  const desc = wordsOf(l.description || "");
  const place = wordsOf(`${l.city || ""} ${l.pro?.city || ""} ${l.pro?.name || ""}`);
  let score = 0;
  let found = 0;
  for (const variants of terms) {
    let s = 0;
    if (matches(title, variants)) s = Math.max(s, 6);
    if (matches(cat, variants)) s = Math.max(s, 4);
    if (matches(place, variants)) s = Math.max(s, 3);
    if (matches(desc, variants)) s = Math.max(s, 2);
    if (s > 0) found++;
    score += s;
  }
  if (!found) return 0;
  // Bonus quand tous les mots tapés sont trouvés
  return score + (found === terms.length ? 5 : 0);
}
