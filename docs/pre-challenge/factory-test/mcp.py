"""Tiny client for the association's read-only MCP server (search + fetch). No model involved."""
import json
import urllib.request

URL = "https://mcp.islamiccontent.org/mcp"
_session = {"id": None, "n": 0}


def _post(body, expect=True):
    headers = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream", "User-Agent": "lahza-factory-test/0.1"}
    if _session["id"]:
        headers["Mcp-Session-Id"] = _session["id"]
    req = urllib.request.Request(URL, json.dumps(body).encode(), headers)
    with urllib.request.urlopen(req, timeout=40) as r:
        sid = r.headers.get("Mcp-Session-Id")
        if sid:
            _session["id"] = sid
        raw = r.read().decode("utf-8")
    if not expect:
        return None
    for line in raw.splitlines():
        line = line.removeprefix("data: ").strip()
        if line.startswith("{"):
            return json.loads(line)
    return None


def _init():
    if _session["n"] == 0:
        _post({"jsonrpc": "2.0", "id": 0, "method": "initialize", "params": {"protocolVersion": "2025-03-26", "capabilities": {}, "clientInfo": {"name": "lahza-factory-test", "version": "0"}}})
        _post({"jsonrpc": "2.0", "method": "notifications/initialized"}, expect=False)


def call(tool, args):
    _init()
    _session["n"] += 1
    r = _post({"jsonrpc": "2.0", "id": _session["n"], "method": "tools/call", "params": {"name": tool, "arguments": args}})
    res = (r or {}).get("result", {})
    text = "\n".join(c.get("text", "") for c in res.get("content", []) if c.get("type") == "text")
    return {"is_error": bool(res.get("isError")), "text": text, "structured": res.get("structuredContent")}
