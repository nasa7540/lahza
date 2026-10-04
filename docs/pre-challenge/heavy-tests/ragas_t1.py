#!/usr/bin/env python3
"""RAGAS faithfulness on the 200 planted-error sentences (test 1), judge openai/gpt-5-mini via OpenRouter.
Run with the RAGAS venv. Two variants: RAGAS's default English prompts, and the same prompts adapted to Arabic.
A sentence is 'rejected' when faithfulness < t; t is tuned on the tune split and reported on the held-out split.
"""
import asyncio
import json
import pathlib
import sys
import warnings

warnings.filterwarnings("ignore")
from langchain_openai import ChatOpenAI  # noqa: E402
from ragas.dataset_schema import SingleTurnSample  # noqa: E402
from ragas.llms import LangchainLLMWrapper  # noqa: E402
from ragas.metrics import Faithfulness  # noqa: E402

HERE = pathlib.Path(__file__).parent
KEY = next(l.split("=", 1)[1].strip() for l in (pathlib.Path.home() / "lahza" / ".env.local").read_text().splitlines() if l.startswith("LLM_API_KEY="))
JUDGE = "openai/gpt-4.1-mini"  # gpt-5-mini took ~30 s per sentence
items = json.loads((HERE / "data" / "verifier.json").read_text(encoding="utf-8"))
KINDS = ["correct", "number", "name", "exaggeration"]
QUESTION = "ماذا يقول هذا المصدر؟"


async def main(variant):
    llm = LangchainLLMWrapper(ChatOpenAI(model=JUDGE, api_key=KEY, base_url="https://openrouter.ai/api/v1", temperature=0, timeout=120, max_retries=2))
    metric = Faithfulness(llm=llm)
    if variant == "arabic":
        adapted = await metric.adapt_prompts(language="arabic", llm=llm)
        metric.set_prompts(**adapted)
    sem = asyncio.Semaphore(4)

    async def one(it, kind):
        s = SingleTurnSample(user_input=QUESTION, response=it[kind], retrieved_contexts=[it["source"]["text_ar"]])
        async with sem:
            try:
                score = await metric.single_turn_ascore(s)
            except Exception as e:  # noqa: BLE001
                return {"source_id": it["source_id"], "split": it["split"], "kind": kind, "text": it[kind], "score": None, "error": f"{type(e).__name__}: {e}"[:160]}
        return {"source_id": it["source_id"], "split": it["split"], "kind": kind, "text": it[kind], "score": None if score != score else float(score)}

    rows = await asyncio.gather(*[one(it, k) for it in items for k in KINDS])

    def score(sub, t):
        ok = [r for r in sub if r["score"] is not None]
        c = [r for r in ok if r["kind"] == "correct"]
        bad = [r for r in ok if r["kind"] != "correct"]
        return {"false_reject": sum(r["score"] < t for r in c), "correct_n": len(c), "caught": sum(r["score"] < t for r in bad), "corrupt_n": len(bad),
                "by_kind": {k: sum(r["score"] < t for r in bad if r["kind"] == k) for k in KINDS[1:]}}

    tune = [r for r in rows if r["split"] == "tune"]
    hold = [r for r in rows if r["split"] == "holdout"]
    best = max(((score(tune, t)["caught"] - 2 * score(tune, t)["false_reject"], -score(tune, t)["false_reject"], t) for t in [i / 20 for i in range(1, 21)]))
    t = best[2]
    res = {"variant": variant, "judge": JUDGE, "threshold": t, "tune": score(tune, t), "holdout": score(hold, t),
           "errors": sum(r["score"] is None for r in rows), "rows": rows}
    (HERE / f"ragas-t1-{variant}.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({k: v for k, v in res.items() if k != "rows"}, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else "default"))
