"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowIcon, BackIcon, CheckIcon, CupIcon, InfoIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import type { JourneyView } from "@/lib/content/view";
import { markDone, track } from "@/lib/progress";
import { SourceCard } from "./SourceCard";

const OTHER = "other";
const STEPS = 4;
const BUTTON = "flex h-[52px] w-full shrink-0 items-center justify-center gap-2.5 rounded-[14px] bg-teal text-base font-semibold text-white transition-colors duration-150 hover:bg-teal-d disabled:cursor-not-allowed disabled:opacity-40";
const KICKER = "text-xs font-semibold tracking-[.08em] text-gold-d uppercase rtl:text-[13px] rtl:tracking-normal";

/** One journey: scene, reveal, explain in your words, tip for the workday. All text arrives already approved. */
export function Player({ journey }: { journey: JourneyView }) {
  const t = useTranslations("journey");
  const lang = useLocale();
  const [step, setStep] = useState(1);
  const [choice, setChoice] = useState("");
  const [text, setText] = useState("");
  const draftKey = `lahza.explain.${journey.id}`;

  useEffect(() => {
    track({ type: "start", journey_id: journey.id, lang });
  }, [journey.id, lang]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const picked = journey.options.find((o) => o.id === choice);
  const reveal = () => {
    track({ type: "choice", journey_id: journey.id, lang, choice });
    setStep(2);
  };
  const toExplain = () => {
    try {
      setText(localStorage.getItem(draftKey) ?? "");
    } catch {
      // No storage: start with an empty field.
    }
    setStep(3);
  };
  const write = (value: string) => {
    setText(value);
    try {
      localStorage.setItem(draftKey, value);
    } catch {
      // The text still lives in the field for this visit.
    }
  };
  const finish = () => {
    markDone(journey.id);
    track({ type: "complete", journey_id: journey.id, lang });
    setStep(4);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {step === 1 ? (
          <Link href="/home" aria-label={t("home")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-card text-teal">
            <BackIcon />
          </Link>
        ) : (
          <button type="button" onClick={() => setStep(step - 1)} aria-label={t("back")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-card text-teal">
            <BackIcon />
          </button>
        )}
        <div className="grid grow grid-cols-4 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step} aria-label={t("step", { n: step })}>
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={`h-1 rounded ${n <= step ? "bg-gold" : "bg-line"}`} />
          ))}
        </div>
      </div>

      {!journey.approved ? (
        <p data-testid="unapproved" className="rounded-xl border border-warn bg-warn/10 px-3.5 py-2.5 text-sm font-semibold text-warn">{t("unapproved")}</p>
      ) : (
        journey.badge && <p data-testid="badge" className="rounded-xl border border-gold bg-beige px-3.5 py-2.5 text-sm text-gold-d">{t("badge")}</p>
      )}

      {step === 1 && (
        <>
          <span className={KICKER}>
            {journey.title} · {t("sceneK")}
          </span>
          <h1 className="text-lg leading-[1.6] font-semibold text-teal rtl:leading-[1.85]" data-testid="scene">
            {journey.scene}
          </h1>
          <div role="radiogroup" aria-label={t("sceneK")} className="flex flex-col gap-2.5">
            {[...journey.options.map((o) => [o.id, o.label]), [OTHER, t("other")]].map(([id, label]) => {
              const on = choice === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setChoice(id)}
                  className={`flex min-h-[52px] items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-start text-base text-ink ${on ? "border-[1.5px] border-teal bg-ic font-semibold" : "border border-line bg-card hover:border-sand"}`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] ${on ? "border-teal" : "border-[#c9cfd2]"}`}>
                    {on && <span className="h-2 w-2 rounded-full bg-teal" />}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
          <span className="flex items-center gap-2 text-sm text-mute">
            <InfoIcon /> {t("sceneHint")}
          </span>
          <div className="sticky bottom-0 z-10 -mx-[22px] mt-auto bg-linear-to-t from-cream from-75% to-transparent px-[22px] pt-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button type="button" className={BUTTON} disabled={!choice} onClick={reveal}>
              {t("sceneCta")} <ArrowIcon />
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="flex flex-col gap-2.5">
            <span className="self-start rounded-full bg-ic px-3 py-1.5 text-sm font-semibold text-teal">{t("chose", { label: picked?.label ?? t("other") })}</span>
            <h1 className="text-[23px] leading-[1.4] font-bold text-teal rtl:leading-[1.6]" data-testid="reveal-headline">
              {picked?.headline ?? t("otherHeadline")}
            </h1>
            <span className="h-0.5 w-9 rounded-sm bg-gold" />
            {picked && <p className="text-base leading-[1.7] rtl:leading-[1.9]">{picked.reveal.join(" ")}</p>}
          </div>
          <SourceCard sources={picked?.sources ?? journey.sources} explanation={journey.explanation} />
          <button type="button" className={BUTTON} onClick={toExplain}>
            {t("revealCta")} <ArrowIcon />
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <div className="flex flex-col gap-2">
            <span className={KICKER}>{t("explainK")}</span>
            <h1 className="text-[21px] leading-[1.45] font-bold text-teal rtl:leading-[1.7]">{journey.explain_prompt}</h1>
            <span className="h-0.5 w-9 rounded-sm bg-gold" />
            <span className="text-[15px] text-mute">{t("explainSub")}</span>
          </div>
          <label className="flex flex-col gap-2">
            <b className="text-sm rtl:text-[15px]">{t("explainLabel")}</b>
            <textarea
              rows={4}
              maxLength={600}
              value={text}
              onChange={(e) => write(e.target.value)}
              placeholder={t("explainPlaceholder")}
              className="w-full resize-none rounded-[14px] border border-sand bg-card px-[15px] py-[13px] text-base leading-[1.7] text-ink"
            />
            <span className="text-end text-xs text-mute rtl:text-[13px]">{t("explainOnDevice")}</span>
          </label>
          <button type="button" className={BUTTON} onClick={finish}>
            {text.trim() ? t("cont") : t("skip")} <ArrowIcon />
          </button>
        </>
      )}

      {step === 4 && (
        <>
          <div className="flex flex-col gap-3 rounded-[20px] bg-teal p-5 text-white shadow-[0_10px_24px_rgba(15,76,92,.18)]">
            <span className="flex items-center gap-2 text-xs font-semibold tracking-[.08em] text-sand uppercase rtl:text-[13px] rtl:tracking-normal">
              <CupIcon size={16} /> {t("tipK")}
            </span>
            <h1 className="text-[23px] leading-[1.4] font-bold rtl:leading-[1.6]" data-testid="tip">
              {journey.tip.headline}
            </h1>
            {journey.tip.lead && <p className="text-base leading-[1.65] text-white/90 rtl:leading-[1.9]">{journey.tip.lead}</p>}
          </div>
          <ul className="flex flex-col gap-2.5">
            {journey.tip.items.map((item) => (
              <li key={item} className="flex gap-3 rounded-2xl border border-line bg-card p-3.5 shadow-[0_2px_10px_rgba(15,76,92,.04)]">
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-ic text-teal">
                  <CheckIcon />
                </span>
                <span className="text-base leading-[1.6] rtl:leading-[1.85]">{item}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3 rounded-2xl border border-gold bg-beige px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-white">
              <CheckIcon size={18} />
            </span>
            <div>
              <b className="text-base text-teal">{t("doneK")}</b>
              <div className="text-sm text-mute">{t("doneS")}</div>
            </div>
          </div>
          <Link href="/home" className={BUTTON}>
            {t("home")}
          </Link>
        </>
      )}
    </>
  );
}
