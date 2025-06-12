#!/usr/bin/env python3
"""
Regenerates tracker_reduction.pdf from study_data.csv.
If you also want the synthetic score trajectory, leave
the lower block unchanged or remove it entirely.
"""
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import pathlib

DATA =pathlib.Path(__file__).resolve().parents[1] / 'data'/ "study.csv"
df = pd.read_csv(DATA, comment="#")

# ----- Figure 1: tracker reduction --------------------------------
baseline = df["Trackers_Base"]
pii      = df["Trackers_PII"]

labels = ["Baseline", "With PII"]
means  = [baseline.mean(), pii.mean()]
errors = [baseline.std(ddof=1), pii.std(ddof=1)]

plt.figure(figsize=(3.5, 2.8))
plt.bar(labels, means, yerr=errors, capsize=6, color="orange")
plt.ylabel("Tracker Domains Contacted")
plt.title("Mean Trackers per Session")
plt.tight_layout()
plt.savefig("tracker_reduction.pdf")
plt.close()

print("✓  tracker_reduction.pdf updated.")