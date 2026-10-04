"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { QuoteLockIcon, SparkIcon } from "@/components/icons";
import type { SourceView } from "@/lib/content/view";
import { uthmaniForDisplay } from "@/lib/text/uthmani";

const LONG = 220;

/** One source, shown apart from everything written about it: the verbatim text, then where it comes from. */
function SourceText({ source }: { source: SourceView }) {
  const t = useTranslations("journey");
  const [open, setOpen] = useState(false);
  const long = (source.kind === "quran" ? (source.translation?.length ?? 0) : source.text_ar.length) > LONG;
  const closed = long && !open;
  return (
    <div className="flex flex-col gap-3.5 bg-teal p-[18px] text-white" data-source={source.id}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-[.08em] text-sand uppercase rtl:text-[13px] rtl:tracking-normal">
          {t(`kind_${source.kind}`)} · {t("origK")}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-white/75">
          <QuoteLockIcon /> {t("verbatim")}
        </span>
      </div>
      {source.kind === "quran" ? (
        // A verse is always shown whole; only translations and long hadith or definitions fold.
        <p dir="rtl" lang="ar" className="text-right font-quran text-[22px] leading-[2.3]">
          {uthmaniForDisplay(source.text_ar)}
        </p>
      ) : (
        <p dir="rtl" lang="ar" className={`text-right font-arabic text-[17px] leading-[1.95] ${closed ? "line-clamp-3" : ""}`}>
          {source.text_ar}
        </p>
      )}
      {source.translation && (
        <>
          <span className="block h-px bg-sand/40" />
          <p className={`text-[15px] leading-[1.7] text-white/90 rtl:leading-[1.9] ${closed ? "line-clamp-4" : ""}`}>{source.translation}</p>
        </>
      )}
      {long && (
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="self-start py-1 text-sm font-semibold text-sand underline underline-offset-4">
          {open ? t("showLess") : t("showFull")}
        </button>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t border-white/15 pt-3 text-[13px]">
        <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">{source.reference}</span>
        {source.grade && <span className="rounded-full bg-white/10 px-3 py-1.5">{t("grade", { grade: source.grade })}</span>}
        {source.translator && <span className="text-white/75">{t("translation", { name: source.translator })}</span>}
        <a href={source.url} target="_blank" rel="noreferrer" className="ms-auto py-1 text-sand underline underline-offset-4">
          {t("viewSource")}
        </a>
      </div>
    </div>
  );
}

/** The source card: verbatim texts with their references on top, the labelled simplified explanation below. */
export function SourceCard({ sources, explanation }: { sources: SourceView[]; explanation: string[] }) {
  const t = useTranslations("journey");
  return (
    <section className="flex flex-col divide-y divide-white/20 overflow-hidden rounded-[18px] border border-line shadow-[0_8px_22px_rgba(15,76,92,.08)]">
      {sources.map((source) => (
        <SourceText key={source.id} source={source} />
      ))}
      <div className="flex flex-col gap-2.5 bg-card px-[18px] py-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold tracking-[.08em] text-mute uppercase rtl:text-[13px] rtl:tracking-normal">{t("explK")}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold bg-beige px-2.5 py-1 text-xs font-semibold text-gold-d">
            <SparkIcon size={12} /> {t("aiTag")}
          </span>
        </div>
        <p className="text-[15px] leading-[1.7] text-body rtl:text-base rtl:leading-[1.9]">{explanation.join(" ")}</p>
        <span className="text-xs leading-relaxed text-mute rtl:text-[13px]">{t("aiFoot")}</span>
      </div>
    </section>
  );
}
