# Privacy Impact Indicator (CSE 291 Final Project)

**Author:** Divyam Sengar  |  **Version:** 1.0.0 · June 2025

A Chrome Manifest V3 extension that turns low‑level network telemetry into an **ambient 0–100 privacy score**.  Think of it as a *privacy speedometer*: the badge glows green on tracker‑light sites and slides toward red as hidden requests increase.

---


## 🚀 Quick Start

1. **Clone & install**

   ```bash
   git clone https://github.com/divyamsengar/privacy-impact-indicator.git
   cd privacy-impact-indicator
   ```
2. **Load in Chrome**
   • Visit `chrome://extensions`
   • Enable *Developer mode*
   • Click **Load unpacked** → select the `extension/` folder
3. **Browse the web** – a 64‑pixel badge appears bottom‑right.  Red ≤ 40, Yellow 41–69, Green ≥ 70.
4. **Click the badge** to open the slide‑in panel (second‑by‑second trace + worst‑seen anchor).

---

## 🔬 How the Score Works

Risk = $100\,·(1 - e^{-(0.45·t + 0.15·h)})$
`t` = tracker requests (from a 40 662‑domain DuckDuckGo + Disconnect list)
`h` = distinct third‑party eTLD+1 hosts
The extension samples continuously but **publishes a 5‑second EMA** to avoid sensory overload.

---

## 🗂 Repo layout

| Path                | What’s inside                                                                 |
| ------------------- | ----------------------------------------------------------------------------- |
| **extension/**      | MV3 code: `background.js`, `contentScript.js`, pop‑up UI, `trackerList.json`. |
| **analysis/**       | Python helpers → `aggregate_study.py`, `validate_metric.py`, plotting.        |
| **validation/**     | `results.csv` (100‑URL crawl) + `roc_curve.png`.                              |
| **data/study.csv** | Anonymised participant metrics (N = 15).                                      


---

## 📊 Reproduce the Study

```bash
# aggregate per‑task CSV exports → study_data.csv
python analysis/aggregate_study.py exports/*.csv

# compute AUROC + Spearman ρ on the 100‑URL corpus
python analysis/validate_metric.py
```

Expected:

```
Spearman ρ = -0.81   (p≈2.6e‑24)
AUROC     = 0.91
```
