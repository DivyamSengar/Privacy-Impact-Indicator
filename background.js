/* -----------------------------------------------------------------------
   Privacy-Impact extension – service-worker
   v0.4.2  – proper GET_SCORE response for popup
------------------------------------------------------------------------ */

let trackerSet = new Set();
fetch(chrome.runtime.getURL('trackerList.json'))
  .then(r => r.json())
  .then(list => (trackerSet = new Set(list)));

function getBase(url) {
  try { return new URL(url).hostname.split('.').slice(-2).join('.'); }
  catch { return ''; }
}

function score(rec) {
  const tp = rec.thirdPartyHosts.size, tr = rec.trackers;
  if (tr > 3 || tp > 10) return 0;
  if (tr)                return Math.max(30 - (tr - 1) * 5, 10);
  if (!tp)               return 100;
  if (tp <= 2)           return 70;
  if (tp <= 5)           return 50;
  return 40;
}

function topHosts(rec, n = 12) {
  return Object.entries(rec.hostCounts)
               .sort((a,b)=>b[1]-a[1]).slice(0,n)
               .map(([host,hits])=>({host,hits,tracker:trackerSet.has(host)}));
}

const scores = {};   // tabId → record

chrome.webRequest.onCompleted.addListener(
  d => {
    if (d.tabId < 0) return;

    const rec = scores[d.tabId] ??= {
      requests:0, trackers:0, thirdPartyHosts:new Set(), hostCounts:{}
    };

    rec.requests += 1;

    const dest = getBase(d.url);
    const page = d.initiator ? getBase(d.initiator) : '';

    if (page && dest !== page) rec.thirdPartyHosts.add(dest);
    if (trackerSet.has(dest))  rec.trackers += 1;
    rec.hostCounts[dest] = (rec.hostCounts[dest] || 0) + 1;

    const payload = {
      type:       'PRIVACY_SCORE',
      score:      score(rec),
      requests:   rec.requests,
      trackers:   rec.trackers,
      thirdParty: rec.thirdPartyHosts.size,
      hosts:      topHosts(rec),
      /* extra field so old popup.js keeps working --------------------- */
      thirdPartyHosts: [...rec.thirdPartyHosts]
    };

    chrome.tabs.sendMessage(d.tabId, payload, () => {});
    chrome.action.setBadgeText({tabId:d.tabId, text:String(payload.score)});
    chrome.action.setBadgeBackgroundColor({
      tabId:d.tabId,
      color: payload.score>=70 ? 'green'
           : payload.score>=40 ? 'orange' : 'red'
    });
  },
  {urls:['<all_urls>']}
);

chrome.tabs.onRemoved.addListener(id => delete scores[id]);
chrome.webNavigation.onCommitted.addListener(({tabId}) => delete scores[tabId]);

/* ---------------- message handler for popup --------------------------- */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_SCORE') {
    const rec = scores[msg.tabId] ?? {
      requests:0, trackers:0, thirdPartyHosts:new Set(), hostCounts:{}
    };
    sendResponse({
      score:      score(rec),
      requests:   rec.requests,
      trackers:   rec.trackers,
      thirdParty: rec.thirdPartyHosts.size,
      hosts:      topHosts(rec),
      thirdPartyHosts: [...rec.thirdPartyHosts]   // legacy field
    });
    return true;        // keep the channel open for async reply
  }
  if (msg.type === 'OPEN_POPUP') chrome.action.openPopup();
});
