#!/usr/bin/env python3
import pandas as pd, numpy as np, matplotlib.pyplot as plt
from sklearn.metrics import roc_auc_score, roc_curve
from scipy.stats import spearmanr
import pathlib, json, os

root = pathlib.Path(__file__).resolve().parents[1]
csv  = root / "validation" / "results.csv"
df   = pd.read_csv(csv)

# Spearman correlation (4-level PB grade vs score)
rho, p = spearmanr(df["pb_grade"], df["pii_score"])
print(f"Spearman ρ = {rho:.2f}  (p={p:.4g})")

# AUROC (good=0/1 vs poor=2/3)
y_true = (df["pb_grade"] >= 2).astype(int)
auc    = roc_auc_score(y_true, df["pii_score"])
print(f"AUROC = {auc:.2f}")

fpr, tpr, _ = roc_curve(y_true, df["pii_score"])
plt.figure()
plt.plot(fpr, tpr, label=f"AUC = {auc:.2f}")
plt.plot([0,1],[0,1],'--', lw=0.8)
plt.xlabel("False Positive Rate"), plt.ylabel("True Positive Rate")
plt.legend(), plt.tight_layout()
out = root / "validation" / "roc_curve.png"
plt.savefig(out, dpi=180)
print(f"ROC curve saved → {out.relative_to(root)}")
