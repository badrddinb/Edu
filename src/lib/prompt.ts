import {
  ACADEMIES,
  EXAM_TYPES,
  SUBJECTS,
  getLevel,
  getTrack,
  type CycleId,
  type Lang,
} from "./curriculum";
import { CORRECTION_MARKER, type ExamConfig } from "./types";

const LANG_NAME: Record<Lang, string> = {
  fr: "French",
  ar: "Modern Standard Arabic",
  en: "English",
};

export const SYSTEM_PROMPT = `You write school exam papers for teachers in Morocco. The teacher who uses this tool will review your paper, perhaps edit it, then print it and hand it to their pupils, so what you write must be ready to sit: accurate, at the right level, and laid out the way Moroccan exam papers are.

## What a good paper looks like

Moroccan assessment is governed by the official programmes and, for the standardized exams (examen normalisé local, provincial, régional, national — الامتحانات الموحدة), by the cadres de référence (الأطر المرجعية) published by the Ministry of National Education. Follow the structure, the domains, the weightings and the question styles that the cadre de référence sets for the subject, level and track you are given. For a devoir surveillé (فرض محروس) the teacher has more freedom, but the paper should still train pupils for the standardized format they will eventually sit. Use your knowledge of real past papers from the Moroccan system as the model for tone, phrasing of instructions, and how questions are graded in difficulty.

Stay strictly inside the programme of the level and track, and inside the lessons the teacher lists. A question on a notion the class has not studied makes the paper unusable. Use the terminology and notation of Moroccan textbooks in the language of the paper.

Order questions from accessible to demanding so that every pupil can start and the strongest are stretched. Mix restitution of knowledge, direct application, and reasoning or problem solving in the proportions usual for the subject.

Everything must be correct and solvable. Work each exercise through before you settle on it: numerical data must lead to clean, plausible results, a function must really have the properties the questions rely on, a document must really contain what the questions ask pupils to find. The marks of the questions must add up exactly to the total of each part, and the parts to the total of the paper.

When the paper needs a supporting text, write an original one suited to the level, or reproduce a passage you are certain of from a work on the programme, and name the source honestly ("texte adapté" when it is yours). Never attribute invented sentences to a real author. Quote Qur'anic verses and hadiths only when you are certain of the exact wording, and give the sura and verse number or the hadith's source; otherwise refer to them without quoting.

## Output format

Your whole reply is the paper itself, in Markdown, with nothing before or after it: no greeting, no commentary, no code fence around the whole thing.

Do not write the header (kingdom, ministry, academy, school, subject, duration, coefficient, name fields): the application prints the official header from the teacher's settings. Begin directly with the general instructions to candidates if the exam type calls for them, or with the first part.

- Use \`##\` headings for the main parts or exercises, with their marks, for example \`## Exercice 1 (6 points)\` or \`## التمرين الأول (6 نقط)\`. Use \`###\` for sub-parts.
- Put the mark of each question at the end of its line as inline code, for example \`1,5 pt\` or \`1 ن\`. The application displays these as the marks column. Use inline code for nothing else.
- Write all mathematics, physical quantities and chemical formulas in LaTeX: \`$...$\` inline and \`$$...$$\` on its own line. Keep Latin mathematical notation, written left to right, even in an Arabic paper, as current Moroccan textbooks do.
- Use Markdown tables for data tables.
- Use blockquotes for supporting texts and documents, with a bold label such as **Document 1** or **الوثيقة 1**.
- When pupils answer on the sheet (primary school especially), leave dotted answer lines: \`…………………………………………\`.
- A figure (geometric figure, graph, circuit, experimental setup, map sketch) may be drawn as a fenced code block with the language \`svg\` containing one complete \`<svg>\` element with a \`viewBox\`, at most 600 units wide, black strokes on a white background, readable labels, no scripts and no external references. Draw a figure only when you can make it accurate; otherwise give the same information as a described document or a table. Never refer to a figure, document or annex that is not in the paper.

After the paper, on its own line, write exactly \`${CORRECTION_MARKER}\` and then the marking guide (éléments de réponse et barème — عناصر الإجابة وسلم التنقيط) in the same language: for every question, the expected answer with the key steps of the solution and how its marks are awarded. If the teacher asks for no marking guide, stop after the paper and do not write that line.`;

/** Usual paper structure per subject. Guidance, not law: the cadre de référence and the teacher win. */
function structureHint(subjectId: string, cycle: CycleId): string {
  const lycee = cycle === "lycee";
  const college = cycle === "college";
  switch (subjectId) {
    case "maths":
      if (cycle === "primaire")
        return "Domaines usuels : nombres et calcul, géométrie, mesure, organisation et traitement de données, puis une situation-problème. Les élèves répondent le plus souvent sur la feuille.";
      if (college)
        return "Exercices indépendants couvrant activités numériques et algébriques, géométrie, et le cas échéant statistiques ou fonctions, selon les leçons indiquées.";
      return "Exercices indépendants, chacun avec son barème, souvent suivis d'un problème d'analyse (étude de fonction) dans les épreuves normalisées. Préciser si la calculatrice non programmable est autorisée.";
    case "pc":
      if (lycee)
        return "Deux parties indépendantes : Chimie (habituellement 7 points) et Physique (habituellement 13 points), cette dernière en plusieurs exercices. Exiger l'expression littérale avant l'application numérique.";
      return "Structure usuelle au collège : restitution des connaissances (environ 8 points), application des connaissances (environ 8 points), situation-problème (environ 4 points).";
    case "svt":
      if (lycee)
        return "Partie I : restitution des connaissances (habituellement 5 points). Partie II : raisonnement scientifique et communication écrite et graphique (habituellement 15 points), en exercices construits sur des documents à exploiter.";
      return "Partie I : restitution des connaissances (environ 8 points). Partie II : raisonnement scientifique et communication écrite et graphique (environ 12 points), à partir de documents.";
    case "eveil":
      return "Questions courtes par domaine (sciences de la vie, sciences physiques, sciences de la Terre et de l'espace) selon les leçons indiquées : restitution, schémas à légender décrits clairement, puis une situation à résoudre.";
    case "francais":
      if (lycee)
        return "Un texte support, extrait d'une œuvre au programme du niveau quand il s'agit de l'examen régional, puis : I. Étude de texte (habituellement 10 points) ; II. Production écrite (habituellement 10 points), avec les critères d'évaluation de la production.";
      if (college)
        return "Un texte support, puis : lecture et compréhension, activités de langue (lexique, grammaire, conjugaison, orthographe), production écrite avec critères d'évaluation.";
      return "Un court texte support, puis : compréhension de l'écrit, activités réflexives sur la langue (lexique, grammaire, conjugaison, orthographe), production de l'écrit.";
    case "arabe":
      if (lycee)
        return "نص منطلق مناسب للمسلك والمجزوءة، ثم: درس النصوص (ملاحظة، فهم، تحليل، تركيب وتقويم)، علوم اللغة، التعبير والإنشاء؛ ويضاف درس المؤلفات حين يقتضيه الإطار المرجعي.";
      return "نص منطلق، ثم المجالات المعتادة: القراءة وفهم المقروء، الدرس اللغوي (تراكيب، صرف وتحويل، إملاء)، التعبير والإنشاء.";
    case "anglais":
      if (lycee)
        return "A reading text, then: Comprehension, Language (vocabulary, grammar, functions), Writing. In the baccalaureate format these carry 15, 15 and 10 points for a total of 40.";
      return "A short reading text, then comprehension, language (vocabulary, grammar, communication) and a guided writing task.";
    case "philo":
      return "صيغة الامتحان الوطني: ثلاثة مواضيع يختار المترشح واحدا منها: سؤال إشكالي مفتوح، قولة مرفقة بسؤال، نص للتحليل والمناقشة. عناصر الإجابة تفصل الفهم والتحليل والمناقشة والتركيب والجوانب الشكلية.";
    case "hg":
    case "sociales":
      if (lycee)
        return "موضوعان: الاشتغال على وثائق (في التاريخ أو الجغرافيا) بأسئلة متدرجة، وموضوع مقالي (مع إمكانية الاختيار بين موضوعين) في المادة الأخرى.";
      return "ثلاثة مكونات: التاريخ، الجغرافيا، التربية على المواطنة؛ أسئلة معرفية وأخرى للاشتغال على وثائق (نصوص، جداول، مبيانات موصوفة).";
    case "ei":
      return "وضعية تقويمية مرتبطة بواقع المتعلم، مرفقة بأسناد شرعية، ثم أسئلة متدرجة تغطي مداخل المنهاج (التزكية، الاقتداء، الاستجابة، القسط، الحكمة) بحسب الدروس المحددة.";
    case "eco_gen":
    case "eoae":
    case "compta":
    case "droit":
    case "info_gestion":
      return "Dossiers indépendants construits sur des documents et annexes (données chiffrées, extraits, tableaux à compléter), chacun avec son barème ; les annexes à rendre figurent dans l'épreuve.";
    case "si":
      return "Étude d'un système technique : présentation du système, puis situations d'évaluation (analyse fonctionnelle, chaîne d'énergie, chaîne d'information) avec documents ressources et documents réponses décrits dans l'épreuve.";
    default:
      return "";
  }
}

function describe(config: ExamConfig): string {
  const level = getLevel(config.levelId);
  if (!level) throw new Error("Unknown level");
  const track = getTrack(level, config.trackId);
  const subject =
    config.subjectId === "custom"
      ? config.customSubject
      : `${SUBJECTS[config.subjectId].label.fr} (${SUBJECTS[config.subjectId].label.ar})`;
  const type = EXAM_TYPES[config.examType];
  const lines = [
    `Subject: ${subject}`,
    `Level: ${level.label.fr} (${level.label.ar})`,
    track ? `Track: ${track.label.fr} (${track.label.ar})` : "",
    `Exam type: ${type.label.fr} (${type.label.ar})`,
    type.normalized
      ? `Session: ${config.session === "normale" ? "normale" : "de rattrapage"}`
      : `Semester ${config.semester}${config.examType === "cc" ? `, devoir n° ${config.examNumber}` : ""}`,
    `Language of the paper: ${LANG_NAME[config.lang]}`,
    `Duration: ${formatDuration(config.duration)}`,
    `Total: ${config.total} points`,
    config.coefficient ? `Coefficient: ${config.coefficient}` : "",
    config.academy >= 0 ? `Regional academy: ${ACADEMIES[config.academy].fr}` : "",
    `Difficulty: ${
      {
        standard: "the usual standard of this exam type",
        accessible: "accessible — a class that needs consolidation; keep the format, favour direct application",
        exigeant: "demanding — a strong class; keep the format, add more reasoning and synthesis",
      }[config.difficulty]
    }`,
  ];
  return lines.filter(Boolean).join("\n");
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function buildUserMessage(config: ExamConfig): string {
  const level = getLevel(config.levelId);
  if (!level) throw new Error("Unknown level");
  const hint = structureHint(config.subjectId, level.cycle);
  const parts = [
    "Write the following exam paper.",
    describe(config),
    config.topics.trim()
      ? `Lessons and units to assess, as given by the teacher:\n${config.topics.trim()}`
      : config.examType === "diagnostic"
        ? "The teacher gave no lesson list. This is a diagnostic test at the start of the year: assess the prerequisites from the previous level that this level builds on."
        : "The teacher gave no lesson list. Cover the official programme for this point of the year (the semester, or the whole year for a standardized exam), as the cadre de référence weights it.",
    hint
      ? `Usual structure of this paper in Morocco, to follow unless the official cadre de référence you know for this exact exam says otherwise:\n${hint}`
      : "",
    `The paper must be feasible by a pupil of this level in ${formatDuration(config.duration)}.`,
    config.instructions.trim()
      ? `Additional instructions from the teacher, which take priority over the usual structure:\n${config.instructions.trim()}`
      : "",
    config.withCorrection
      ? `After the paper, write ${CORRECTION_MARKER} and the detailed marking guide.`
      : "The teacher does not want a marking guide: write the paper only.",
  ];
  return parts.filter(Boolean).join("\n\n");
}

export function buildRevisionMessage(request: string): string {
  return `The teacher has read the paper and asks for this change:\n\n${request.trim()}\n\nRewrite the complete paper with the change applied, in the same format, keeping everything the teacher did not ask to change. Keep the marks consistent with the total, and update the marking guide after ${CORRECTION_MARKER} if the paper has one.`;
}
