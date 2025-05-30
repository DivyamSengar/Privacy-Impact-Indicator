/* -----------------------------------------------------------------------
   Privacy-Impact extension – service-worker
   v0.5  – smooth exponential scoring
------------------------------------------------------------------------ */

const WEIGHTS = { tracker: 0.45, host: 0.15 }; // tweak to taste

/* -------- bootstrap tracker list ------------------------------------- */
let trackerSet = new Set();
fetch(chrome.runtime.getURL('trackerList.json'))
  .then(r => r.json())
  .then(list => (trackerSet = new Set(list)));

/* -------- helpers ----------------------------------------------------- */
function baseDomain(url) {
  try { return new URL(url).hostname.split('.').slice(-2).join('.'); }
  catch { return ''; }
}

/* Smooth score: 100 when risk = 0, falls off continuously toward 0. */
function computeScore(rec) {
  const wSum  = WEIGHTS.tracker * rec.trackers
              + WEIGHTS.host    * rec.thirdPartyHosts.size;
  const risk  = 1 - Math.exp(-wSum);      // ∈ [0,1)
  return Math.round(100 * (1 - risk));    // 100 .. 0
}

function topHosts(rec, n = 12) {
  return Object.entries(rec.hostCounts)
               .sort((a, b) => b[1] - a[1])
               .slice(0, n)
               .map(([host, hits]) => ({
                 host,
                 hits,
                 tracker: trackerSet.has(host)
               }));
}

/* -------- per-tab bookkeeping ---------------------------------------- */
const scores = {};                 // tabId → record

chrome.webRequest.onCompleted.addListener(
  d => {
    if (d.tabId < 0) return;       // ignore non-tab traffic

    const rec = scores[d.tabId] ??= {
      requests: 0,
      trackers: 0,
      thirdPartyHosts: new Set(),
      hostCounts: {}
    };

    rec.requests += 1;

    const dest = baseDomain(d.url);
    const page = d.initiator ? baseDomain(d.initiator) : '';

    if (page && dest !== page) rec.thirdPartyHosts.add(dest);
    if (trackerSet.has(dest))  rec.trackers += 1;
    rec.hostCounts[dest] = (rec.hostCounts[dest] || 0) + 1;

    const payload = {
      type:       'PRIVACY_SCORE',
      score:      computeScore(rec),
      requests:   rec.requests,
      trackers:   rec.trackers,
      thirdParty: rec.thirdPartyHosts.size,
      hosts:      topHosts(rec),
      thirdPartyHosts: [...rec.thirdPartyHosts]   // legacy support
    };

    chrome.tabs.sendMessage(d.tabId, payload, () => {});
    chrome.action.setBadgeText({ tabId: d.tabId, text: String(payload.score) });
    chrome.action.setBadgeBackgroundColor({
      tabId: d.tabId,
      color: payload.score >= 70 ? 'green'
           : payload.score >= 40 ? 'orange'
           : 'red'
    });
  },
  { urls: ['<all_urls>'] }
);

/* -------- cleanup on tab close / nav --------------------------------- */
chrome.tabs.onRemoved.addListener(id => delete scores[id]);
chrome.webNavigation.onCommitted.addListener(({ tabId }) => delete scores[tabId]);

/* -------- “GET_SCORE” for toolbar popup ------------------------------ */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_SCORE') {
    const rec = scores[msg.tabId] ?? {
      requests: 0,
      trackers: 0,
      thirdPartyHosts: new Set(),
      hostCounts: {}
    };
    sendResponse({
      score:      computeScore(rec),
      requests:   rec.requests,
      trackers:   rec.trackers,
      thirdParty: rec.thirdPartyHosts.size,
      hosts:      topHosts(rec),
      thirdPartyHosts: [...rec.thirdPartyHosts]
    });
    return true;          // async reply
  }
  if (msg.type === 'OPEN_POPUP') chrome.action.openPopup();
});
