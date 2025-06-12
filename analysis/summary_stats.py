#!/usr/bin/env python3
"""
Prints and stores descriptive statistics for study_data.csv.
"""
import pandas as pd
import scipy.stats as st
import pathlib

DATA =pathlib.Path(__file__).resolve().parents[1] / 'data'/ "study.csv"
df = pd.read_csv(DATA, comment="#")

metrics = {
    "Trackers": ("Trackers_Base", "Trackers_PII"),
    "Requests": ("Requests_Base", "Requests_PII"),
    "NASA_TLX": ("TLX_Base", "TLX_PII")
}

rows = []
for name, (col_b, col_p) in metrics.items():
    base = df[col_b]; pii = df[col_p]
    t, p = st.ttest_rel(base, pii)
    rows.append({
        "Metric": name,
        "Baseline_Mean": base.mean(),
        "PII_Mean": pii.mean(),
        "Mean_Diff": (pii - base).mean(),
        "p_value": p
    })

out = pd.DataFrame(rows)
print(out.round(4))
out.to_csv("summary_stats.csv", index=False)
print("✓  summary_stats.csv written.")