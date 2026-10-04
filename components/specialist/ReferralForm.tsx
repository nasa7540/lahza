"use client";
import { type FormEvent, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { REFERRAL_TOPICS, type ReferralTopic } from "@/lib/referral";

const BUTTON = "flex h-[52px] w-full shrink-0 items-center justify-center gap-2.5 rounded-[14px] bg-teal text-base font-semibold text-white transition-colors duration-150 hover:bg-teal-d disabled:cursor-not-allowed disabled:opacity-40";

const noSubscription = () => () => undefined;
/** The question typed on the ask screen, kept on this device only. */
function readQuestion(): string {
  try {
    return sessionStorage.getItem("lahza.question") ?? "";
  } catch {
    return "";
  }
}

/** The summary starts from a fixed template for the chosen topic, plus the question the user typed on this device. Nothing here is written by a model. */
export function ReferralForm() {
  const t = useTranslations("specialist");
  const lang = useLocale();
  const [topic, setTopic] = useState<ReferralTopic>("personal_ruling");
  const question = useSyncExternalStore(noSubscription, readQuestion, () => "");
  const [summary, setSummary] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const template = `${t(`template_${topic}`)}${question ? `\n\n${t("myQuestion")} ${question}` : ""}\n\n${t("contactLine")} `;
  const text = summary ?? template;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState("sending");
    let company: string | undefined;
    try {
      company = localStorage.getItem("lahza.company") ?? undefined;
    } catch {
      company = undefined;
    }
    try {
      const res = await fetch("/api/referral", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lang, topic, summary: text, consent, company }) });
      setState(res.ok ? "sent" : "failed");
    } catch {
      setState("failed");
    }
  };

  if (state === "sent") {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-gold bg-beige p-4" data-testid="referral-sent">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-white">
          <CheckIcon size={18} />
        </span>
        <b className="text-base text-teal">{t("sentTitle")}</b>
        <span className="text-[15px] leading-relaxed text-body">{t("sentBody")}</span>
        <Link href="/home" className="self-start py-1.5 font-semibold text-teal underline underline-offset-4">
          {t("home")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold rtl:text-[15px]">{t("topicLabel")}</legend>
        {REFERRAL_TOPICS.map((id) => (
          <label key={id} className={`flex min-h-[48px] items-center gap-3 rounded-[14px] px-3.5 py-2 text-base ${topic === id ? "border-[1.5px] border-teal bg-ic font-semibold" : "border border-line bg-card"}`}>
            <input
              type="radio"
              name="topic"
              value={id}
              checked={topic === id}
              onChange={() => {
                setTopic(id);
                setSummary(null);
              }}
            />
            {t(`topic_${id}`)}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-2">
        <b className="text-sm rtl:text-[15px]">{t("summaryLabel")}</b>
        <textarea rows={7} maxLength={1000} value={text} onChange={(e) => setSummary(e.target.value)} className="w-full resize-none rounded-[14px] border border-sand bg-card px-[15px] py-[13px] text-base leading-[1.7] text-ink" />
        <span className="text-xs leading-relaxed text-mute rtl:text-[13px]">{t("summaryHint")}</span>
      </label>
      <label className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4 text-[15px] leading-relaxed">
        <input type="checkbox" role="switch" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
        {t("consent")}
      </label>
      {state === "failed" && <p role="alert" className="text-sm font-semibold text-warn">{t("failed")}</p>}
      <button type="submit" className={BUTTON} disabled={!consent || text.trim().length < 10 || state === "sending"}>
        {state === "sending" ? t("sending") : t("send")}
      </button>
    </form>
  );
}
