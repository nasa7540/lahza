"use client";
import { type FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowIcon, MomentIcon, PersonIcon, SearchIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";

type Card = { id: string; title: string; teaser: string };
type Result = { outcome: "journey" | "candidates" | "specialist" | "empty"; journeys: string[] };
const BUTTON = "flex h-[52px] w-full shrink-0 items-center justify-center gap-2.5 rounded-[14px] bg-teal text-base font-semibold text-white transition-colors duration-150 hover:bg-teal-d disabled:cursor-not-allowed disabled:opacity-40";

/**
 * One field. The server answers with an outcome and journey ids only; every word shown here is either fixed
 * interface text or the approved title of a journey.
 */
export function AskForm({ journeys }: { journeys: Card[] }) {
  const t = useTranslations("ask");
  const lang = useLocale();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    const empty: Result = { outcome: "empty", journeys: [] };
    try {
      const res = await fetch("/api/classify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, lang }) });
      const body = (await res.json()) as Result;
      setResult(res.ok && Array.isArray(body.journeys) ? body : empty);
    } catch {
      setResult(empty);
    }
    setBusy(false);
  };

  const offered = result ? journeys.filter((j) => result.journeys.includes(j.id)).sort((a, b) => result.journeys.indexOf(a.id) - result.journeys.indexOf(b.id)) : [];
  const outcome = result && (result.outcome === "journey" || result.outcome === "candidates") && offered.length === 0 ? "empty" : result?.outcome;

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-2">
          <b className="text-sm rtl:text-[15px]">{t("label")}</b>
          <textarea
            rows={3}
            maxLength={500}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("placeholder")}
            className="w-full resize-none rounded-[14px] border border-sand bg-card px-[15px] py-[13px] text-base leading-[1.7] text-ink"
          />
          <span className="text-xs text-mute rtl:text-[13px]">{t("privacy")}</span>
        </label>
        <button type="submit" className={BUTTON} disabled={busy || text.trim().length < 2}>
          <SearchIcon /> {busy ? t("sending") : t("send")}
        </button>
      </form>

      <div aria-live="polite" className="flex flex-col gap-3" data-testid="ask-result" data-outcome={outcome ?? ""}>
        {(outcome === "journey" || outcome === "candidates") && (
          <>
            <b className="text-base text-teal">{t(outcome === "journey" ? "found" : "candidates")}</b>
            {offered.map((j) => (
              <Link key={j.id} href={`/j/${j.id}`} data-journey={j.id} className="flex items-center gap-3.5 rounded-[14px] border border-gold bg-beige px-3.5 py-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal text-white">
                  <MomentIcon />
                </span>
                <span className="flex grow flex-col gap-0.5">
                  <b className="text-base leading-snug text-ink">{j.title}</b>
                  <span className="text-sm leading-relaxed text-mute">{j.teaser}</span>
                </span>
                <span className="text-teal">
                  <ArrowIcon />
                </span>
              </Link>
            ))}
          </>
        )}
        {outcome === "empty" && (
          <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4">
            <b className="text-base text-teal">{t("emptyTitle")}</b>
            <span className="text-[15px] leading-relaxed text-body">{t("emptyBody")}</span>
            <Link href="/home" className="self-start py-1.5 font-semibold text-teal underline underline-offset-4">
              {t("browse")}
            </Link>
          </div>
        )}
        {outcome === "specialist" && (
          <div className="flex gap-3 rounded-2xl border border-gold bg-beige p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-gold-d">
              <PersonIcon />
            </span>
            <div className="flex flex-col gap-2">
              <b className="text-base text-teal">{t("specialistTitle")}</b>
              <span className="text-[15px] leading-relaxed text-body">{t("specialistBody")}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
