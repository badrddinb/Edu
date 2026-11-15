// Structure of the Moroccan school system: cycles, levels, tracks (filières),
// subjects and exam types. Everything a teacher picks in the form comes from here.

export type Lang = "fr" | "ar" | "en";
export type L10n = { fr: string; ar: string };

export type CycleId = "primaire" | "college" | "lycee";

export type ExamTypeId =
  | "cc"
  | "diagnostic"
  | "local"
  | "provincial"
  | "regional"
  | "national";

export interface Subject {
  id: string;
  label: L10n;
  /** Language the exam paper is usually written in. */
  lang: Lang;
  /** True when the subject is commonly taught in either Arabic or French. */
  bilingual?: boolean;
}

export interface Track {
  id: string;
  label: L10n;
  subjects: string[];
}

export interface Level {
  id: string;
  cycle: CycleId;
  label: L10n;
  examTypes: ExamTypeId[];
  /** Subjects when the level has no tracks. */
  subjects?: string[];
  tracks?: Track[];
  /** Usual total mark of a paper at this level. */
  defaultTotal: number;
}

export const CYCLES: { id: CycleId; label: L10n }[] = [
  { id: "primaire", label: { fr: "Primaire", ar: "الابتدائي" } },
  { id: "college", label: { fr: "Collège", ar: "الثانوي الإعدادي" } },
  { id: "lycee", label: { fr: "Lycée", ar: "الثانوي التأهيلي" } },
];

const S = (
  id: string,
  fr: string,
  ar: string,
  lang: Lang,
  bilingual = false,
): Subject => ({ id, label: { fr, ar }, lang, bilingual });

export const SUBJECTS: Record<string, Subject> = Object.fromEntries(
  [
    S("arabe", "Langue arabe", "اللغة العربية", "ar"),
    S("francais", "Français", "اللغة الفرنسية", "fr"),
    S("anglais", "Anglais", "اللغة الإنجليزية", "en"),
    S("amazigh", "Langue amazighe", "اللغة الأمازيغية", "ar"),
    S("maths", "Mathématiques", "الرياضيات", "fr", true),
    S("eveil", "Éveil scientifique", "النشاط العلمي", "fr", true),
    S("pc", "Physique-Chimie", "الفيزياء والكيمياء", "fr", true),
    S("svt", "Sciences de la Vie et de la Terre", "علوم الحياة والأرض", "fr", true),
    S("hg", "Histoire-Géographie", "التاريخ والجغرافيا", "ar"),
    S("sociales", "Sciences sociales (Histoire, Géographie, Éducation à la citoyenneté)", "الاجتماعيات", "ar"),
    S("ei", "Éducation islamique", "التربية الإسلامية", "ar"),
    S("philo", "Philosophie", "الفلسفة", "ar"),
    S("info", "Informatique", "المعلوميات", "fr", true),
    S("techno", "Technologie", "التكنولوجيا", "fr", true),
    S("famille", "Éducation familiale", "التربية الأسرية", "ar"),
    S("si", "Sciences de l'ingénieur", "علوم المهندس", "fr"),
    S("eco_gen", "Économie générale et statistique", "الاقتصاد العام والإحصاء", "fr"),
    S("compta", "Comptabilité et mathématiques financières", "المحاسبة والرياضيات المالية", "fr"),
    S("eoae", "Économie et organisation administrative des entreprises", "الاقتصاد والتنظيم الإداري للمقاولات", "fr"),
    S("droit", "Droit", "القانون", "fr"),
    S("info_gestion", "Informatique de gestion", "معلوميات التدبير", "fr"),
    S("agro", "Sciences végétales et animales", "علوم النبات والحيوان", "fr"),
    S("arts_app", "Arts appliqués", "الفنون التطبيقية", "fr"),
    S("tafsir_hadith", "Tafsir et Hadith", "التفسير والحديث", "ar"),
    S("fiqh", "Fiqh et Oussoul", "الفقه والأصول", "ar"),
    S("faraid", "Tawthiq et Faraïd", "التوثيق والفرائض", "ar"),
    S("ulum_lugha", "Sciences de la langue (enseignement originel)", "علوم اللغة", "ar"),
  ].map((s) => [s.id, s]),
);

const GENERAL = ["arabe", "francais", "anglais", "hg", "ei", "philo"];
const ORIGINEL = ["tafsir_hadith", "fiqh", "faraid", "ulum_lugha"];

const T = (id: string, fr: string, ar: string, subjects: string[]): Track => ({
  id,
  label: { fr, ar },
  subjects,
});

const primary = (n: number, fr: string, ar: string): Level => ({
  id: `${n}ap`,
  cycle: "primaire",
  label: { fr: `${fr} année primaire`, ar: `السنة ${ar} ابتدائي` },
  examTypes: n === 6 ? ["cc", "diagnostic", "local", "provincial"] : ["cc", "diagnostic"],
  subjects:
    n >= 4
      ? ["arabe", "francais", "maths", "eveil", "ei", "sociales", "amazigh"]
      : ["arabe", "francais", "maths", "eveil", "ei", "amazigh"],
  defaultTotal: 10,
});

const college = (n: number, fr: string, ar: string): Level => ({
  id: `${n}ac`,
  cycle: "college",
  label: { fr: `${fr} année collège`, ar: `السنة ${ar} إعدادي` },
  examTypes: n === 3 ? ["cc", "diagnostic", "local", "regional"] : ["cc", "diagnostic"],
  subjects: [
    "maths",
    "pc",
    "svt",
    "arabe",
    "francais",
    "anglais",
    "sociales",
    "ei",
    "info",
    "techno",
    "famille",
    "amazigh",
  ],
  defaultTotal: 20,
});

export const LEVELS: Level[] = [
  primary(1, "1ʳᵉ", "الأولى"),
  primary(2, "2ᵉ", "الثانية"),
  primary(3, "3ᵉ", "الثالثة"),
  primary(4, "4ᵉ", "الرابعة"),
  primary(5, "5ᵉ", "الخامسة"),
  primary(6, "6ᵉ", "السادسة"),
  college(1, "1ʳᵉ", "الأولى"),
  college(2, "2ᵉ", "الثانية"),
  college(3, "3ᵉ", "الثالثة"),
  {
    id: "tc",
    cycle: "lycee",
    label: { fr: "Tronc commun", ar: "الجذع المشترك" },
    examTypes: ["cc", "diagnostic"],
    defaultTotal: 20,
    tracks: [
      T("tc_sci", "Sciences", "علمي", ["maths", "pc", "svt", ...GENERAL, "info"]),
      T("tc_lsh", "Lettres et Sciences Humaines", "آداب وعلوم إنسانية", [
        ...GENERAL,
        "maths",
        "svt",
        "info",
      ]),
      T("tc_tech", "Technologique", "تكنولوجي", ["maths", "pc", "si", ...GENERAL, "info"]),
      T("tc_orig", "Enseignement originel", "التعليم الأصيل", [...ORIGINEL, ...GENERAL, "maths"]),
      T("tc_pro", "Professionnel", "مهني", ["maths", "pc", ...GENERAL, "info"]),
    ],
  },
  {
    id: "1bac",
    cycle: "lycee",
    label: { fr: "1ʳᵉ année du baccalauréat", ar: "السنة الأولى بكالوريا" },
    examTypes: ["cc", "diagnostic", "regional"],
    defaultTotal: 20,
    tracks: [
      T("1bac_sx", "Sciences Expérimentales", "العلوم التجريبية", ["maths", "pc", "svt", ...GENERAL]),
      T("1bac_sm", "Sciences Mathématiques", "العلوم الرياضية", ["maths", "pc", "svt", "si", ...GENERAL]),
      T("1bac_seg", "Sciences Économiques et Gestion", "العلوم الاقتصادية والتدبير", [
        "eco_gen",
        "compta",
        "eoae",
        "droit",
        "info_gestion",
        "maths",
        ...GENERAL,
      ]),
      T("1bac_lsh", "Lettres et Sciences Humaines", "الآداب والعلوم الإنسانية", [
        ...GENERAL,
        "maths",
        "svt",
      ]),
      T("1bac_ste", "Sciences et Technologies Électriques", "العلوم والتكنولوجيات الكهربائية", [
        "si",
        "maths",
        "pc",
        ...GENERAL,
      ]),
      T("1bac_stm", "Sciences et Technologies Mécaniques", "العلوم والتكنولوجيات الميكانيكية", [
        "si",
        "maths",
        "pc",
        ...GENERAL,
      ]),
      T("1bac_aa", "Arts Appliqués", "الفنون التطبيقية", ["arts_app", "maths", "pc", ...GENERAL]),
      T("1bac_orig", "Enseignement originel", "التعليم الأصيل", [...ORIGINEL, ...GENERAL, "maths"]),
      T("1bac_pro", "Baccalauréat professionnel", "البكالوريا المهنية", ["maths", "pc", ...GENERAL]),
    ],
  },
  {
    id: "2bac",
    cycle: "lycee",
    label: { fr: "2ᵉ année du baccalauréat", ar: "السنة الثانية بكالوريا" },
    examTypes: ["cc", "diagnostic", "national"],
    defaultTotal: 20,
    tracks: [
      T("2bac_pc", "Sciences Physiques", "العلوم الفيزيائية", ["maths", "pc", "svt", ...GENERAL]),
      T("2bac_svt", "Sciences de la Vie et de la Terre", "علوم الحياة والأرض", [
        "svt",
        "pc",
        "maths",
        ...GENERAL,
      ]),
      T("2bac_agro", "Sciences Agronomiques", "العلوم الزراعية", [
        "agro",
        "svt",
        "pc",
        "maths",
        ...GENERAL,
      ]),
      T("2bac_sma", "Sciences Mathématiques A", "العلوم الرياضية أ", ["maths", "pc", "svt", ...GENERAL]),
      T("2bac_smb", "Sciences Mathématiques B", "العلوم الرياضية ب", ["maths", "pc", "si", ...GENERAL]),
      T("2bac_eco", "Sciences Économiques", "العلوم الاقتصادية", [
        "eco_gen",
        "compta",
        "eoae",
        "droit",
        "info_gestion",
        "maths",
        ...GENERAL,
      ]),
      T("2bac_sgc", "Sciences de Gestion Comptable", "علوم التدبير المحاسباتي", [
        "compta",
        "eco_gen",
        "eoae",
        "droit",
        "info_gestion",
        "maths",
        ...GENERAL,
      ]),
      T("2bac_lettres", "Lettres", "الآداب", [...GENERAL, "maths"]),
      T("2bac_sh", "Sciences Humaines", "العلوم الإنسانية", [...GENERAL, "maths"]),
      T("2bac_ste", "Sciences et Technologies Électriques", "العلوم والتكنولوجيات الكهربائية", [
        "si",
        "maths",
        "pc",
        ...GENERAL,
      ]),
      T("2bac_stm", "Sciences et Technologies Mécaniques", "العلوم والتكنولوجيات الميكانيكية", [
        "si",
        "maths",
        "pc",
        ...GENERAL,
      ]),
      T("2bac_aa", "Arts Appliqués", "الفنون التطبيقية", ["arts_app", "maths", "pc", ...GENERAL]),
      T("2bac_charia", "Sciences de la Chariaa", "العلوم الشرعية", [...ORIGINEL, ...GENERAL]),
      T("2bac_arabe", "Langue arabe (enseignement originel)", "اللغة العربية (التعليم الأصيل)", [
        ...ORIGINEL,
        ...GENERAL,
      ]),
      T("2bac_pro", "Baccalauréat professionnel", "البكالوريا المهنية", ["maths", "pc", ...GENERAL]),
    ],
  },
];

export const EXAM_TYPES: Record<
  ExamTypeId,
  { label: Record<Lang, string>; short: L10n; normalized: boolean }
> = {
  cc: {
    label: { fr: "Devoir surveillé", ar: "فرض محروس", en: "Supervised test" },
    short: { fr: "Devoir surveillé (contrôle continu)", ar: "فرض محروس (المراقبة المستمرة)" },
    normalized: false,
  },
  diagnostic: {
    label: { fr: "Évaluation diagnostique", ar: "التقويم التشخيصي", en: "Diagnostic test" },
    short: { fr: "Évaluation diagnostique", ar: "التقويم التشخيصي" },
    normalized: false,
  },
  local: {
    label: {
      fr: "Examen normalisé local",
      ar: "الامتحان الموحد المحلي",
      en: "Local standardized exam",
    },
    short: { fr: "Examen normalisé local", ar: "الامتحان الموحد المحلي" },
    normalized: true,
  },
  provincial: {
    label: {
      fr: "Examen normalisé provincial",
      ar: "الامتحان الموحد الإقليمي",
      en: "Provincial standardized exam",
    },
    short: { fr: "Examen normalisé provincial", ar: "الامتحان الموحد الإقليمي" },
    normalized: true,
  },
  regional: {
    label: {
      fr: "Examen régional normalisé",
      ar: "الامتحان الجهوي الموحد",
      en: "Regional standardized exam",
    },
    short: { fr: "Examen régional normalisé", ar: "الامتحان الجهوي الموحد" },
    normalized: true,
  },
  national: {
    label: {
      fr: "Examen national normalisé du baccalauréat",
      ar: "الامتحان الوطني الموحد للبكالوريا",
      en: "National baccalaureate exam",
    },
    short: { fr: "Examen national du baccalauréat", ar: "الامتحان الوطني الموحد للبكالوريا" },
    normalized: true,
  },
};

/** The twelve regional academies (AREF). */
export const ACADEMIES: L10n[] = [
  { fr: "Tanger-Tétouan-Al Hoceïma", ar: "طنجة - تطوان - الحسيمة" },
  { fr: "L'Oriental", ar: "الشرق" },
  { fr: "Fès-Meknès", ar: "فاس - مكناس" },
  { fr: "Rabat-Salé-Kénitra", ar: "الرباط - سلا - القنيطرة" },
  { fr: "Béni Mellal-Khénifra", ar: "بني ملال - خنيفرة" },
  { fr: "Casablanca-Settat", ar: "الدار البيضاء - سطات" },
  { fr: "Marrakech-Safi", ar: "مراكش - آسفي" },
  { fr: "Drâa-Tafilalet", ar: "درعة - تافيلالت" },
  { fr: "Souss-Massa", ar: "سوس - ماسة" },
  { fr: "Guelmim-Oued Noun", ar: "كلميم - واد نون" },
  { fr: "Laâyoune-Sakia El Hamra", ar: "العيون - الساقية الحمراء" },
  { fr: "Dakhla-Oued Ed-Dahab", ar: "الداخلة - وادي الذهب" },
];

export const DIFFICULTIES = ["accessible", "standard", "exigeant", "excellence"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const QUESTION_FORMATS = [
  "qcm",
  "vrai_faux",
  "completer",
  "ouvertes",
  "documents",
  "probleme",
] as const;
export type QuestionFormat = (typeof QUESTION_FORMATS)[number];

/** Ready-made balances between restitution, application and reasoning (percent of the marks). */
export const MIX_PRESETS = {
  equilibre: { knowledge: 30, application: 40, reasoning: 30 },
  application: { knowledge: 20, application: 60, reasoning: 20 },
  raisonnement: { knowledge: 15, application: 35, reasoning: 50 },
} as const;

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function getTrack(level: Level | undefined, trackId: string): Track | undefined {
  return level?.tracks?.find((t) => t.id === trackId);
}

export function subjectsFor(level: Level | undefined, trackId: string): Subject[] {
  if (!level) return [];
  const ids = level.tracks ? (getTrack(level, trackId)?.subjects ?? []) : (level.subjects ?? []);
  return ids.map((id) => SUBJECTS[id]).filter(Boolean);
}

/** Usual duration in minutes; the teacher can always override it. */
export function defaultDuration(level: Level, examType: ExamTypeId): number {
  if (level.cycle === "primaire") return examType === "cc" || examType === "diagnostic" ? 45 : 90;
  if (level.cycle === "college") return examType === "regional" || examType === "local" ? 120 : 60;
  if (examType === "national") return 180;
  return 120;
}
