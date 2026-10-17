// src/lib/countries.ts
// Tous les pays : nom (français), code ISO et indicatif téléphonique.
// Le drapeau est calculé à partir du code ISO (aucune image à charger).

export interface Country {
  iso: string;
  name: string;
  dial: string;
  flag: string;
}

const RAW: Array<[string, string, string]> = [
  ["TG", "Togo", "+228"], ["BJ", "Bénin", "+229"], ["CI", "Côte d'Ivoire", "+225"], ["GH", "Ghana", "+233"],
  ["BF", "Burkina Faso", "+226"], ["NG", "Nigeria", "+234"], ["SN", "Sénégal", "+221"], ["ML", "Mali", "+223"],
  ["NE", "Niger", "+227"], ["GN", "Guinée", "+224"], ["CM", "Cameroun", "+237"], ["GA", "Gabon", "+241"],
  ["CG", "Congo", "+242"], ["CD", "RD Congo", "+243"], ["FR", "France", "+33"], ["BE", "Belgique", "+32"],
  ["CH", "Suisse", "+41"], ["CA", "Canada", "+1"], ["US", "États-Unis", "+1"], ["GB", "Royaume-Uni", "+44"],
  ["DE", "Allemagne", "+49"],
  ["AF", "Afghanistan", "+93"], ["ZA", "Afrique du Sud", "+27"], ["AL", "Albanie", "+355"], ["DZ", "Algérie", "+213"],
  ["AD", "Andorre", "+376"], ["AO", "Angola", "+244"], ["AG", "Antigua-et-Barbuda", "+1"], ["SA", "Arabie saoudite", "+966"],
  ["AR", "Argentine", "+54"], ["AM", "Arménie", "+374"], ["AU", "Australie", "+61"], ["AT", "Autriche", "+43"],
  ["AZ", "Azerbaïdjan", "+994"], ["BS", "Bahamas", "+1"], ["BH", "Bahreïn", "+973"], ["BD", "Bangladesh", "+880"],
  ["BB", "Barbade", "+1"], ["BZ", "Belize", "+501"], ["BT", "Bhoutan", "+975"], ["BY", "Biélorussie", "+375"],
  ["MM", "Birmanie", "+95"], ["BO", "Bolivie", "+591"], ["BA", "Bosnie-Herzégovine", "+387"], ["BW", "Botswana", "+267"],
  ["BR", "Brésil", "+55"], ["BN", "Brunei", "+673"], ["BG", "Bulgarie", "+359"], ["BI", "Burundi", "+257"],
  ["KH", "Cambodge", "+855"], ["CV", "Cap-Vert", "+238"], ["CL", "Chili", "+56"], ["CN", "Chine", "+86"],
  ["CY", "Chypre", "+357"], ["CO", "Colombie", "+57"], ["KM", "Comores", "+269"], ["KR", "Corée du Sud", "+82"],
  ["KP", "Corée du Nord", "+850"], ["CR", "Costa Rica", "+506"], ["HR", "Croatie", "+385"], ["CU", "Cuba", "+53"],
  ["DK", "Danemark", "+45"], ["DJ", "Djibouti", "+253"], ["DM", "Dominique", "+1"], ["EG", "Égypte", "+20"],
  ["AE", "Émirats arabes unis", "+971"], ["EC", "Équateur", "+593"], ["ER", "Érythrée", "+291"], ["ES", "Espagne", "+34"],
  ["EE", "Estonie", "+372"], ["SZ", "Eswatini", "+268"], ["ET", "Éthiopie", "+251"], ["FJ", "Fidji", "+679"],
  ["FI", "Finlande", "+358"], ["GM", "Gambie", "+220"], ["GE", "Géorgie", "+995"], ["GR", "Grèce", "+30"],
  ["GD", "Grenade", "+1"], ["GT", "Guatemala", "+502"], ["GW", "Guinée-Bissau", "+245"], ["GQ", "Guinée équatoriale", "+240"],
  ["GY", "Guyana", "+592"], ["HT", "Haïti", "+509"], ["HN", "Honduras", "+504"], ["HK", "Hong Kong", "+852"],
  ["HU", "Hongrie", "+36"], ["IN", "Inde", "+91"], ["ID", "Indonésie", "+62"], ["IQ", "Irak", "+964"],
  ["IR", "Iran", "+98"], ["IE", "Irlande", "+353"], ["IS", "Islande", "+354"], ["IL", "Israël", "+972"],
  ["IT", "Italie", "+39"], ["JM", "Jamaïque", "+1"], ["JP", "Japon", "+81"], ["JO", "Jordanie", "+962"],
  ["KZ", "Kazakhstan", "+7"], ["KE", "Kenya", "+254"], ["KG", "Kirghizistan", "+996"], ["KI", "Kiribati", "+686"],
  ["XK", "Kosovo", "+383"], ["KW", "Koweït", "+965"], ["LA", "Laos", "+856"], ["LS", "Lesotho", "+266"],
  ["LV", "Lettonie", "+371"], ["LB", "Liban", "+961"], ["LR", "Liberia", "+231"], ["LY", "Libye", "+218"],
  ["LI", "Liechtenstein", "+423"], ["LT", "Lituanie", "+370"], ["LU", "Luxembourg", "+352"], ["MO", "Macao", "+853"],
  ["MK", "Macédoine du Nord", "+389"], ["MG", "Madagascar", "+261"], ["MY", "Malaisie", "+60"], ["MW", "Malawi", "+265"],
  ["MV", "Maldives", "+960"], ["MT", "Malte", "+356"], ["MA", "Maroc", "+212"], ["MU", "Maurice", "+230"],
  ["MR", "Mauritanie", "+222"], ["MX", "Mexique", "+52"], ["MD", "Moldavie", "+373"], ["MC", "Monaco", "+377"],
  ["MN", "Mongolie", "+976"], ["ME", "Monténégro", "+382"], ["MZ", "Mozambique", "+258"], ["NA", "Namibie", "+264"],
  ["NP", "Népal", "+977"], ["NI", "Nicaragua", "+505"], ["NO", "Norvège", "+47"], ["NZ", "Nouvelle-Zélande", "+64"],
  ["OM", "Oman", "+968"], ["UG", "Ouganda", "+256"], ["UZ", "Ouzbékistan", "+998"], ["PK", "Pakistan", "+92"],
  ["PS", "Palestine", "+970"], ["PA", "Panama", "+507"], ["PG", "Papouasie-Nouvelle-Guinée", "+675"], ["PY", "Paraguay", "+595"],
  ["NL", "Pays-Bas", "+31"], ["PE", "Pérou", "+51"], ["PH", "Philippines", "+63"], ["PL", "Pologne", "+48"],
  ["PT", "Portugal", "+351"], ["QA", "Qatar", "+974"], ["CF", "République centrafricaine", "+236"], ["DO", "République dominicaine", "+1"],
  ["CZ", "Tchéquie", "+420"], ["RO", "Roumanie", "+40"], ["RU", "Russie", "+7"], ["RW", "Rwanda", "+250"],
  ["LC", "Sainte-Lucie", "+1"], ["SM", "Saint-Marin", "+378"], ["VC", "Saint-Vincent-et-les-Grenadines", "+1"], ["SB", "Salomon", "+677"],
  ["SV", "Salvador", "+503"], ["WS", "Samoa", "+685"], ["ST", "Sao Tomé-et-Principe", "+239"], ["RS", "Serbie", "+381"],
  ["SC", "Seychelles", "+248"], ["SL", "Sierra Leone", "+232"], ["SG", "Singapour", "+65"], ["SK", "Slovaquie", "+421"],
  ["SI", "Slovénie", "+386"], ["SO", "Somalie", "+252"], ["SD", "Soudan", "+249"], ["SS", "Soudan du Sud", "+211"],
  ["LK", "Sri Lanka", "+94"], ["SE", "Suède", "+46"], ["SR", "Suriname", "+597"], ["SY", "Syrie", "+963"],
  ["TJ", "Tadjikistan", "+992"], ["TW", "Taïwan", "+886"], ["TZ", "Tanzanie", "+255"], ["TD", "Tchad", "+235"],
  ["TH", "Thaïlande", "+66"], ["TL", "Timor oriental", "+670"], ["TO", "Tonga", "+676"], ["TT", "Trinité-et-Tobago", "+1"],
  ["TN", "Tunisie", "+216"], ["TM", "Turkménistan", "+993"], ["TR", "Turquie", "+90"], ["TV", "Tuvalu", "+688"],
  ["UA", "Ukraine", "+380"], ["UY", "Uruguay", "+598"], ["VU", "Vanuatu", "+678"], ["VE", "Venezuela", "+58"],
  ["VN", "Viêt Nam", "+84"], ["YE", "Yémen", "+967"], ["ZM", "Zambie", "+260"], ["ZW", "Zimbabwe", "+263"],
  ["RE", "La Réunion", "+262"], ["GP", "Guadeloupe", "+590"], ["MQ", "Martinique", "+596"], ["GF", "Guyane française", "+594"],
  ["NC", "Nouvelle-Calédonie", "+687"], ["PF", "Polynésie française", "+689"], ["PR", "Porto Rico", "+1"],
];

function flagOf(iso: string) {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

// Afrique de l'Ouest et principaux pays d'abord, puis le reste par ordre alphabétique
const PRIORITY = 21;
export const COUNTRIES: Country[] = [
  ...RAW.slice(0, PRIORITY),
  ...RAW.slice(PRIORITY).sort((a, b) => a[1].localeCompare(b[1], "fr")),
].map(([iso, name, dial]) => ({ iso, name, dial, flag: flagOf(iso) }));

/** Retrouve le pays d'un numéro existant (indicatif le plus long qui correspond) */
export function countryFromPhone(phone: string): Country | null {
  const clean = phone.replace(/\s+/g, "");
  return (
    [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((c) => clean.startsWith(c.dial)) || null
  );
}

/** Nom du pays à partir de son code ISO (« FR » → « France ») */
export function countryName(iso?: string | null): string {
  if (!iso) return "";
  return COUNTRIES.find((c) => c.iso === iso.toUpperCase())?.name || "";
}
