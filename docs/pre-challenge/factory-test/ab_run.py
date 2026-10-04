"""Blind writer comparison requested by the user: Claude vs the strongest Qwen, same references, same verifier."""
import json, os, pathlib, time
os.environ["SKIP_MODEL_GUARD"] = "1"   # both topics are allowed topics; the model guard's false refusals are reported separately
import factory2 as f

OUT = pathlib.Path(__file__).parent / "ab"
f.WRITER = "anthropic/claude-opus-5.5"
for tid in ("ramadan", "team-dinner"):
    _, topic, exp = next(t for t in f.TOPICS if t[0] == tid)
    a = f.run(tid, topic, exp, writer=f.WRITER)           # Claude researches and writes
    json.dump(a, open(OUT / f"{tid}__claude.json", "w"), ensure_ascii=False, indent=1)
    t0, log, usage = time.time(), [], []
    b = {"topic_id": tid, "topic": topic, "expected_when": exp, "status": "draft", "guard": a.get("guard"),
         "generation": {"prompt_version": f.PROMPT_VERSION, "date": time.strftime("%Y-%m-%d %H:%M"),
                        "models": {"guard": "skipped", "research_and_writer": f.ALT_WRITER + " (writing only; Claude's references reused)", "verifier": f.VERIFIER}}}
    try:
        b = f.finish(b, tid, topic, exp, f.ALT_WRITER, a["references"], log, usage, t0)
    except Exception as e:
        b.update(status="error", error=str(e)[:300])
    json.dump(b, open(OUT / f"{tid}__qwen.json", "w"), ensure_ascii=False, indent=1)
    for name, d in (("claude", a), ("qwen", b)):
        c, ch = d.get("counters", {}), d.get("checks", {})
        print(tid, name, d["status"], d.get("error", ""), "removed", c.get("removed_by_verifier"), "/", c.get("sentences_generated"), "flagged", c.get("flagged_general_religious"), "when", d.get("journey", {}).get("when"), "checks", {k: v for k, v in ch.items() if v is False})
