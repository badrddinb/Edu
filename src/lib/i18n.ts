import {
  ACADEMIES,
  EXAM_TYPES,
  SUBJECTS,
  getLevel,
  getTrack,
  type Lang,
} from "./curriculum";
import type { ExamConfig } from "./types";

export type UiLang = "fr" | "ar";

const fr = {
  brand: "Imtihan",
  tagline: "Des sujets d'examen conformes au système éducatif marocain",
  myExams: "Mes examens",
  cycle: "Cycle",
  level: "Niveau",
  track: "Filière",
  subject: "Matière",
  otherSubject: "Autre matière",
  otherSubjectPlaceholder: "Nom de la matière",
  examType: "Type d'épreuve",
  semester: "Semestre",
  examNumber: "Devoir n°",
  session: "Session",
  sessionNormale: "Normale",
  sessionRattrapage: "Rattrapage",
  paperLang: "Langue du sujet",
  langFr: "Français",
  langAr: "Arabe",
  langEn: "Anglais",
  duration: "Durée (min)",
  total: "Note sur",
  coefficient: "Coefficient",
  content: "Contenu à évaluer",
  topics: "Leçons et unités",
  topicsPlaceholder:
    "Ex. : Limites et continuité, dérivation, étude de fonctions logarithmes…",
  topicsHelp:
    "Indiquez les leçons réellement étudiées. Laissez vide pour couvrir le programme officiel de la période.",
  difficulty: "Niveau de la classe",
  diff_standard: "Standard",
  diff_accessible: "À consolider",
  diff_exigeant: "Avancé",
  instructions: "Consignes particulières",
  instructionsPlaceholder:
    "Ex. : un exercice de type QCM, contexte lié à l'agriculture, pas de trigonométrie…",
  withCorrection: "Joindre les éléments de réponse et le barème",
  header: "En-tête officiel",
  headerHelp: "Ces informations sont mémorisées sur cet appareil.",
  academy: "Académie régionale (AREF)",
  none: "— Aucune —",
  direction: "Direction provinciale",
  school: "Établissement",
  teacher: "Enseignant(e)",
  schoolYear: "Année scolaire",
  generate: "Générer le sujet",
  generating: "Génération en cours…",
  stop: "Arrêter",
  phaseThinking: "Préparation du sujet selon le cadre de référence…",
  phaseWriting: "Rédaction du sujet…",
  phaseCorrection: "Rédaction du corrigé et du barème…",
  tabExam: "Sujet",
  tabCorrection: "Corrigé et barème",
  edit: "Modifier",
  preview: "Aperçu",
  print: "Imprimer / PDF",
  printExam: "Le sujet",
  printCorrection: "Le corrigé",
  printBoth: "Sujet et corrigé",
  copy: "Copier",
  copied: "Copié",
  revisePlaceholder: "Demander une modification : « rends l'exercice 2 plus difficile »…",
  revise: "Appliquer",
  emptyTitle: "Votre sujet apparaîtra ici",
  emptyBody:
    "Choisissez le niveau, la matière et le type d'épreuve, indiquez les leçons à évaluer, puis générez. Le sujet suit la structure des épreuves marocaines, avec son barème et ses éléments de réponse, prêt à imprimer.",
  seeSample: "Voir un exemple",
  sampleBadge: "Exemple",
  reviewNote:
    "Sujet rédigé par une IA : relisez l'énoncé, les données et le barème avant de le distribuer.",
  editHelp:
    "Le texte est en Markdown ; les formules entre $…$ sont en LaTeX. L'aperçu se met à jour à mesure que vous écrivez.",
  noCorrection: "Ce sujet n'a pas de corrigé.",
  historyEmpty: "Aucun examen enregistré pour l'instant. Les sujets générés sont conservés sur cet appareil.",
  open: "Ouvrir",
  delete: "Supprimer",
  close: "Fermer",
  accessCode: "Code d'accès",
  accessCodeHelp: "Ce site est réservé : saisissez le code fourni par votre administrateur.",
  save: "Valider",
  err_no_key:
    "La génération n'est pas encore activée sur ce site : la clé API du serveur n'est pas configurée (voir le fichier README).",
  err_bad_code: "Code d'accès incorrect.",
  err_invalid: "Paramètres incomplets : vérifiez le niveau, la matière et le type d'épreuve.",
  err_server_auth: "La clé API du serveur est refusée. Contactez l'administrateur du site.",
  err_server_config: "Le serveur est mal configuré (modèle ou paramètres). Contactez l'administrateur.",
  err_busy: "Le service est momentanément saturé. Réessayez dans un instant.",
  err_network: "Connexion interrompue. Vérifiez votre connexion et réessayez.",
  err_refusal: "Cette demande n'a pas pu être traitée. Reformulez les consignes et réessayez.",
  err_truncated: "Le sujet a été coupé avant la fin car il est trop long. Réduisez le contenu demandé.",
  err_unknown: "Une erreur est survenue. Réessayez.",
};

const ar: typeof fr = {
  brand: "امتحان",
  tagline: "مواضيع امتحانات مطابقة للمنظومة التربوية المغربية",
  myExams: "امتحاناتي",
  cycle: "السلك",
  level: "المستوى",
  track: "المسلك",
  subject: "المادة",
  otherSubject: "مادة أخرى",
  otherSubjectPlaceholder: "اسم المادة",
  examType: "نوع الامتحان",
  semester: "الأسدوس",
  examNumber: "الفرض رقم",
  session: "الدورة",
  sessionNormale: "العادية",
  sessionRattrapage: "الاستدراكية",
  paperLang: "لغة الموضوع",
  langFr: "الفرنسية",
  langAr: "العربية",
  langEn: "الإنجليزية",
  duration: "المدة (دقيقة)",
  total: "التنقيط على",
  coefficient: "المعامل",
  content: "المضامين المراد تقويمها",
  topics: "الدروس والوحدات",
  topicsPlaceholder: "مثال: النهايات والاتصال، الاشتقاق، دراسة الدوال اللوغاريتمية…",
  topicsHelp: "حدد الدروس التي تم إنجازها فعلا. اتركه فارغا لتغطية البرنامج الرسمي للفترة.",
  difficulty: "مستوى القسم",
  diff_standard: "عادي",
  diff_accessible: "للدعم",
  diff_exigeant: "متقدم",
  instructions: "توجيهات خاصة",
  instructionsPlaceholder: "مثال: تمرين من نوع الاختيار من متعدد، سياق مرتبط بالفلاحة…",
  withCorrection: "إرفاق عناصر الإجابة وسلم التنقيط",
  header: "الترويسة الرسمية",
  headerHelp: "تحفظ هذه المعلومات على هذا الجهاز.",
  academy: "الأكاديمية الجهوية للتربية والتكوين",
  none: "— بدون —",
  direction: "المديرية الإقليمية",
  school: "المؤسسة",
  teacher: "الأستاذ(ة)",
  schoolYear: "السنة الدراسية",
  generate: "إنشاء الموضوع",
  generating: "جار الإنشاء…",
  stop: "إيقاف",
  phaseThinking: "إعداد الموضوع وفق الإطار المرجعي…",
  phaseWriting: "تحرير الموضوع…",
  phaseCorrection: "تحرير عناصر الإجابة وسلم التنقيط…",
  tabExam: "الموضوع",
  tabCorrection: "عناصر الإجابة",
  edit: "تعديل",
  preview: "معاينة",
  print: "طباعة / PDF",
  printExam: "الموضوع",
  printCorrection: "عناصر الإجابة",
  printBoth: "الموضوع وعناصر الإجابة",
  copy: "نسخ",
  copied: "تم النسخ",
  revisePlaceholder: "اطلب تعديلا: «اجعل التمرين الثاني أصعب»…",
  revise: "تطبيق",
  emptyTitle: "سيظهر موضوعك هنا",
  emptyBody:
    "اختر المستوى والمادة ونوع الامتحان، وحدد الدروس المراد تقويمها، ثم أنشئ الموضوع. يحترم الموضوع بنية الامتحانات المغربية، مع سلم التنقيط وعناصر الإجابة، وجاهز للطباعة.",
  seeSample: "عرض مثال",
  sampleBadge: "مثال",
  reviewNote: "موضوع من إنجاز الذكاء الاصطناعي: راجع النص والمعطيات وسلم التنقيط قبل توزيعه.",
  editHelp: "النص مكتوب بصيغة Markdown، والصيغ بين $…$ مكتوبة بـ LaTeX. تتحدث المعاينة أثناء الكتابة.",
  noCorrection: "هذا الموضوع بدون عناصر إجابة.",
  historyEmpty: "لا توجد امتحانات محفوظة بعد. تحفظ المواضيع المنشأة على هذا الجهاز.",
  open: "فتح",
  delete: "حذف",
  close: "إغلاق",
  accessCode: "رمز الولوج",
  accessCodeHelp: "هذا الموقع محمي: أدخل الرمز الذي زودك به المسؤول.",
  save: "تأكيد",
  err_no_key: "خدمة الإنشاء غير مفعلة بعد على هذا الموقع: مفتاح API غير مضبوط في الخادم (انظر ملف README).",
  err_bad_code: "رمز الولوج غير صحيح.",
  err_invalid: "معطيات ناقصة: تحقق من المستوى والمادة ونوع الامتحان.",
  err_server_auth: "مفتاح API الخاص بالخادم مرفوض. اتصل بمسؤول الموقع.",
  err_server_config: "إعدادات الخادم غير صحيحة. اتصل بمسؤول الموقع.",
  err_busy: "الخدمة مشغولة حاليا. أعد المحاولة بعد قليل.",
  err_network: "انقطع الاتصال. تحقق من اتصالك وأعد المحاولة.",
  err_refusal: "تعذرت معالجة هذا الطلب. أعد صياغة التوجيهات وحاول من جديد.",
  err_truncated: "توقف تحرير الموضوع قبل نهايته لأنه طويل جدا. قلص المضامين المطلوبة.",
  err_unknown: "حدث خطأ. أعد المحاولة.",
};

export const UI = { fr, ar };
export type UiKey = keyof typeof fr;

/** Labels printed on the paper itself, in the language of the exam. */
export const PAPER: Record<Lang, Record<string, string>> = {
  fr: {
    kingdom: "Royaume du Maroc",
    ministry: "Ministère de l'Éducation Nationale, du Préscolaire et des Sports",
    academy: "Académie Régionale d'Éducation et de Formation",
    direction: "Direction provinciale",
    school: "Établissement",
    subject: "Matière",
    level: "Niveau",
    track: "Filière",
    duration: "Durée",
    coefficient: "Coefficient",
    schoolYear: "Année scolaire",
    name: "Nom et prénom",
    klass: "Classe",
    number: "N°",
    mark: "Note",
    teacher: "Enseignant(e)",
    correction: "Éléments de réponse et barème",
    semester: "Semestre",
    sessionNormale: "Session normale",
    sessionRattrapage: "Session de rattrapage",
    cc: "Devoir surveillé n°",
  },
  ar: {
    kingdom: "المملكة المغربية",
    ministry: "وزارة التربية الوطنية والتعليم الأولي والرياضة",
    academy: "الأكاديمية الجهوية للتربية والتكوين",
    direction: "المديرية الإقليمية",
    school: "المؤسسة",
    subject: "المادة",
    level: "المستوى",
    track: "المسلك",
    duration: "مدة الإنجاز",
    coefficient: "المعامل",
    schoolYear: "السنة الدراسية",
    name: "الاسم والنسب",
    klass: "القسم",
    number: "الرقم",
    mark: "النقطة",
    teacher: "الأستاذ(ة)",
    correction: "عناصر الإجابة وسلم التنقيط",
    semester: "الأسدوس",
    sessionNormale: "الدورة العادية",
    sessionRattrapage: "الدورة الاستدراكية",
    cc: "فرض محروس رقم",
  },
  en: {
    kingdom: "Kingdom of Morocco",
    ministry: "Ministry of National Education, Preschool and Sports",
    academy: "Regional Academy of Education and Training",
    direction: "Provincial Directorate",
    school: "School",
    subject: "Subject",
    level: "Level",
    track: "Stream",
    duration: "Duration",
    coefficient: "Coefficient",
    schoolYear: "School year",
    name: "Full name",
    klass: "Class",
    number: "No.",
    mark: "Mark",
    teacher: "Teacher",
    correction: "Answer key and marking scheme",
    semester: "Semester",
    sessionNormale: "Regular session",
    sessionRattrapage: "Resit session",
    cc: "Test No.",
  },
};

const ORDINAL_AR = ["الأول", "الثاني"];

/** Arabic papers use Arabic names; French and English papers use the French ones. */
const pick = (label: { fr: string; ar: string }, lang: Lang) => (lang === "ar" ? label.ar : label.fr);

export function subjectName(config: ExamConfig, lang: Lang): string {
  if (config.subjectId === "custom") return config.customSubject;
  if (lang === "en" && config.subjectId === "anglais") return "English";
  const s = SUBJECTS[config.subjectId];
  return s ? pick(s.label, lang) : "";
}

export function levelName(config: ExamConfig, lang: Lang): string {
  const l = getLevel(config.levelId);
  return l ? pick(l.label, lang) : "";
}

export function trackName(config: ExamConfig, lang: Lang): string {
  const t = getTrack(getLevel(config.levelId), config.trackId);
  return t ? pick(t.label, lang) : "";
}

export function academyName(config: ExamConfig, lang: Lang): string {
  return config.academy >= 0 ? pick(ACADEMIES[config.academy], lang) : "";
}

export function formatDuration(min: number, lang: Lang): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (lang === "ar") {
    const hours = h === 1 ? "ساعة واحدة" : h === 2 ? "ساعتان" : `${h} ساعات`;
    if (h === 0) return `${m} دقيقة`;
    return m === 0 ? hours : `${hours} و ${m} دقيقة`;
  }
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function examTitle(config: ExamConfig, lang: Lang): { title: string; sub: string } {
  const p = PAPER[lang];
  const type = EXAM_TYPES[config.examType];
  if (config.examType === "cc") {
    return {
      title: `${p.cc} ${config.examNumber}`,
      sub:
        lang === "ar"
          ? `${p.semester} ${ORDINAL_AR[config.semester - 1]}`
          : `${p.semester} ${config.semester}`,
    };
  }
  if (!type.normalized) return { title: type.label[lang], sub: "" };
  const year = config.schoolYear.split(/[/-]/)[1]?.trim() ?? "";
  const session = config.session === "normale" ? p.sessionNormale : p.sessionRattrapage;
  return { title: type.label[lang], sub: `${session} ${year}`.trim() };
}

/** One-line description used in the history list and the document title. */
export function summary(config: ExamConfig, ui: UiLang): string {
  const lang: Lang = ui;
  const type = EXAM_TYPES[config.examType].label[lang];
  return [subjectName(config, lang), levelName(config, lang), trackName(config, lang), type]
    .filter(Boolean)
    .join(" · ");
}
