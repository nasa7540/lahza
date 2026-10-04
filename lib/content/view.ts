import type { PublicJourney } from "./published";
import { SURAH_AR, SURAH_EN } from "./surahs";
import type { Lang, Sentence, Source } from "./types";

/** What the journey screens receive: plain approved text and verbatim sources, nothing about how it was produced. */
export type SourceView = {
  id: string;
  kind: Source["kind"];
  text_ar: string;
  /** Approved translation in the reader's language; null when the reader's language is Arabic. */
  translation: string | null;
  translator: string | null;
  reference: string;
  grade: string | null;
  url: string;
};
export type OptionView = { id: string; label: string; headline: string; reveal: string[]; sources: SourceView[] };
export type JourneyView = {
  id: string;
  title: string;
  teaser: string;
  scene: string;
  options: OptionView[];
  explanation: string[];
  /** Shown with the explanation when the reader picks "something else". */
  sources: SourceView[];
  explain_prompt: string;
  tip: { headline: string; lead: string; items: string[] };
  /** The three points the explanation step checks; shown back as covered or still to add. */
  key_points: string[];
  badge: boolean;
  approved: boolean;
};

const TRANSLATORS: Record<string, string> = {
  english_rwwad: "Rowwad Translation Center",
  urdu_junagarhi: "مولانا محمد جوناگڑھی",
  "hadeethenc-en": "HadeethEnc",
  "hadeethenc-ur": "HadeethEnc",
  "terminologyenc-en": "TerminologyEnc",
  "terminologyenc-ur": "TerminologyEnc",
};
const MAX_SOURCES = 2;

/** Footnote markers of the translation ("[80]") point at notes we do not show; the words themselves are untouched. */
function withoutFootnoteMarks(text: string): string {
  return text.replace(/\s?\[\d+\]/g, "").trim();
}

function reference(source: Source, lang: Lang): string {
  if (source.kind !== "quran") return lang === "en" ? source.reference : source.reference_ar;
  const [sura, aya] = source.reference.split(":").map(Number);
  if (lang === "en") return `Surah ${SURAH_EN[sura - 1]} ${sura}:${aya}`;
  return lang === "ur" ? `سورۃ ${SURAH_AR[sura - 1]} ${sura}:${aya}` : `سورة ${SURAH_AR[sura - 1]}، الآية ${aya}`;
}

function sourceView(source: Source, lang: Lang): SourceView {
  const t = lang === "ar" ? null : source.translations[lang];
  return {
    id: source.id,
    kind: source.kind,
    text_ar: source.text_ar,
    translation: t ? withoutFootnoteMarks(t.text) : null,
    translator: t ? (TRANSLATORS[t.translation_key] ?? t.translation_key) : null,
    reference: reference(source, lang),
    grade: source.grade,
    url: source.source_url,
  };
}

/** Sources a group of sentences rests on, in the order they are cited. Qur'an and hadith first, definitions after. */
function cited(sentences: Sentence[], sources: Source[], lang: Lang): SourceView[] {
  const ids = [...new Set(sentences.map((s) => s.segment?.split("#")[0]).filter((id): id is string => Boolean(id)))];
  return ids
    .map((id) => sources.find((s) => s.id === id))
    .filter((s): s is Source => Boolean(s))
    .sort((a, b) => Number(a.kind === "term") - Number(b.kind === "term"))
    .slice(0, MAX_SOURCES)
    .map((s) => sourceView(s, lang));
}

export function toView(journey: PublicJourney, lang: Lang): JourneyView {
  const { text, sources } = journey;
  const general = cited(text.explanation, sources, lang);
  return {
    id: journey.id,
    title: text.title,
    teaser: text.teaser,
    scene: text.scene,
    options: text.options.map((o) => {
      // The card shows the explanation under the sources, so it carries what the reveal and the explanation cite together.
      return { id: o.id, label: o.label, headline: o.reveal_headline, reveal: o.reveal.map((s) => s.text), sources: cited([...o.reveal, ...text.explanation], sources, lang) };
    }),
    explanation: text.explanation.map((s) => s.text),
    sources: general,
    explain_prompt: text.explain_prompt,
    tip: text.tip,
    key_points: text.key_points,
    badge: journey.badge,
    approved: journey.approved,
  };
}
