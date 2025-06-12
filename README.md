# Privacy Impact Indicator (CSE 291 Project)

**Author:** Divyam Sengar  
**Version:** 0.9.0 · June 2025

A Chrome (MV3) extension that displays a real-time privacy-risk badge for every page you visit.  
Risk = 100 × (1 − e^{−(0.45·trackers + 0.15·third-party hosts)}).

## Quick start

1. `git clone … && cd privacy-impact-indicator`
2. `chrome://extensions` → “Load unpacked” → select the `extension/` folder.
3. Browse: a circular badge (lower-right) shows the current page’s score.

## Repo structure
extension/ Chrome MV3 source (JS, manifest, trackerList.json)
analysis/ Scripts for study & metric validation
validation/ AUROC results, ROC curve
paper/ Final ACM SIGCONF PDF
study_data.csv Raw anonymised user-study data (N=15)
