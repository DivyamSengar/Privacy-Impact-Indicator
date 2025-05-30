/* -----------------------------------------------------------------------
   Privacy-Impact extension – service-worker (Manifest V3)
   v0.6.1  – 5 s throttling · EMA smoothing · min-score tracking ·
             consistent popup/badge numbers
------------------------------------------------------------------------ */

const WEIGHTS   = { tracker: 0.45, host: 0.15 };   // harm per tracker / host
const EMA_ALPHA = 0.30;                            // 0 → frozen, 1 → no smoothing
const THROTTLE_MS = 5000;                          // badge / UI update cadence

/* ---------- tracker list --------------------------------------------- */
let trackerSet = new Set();
fetch(chrome.runtime.getURL('trackerList.json'))
  .then(r => r.json())
  .then(list => (trackerSet = new Set(list)));

/* ---------- helper fns ----------------------------------------------- */
const baseDomain = url => {
  try { return new URL(url).hostname.split('.').slice(-2).join('.'); }
  catch { return ''; }
};

const instantaneousScore = rec => {
  const w = WEIGHTS.tracker * rec.trackers +
            WEIGHTS.host    * rec.thirdPartyHosts.size;
  const risk = 1 - Math.exp(-w);              // 0 (no risk) → 1 (max risk)
  return Math.round(100 * (1 - risk));        // 100 … 0
};

const topHosts = (rec, n = 12) =>
  Object.entries(rec.hostCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([h, c]) => ({ host: h, hits: c, tracker: trackerSet.has(h) }));

/* ---------- per-tab state -------------------------------------------- */
const tabs = {};   // tabId → state object

chrome.webRequest.onCompleted.addListener(
  details => {
    const { tabId, url, initiator } = details;
    if (tabId < 0) return;                    // ignore background / ext traffic

    /* --- fetch or init state ----------------------------------------- */
    const st = tabs[tabId] ??= {
      requests: 0,
      trackers: 0,
      thirdPartyHosts: new Set(),
      hostCounts: {},
      emaScore: 100,
      minScore: 100,
      lastPush: 0,
      lastBadgeScore: 100          // value we last showed to user
    };

    /* --- record this request ----------------------------------------- */
    st.requests += 1;

    const dest = baseDomain(url);
    const page = initiator ? baseDomain(initiator) : '';

    if (page && dest && dest !== page) st.thirdPartyHosts.add(dest);
    if (trackerSet.has(dest))         st.trackers += 1;
    st.hostCounts[dest] = (st.hostCounts[dest] || 0) + 1;

    /* --- compute scores ---------------------------------------------- */
    const inst = instantaneousScore(st);
    st.emaScore = EMA_ALPHA * inst + (1 - EMA_ALPHA) * st.emaScore;
    st.minScore = Math.min(st.minScore, inst);

    /* --- throttle UI pushes ------------------------------------------ */
    const now   = Date.now();
    const first = st.lastPush === 0;
    const due   = now - st.lastPush >= THROTTLE_MS;

    if (first || due) {
      st.lastPush      = now;
      st.lastBadgeScore = Math.round(st.emaScore);

      const payload = {
        type:       'PRIVACY_SCORE',
        score:      st.lastBadgeScore,           // smoothed + throttled
        minScore:   st.minScore,
        requests:   st.requests,
        trackers:   st.trackers,
        thirdParty: st.thirdPartyHosts.size,
        hosts:      topHosts(st),
        thirdPartyHosts: [...st.thirdPartyHosts] // legacy support
      };

      chrome.tabs.sendMessage(tabId, payload, () => { /* ignore errors */ });

      chrome.action.setBadgeText({ tabId, text: String(st.lastBadgeScore) });
      chrome.action.setBadgeBackgroundColor({
        tabId,
        color: st.lastBadgeScore >= 70 ? 'green'
              : st.lastBadgeScore >= 40 ? 'orange'
              : 'red'
      });
    }
  },
  { urls: ['<all_urls>'] }
);

/* ---------- cleanup on tab events ------------------------------------ */
chrome.tabs.onRemoved.addListener(id => delete tabs[id]);
chrome.webNavigation.onCommitted.addListener(({ tabId }) => delete tabs[tabId]);

/* ---------- message handler (popup & misc) --------------------------- */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_SCORE') {
    const st = tabs[msg.tabId] ?? {
      requests: 0, trackers: 0, thirdPartyHosts: new Set(), hostCounts: {},
      emaScore: 100, minScore: 100, lastBadgeScore: 100
    };

    sendResponse({
      score:      st.lastBadgeScore,             // keep popup in sync
      minScore:   st.minScore,
      requests:   st.requests,
      trackers:   st.trackers,
      thirdParty: st.thirdPartyHosts.size,
      hosts:      topHosts(st),
      thirdPartyHosts: [...st.thirdPartyHosts]
    });
    return true;                                // async
  }

  if (msg.type === 'OPEN_POPUP') chrome.action.openPopup();
});
