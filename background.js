/* ——— bootstrap tracker list ——— */
let trackerSet = new Set();
fetch(chrome.runtime.getURL('trackerList.json'))
  .then(r => r.json())
  .then(l => (trackerSet = new Set(l)));

/* ——— tiny helpers ——— */
const scores = {};                                   // tabId → record

function getBase(url) {
  try { return new URL(url).hostname.split('.').slice(-2).join('.'); }
  catch { return ''; }
}

function compute(rec) {
  const tp = rec.thirdPartyHosts.size;
  const tr = rec.trackers;
  if (tr > 3 || tp > 10) return 0;
  if (tr)                return Math.max(30 - (tr - 1) * 5, 10);
  if (!tp)               return 100;
  if (tp <= 2)           return 70;
  if (tp <= 5)           return 50;
  return 40;
}

/* ——— observe every completed request ——— */
chrome.webRequest.onCompleted.addListener(
  d => {
    if (d.tabId < 0) return;                         // ignore bg / ext

    const rec = scores[d.tabId] ??= {
      requests: 0, trackers: 0, thirdPartyHosts: new Set()
    };

    rec.requests += 1;

    const dest  = getBase(d.url);
    const page  = d.initiator ? getBase(d.initiator) : '';

    if (page && dest !== page) rec.thirdPartyHosts.add(dest);
    if (trackerSet.has(dest))  rec.trackers += 1;

    const score = compute(rec);

    /* push update to the tab (fail quietly if no listener yet) */
    chrome.tabs.sendMessage(
      d.tabId,
      { type: 'PRIVACY_SCORE', score, ...rec },
      () => { /* silence "receiving end does not exist" */ }
    );

    /* toolbar badge */
    chrome.action.setBadgeText({ tabId: d.tabId, text: String(score) });
    chrome.action.setBadgeBackgroundColor({
      tabId: d.tabId,
      color: score >= 70 ? 'green' : score >= 40 ? 'orange' : 'red'
    });
  },
  { urls: ['<all_urls>'] }
);

/* ——— clean-up when tabs close / navigate ——— */
chrome.tabs.onRemoved.addListener(id => delete scores[id]);
chrome.webNavigation.onCommitted.addListener(({ tabId }) => delete scores[tabId]);

/* ——— message router ——— */
chrome.runtime.onMessage.addListener((msg, sender, sendResp) => {
  if (msg.type === 'GET_SCORE') {
    const rec   = scores[msg.tabId] ?? { trackers: 0, thirdPartyHosts: new Set() };
    sendResp({ score: compute(rec), trackers: rec.trackers,
               thirdPartyHosts: [...rec.thirdPartyHosts] });
    return true;                        // async reply
  }

  if (msg.type === 'OPEN_POPUP') {      // clicked the in-page badge
    chrome.action.openPopup();          // show the toolbar popup
  }
});
