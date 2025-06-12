#!/usr/bin/env python3
"""
Aggregate per-task CSVs exported by the PII dev-panel into one
participant-level table (study_data.csv).
Run:  python aggregate_study.py exports/*.csv
"""
import sys, pandas as pd, pathlib

rows = []
for path in map(pathlib.Path, sys.argv[1:]):
    df = pd.read_csv(path)
    pid = df['Participant'].iloc[0]
    agg = {
        "Participant": pid,
        "Trackers_Base": df.loc[df['Phase']=="baseline",'Trackers'].sum(),
        "Trackers_PII" : df.loc[df['Phase']=="pii",'Trackers'].sum(),
        "Requests_Base": df.loc[df['Phase']=="baseline",'Requests'].sum(),
        "Requests_PII" : df.loc[df['Phase']=="pii",'Requests'].sum(),
    }
    rows.append(agg)

pd.DataFrame(rows).to_csv("study_data.csv", index=False)
print("✓  wrote study_data.csv")
