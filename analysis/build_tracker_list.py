#!/usr/bin/env python3
"""
Build trackerList.json by merging:
  • Disconnect tracking-protection services.json
  • DuckDuckGo Tracker Radar domain_map.json   (new path 2025-06)
Outputs a sorted JSON array of unique eTLD+1 domains (~6k lines).
"""
import json, pathlib, tldextract, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW  = ROOT / "analysis" / "raw"

DISCONNECT = RAW / "disconnect-services.json"
RADAR_DOMAINS = RAW / "tracker-radar" / "build-data" / "generated" / "domain_map.json"
OUT = ROOT / "extension" / "trackerList.json"

for p in (DISCONNECT, RADAR_DOMAINS):
    if not p.exists():
        sys.exit(f"❌  Missing {p}. Check clone/curl paths.")

extract = tldextract.TLDExtract(include_psl_private_domains=True)
domains = set()

# ----- Disconnect -----
# ----- Disconnect (handles old + new formats) -----
def harvest_domains(obj):
    """Recursively walk any JSON value and add strings that look like domains."""
    if isinstance(obj, str):
        if "." in obj and " " not in obj:   # naive but effective
            domains.add(obj.lstrip("*.").lower())
    elif isinstance(obj, dict):
        for v in obj.values():
            harvest_domains(v)
    elif isinstance(obj, list):
        for v in obj:
            harvest_domains(v)

with DISCONNECT.open(encoding="utf-8") as fh:
    harvest_domains(json.load(fh))

# ----- Tracker Radar (new path) -----
with RADAR_DOMAINS.open(encoding="utf-8") as fh:
    domain_map = json.load(fh)
domains.update(domain_map.keys())

# ----- Canonicalise to eTLD+1 -----
canon = {extract(d).registered_domain.lower() for d in domains if d}
canon.discard("")          # drop blanks

OUT.parent.mkdir(parents=True, exist_ok=True)
json.dump(sorted(canon), OUT.open("w"), indent=2)

print(f"✅  Wrote {len(canon):,} domains → {OUT.relative_to(ROOT)}")
