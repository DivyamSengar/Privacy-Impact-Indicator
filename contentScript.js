/* -----------------------------------------------------------------------
   Privacy-Impact extension – in-page badge + drawer
   v0.4.1  – fixes dimmer pointer-trap & keeps toolbar popup working
------------------------------------------------------------------------ */

let badge, drawer, dimmer, lastPayload;

/* ---------- badge ---------------------------------------------------- */
function ensureBadge() {
  if (badge) return badge;
  badge = document.createElement('div');
  badge.id = '__privacyImpactBadge';
  badge.style.cssText = `
    position:fixed; bottom:20px; right:20px; z-index:2147483647;
    width:64px; height:64px; padding:10px;
    border-radius:50%; font:700 24px/44px system-ui,sans-serif;
    text-align:center; color:#fff; background:#0a7c0a;
    box-shadow:0 0 6px rgba(0,0,0,.25); cursor:pointer;
    transition:transform .15s ease;
  `;
  badge.onmouseenter = () => (badge.style.transform = 'scale(1.07)');
  badge.onmouseleave = () => (badge.style.transform = 'scale(1)');
  badge.onclick       = toggleDrawer;
  document.documentElement.appendChild(badge);
  return badge;
}

/* ---------- build overlay & drawer once ------------------------------ */
function buildDrawer() {
  /* translucent backdrop */
  dimmer = document.createElement('div');
  dimmer.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,.35);
    z-index:2147483646; opacity:0; display:none; pointer-events:none;
    transition:opacity .2s;
  `;
  dimmer.onclick = toggleDrawer;

  /* side panel */
  drawer = document.createElement('aside');
  drawer.style.cssText = `
    position:fixed; top:0; right:-360px; height:100vh; width:340px;
    background:#fff; color:#000; font:14px/1.4 system-ui,sans-serif;
    box-shadow:0 0 18px rgba(0,0,0,.35); z-index:2147483647;
    padding:24px 20px 40px; overflow-y:auto;
    transition:right .25s cubic-bezier(.24,.6,.24,1);
  `;

  document.documentElement.appendChild(dimmer);
  document.documentElement.appendChild(drawer);
}

/* ---------- open / close -------------------------------------------- */
function openDrawer() {
  if (!drawer) buildDrawer();
  renderDrawer(lastPayload);
  dimmer.style.display      = 'block';
  dimmer.style.pointerEvents = 'auto';
  requestAnimationFrame(() => {         // allow style flush
    dimmer.style.opacity = '1';
    drawer.style.right  = '0';
  });
}
function closeDrawer() {
  drawer.style.right   = '-360px';
  dimmer.style.opacity = '0';
  dimmer.style.pointerEvents = 'none';
  /* after transition hide completely so it doesn’t trap focus */
  setTimeout(() => { if (dimmer.style.opacity === '0') dimmer.style.display = 'none'; }, 220);
}
function toggleDrawer() {
  (drawer && drawer.style.right === '0px') ? closeDrawer() : openDrawer();
}

/* ---------- populate panel ------------------------------------------ */
function renderDrawer(p) {
  if (!p) return;                         // nothing yet to show
  drawer.innerHTML = '';                  // wipe old

  /* close button */
  const x = document.createElement('button');
  x.textContent = '×';
  x.title       = 'Close';
  x.style.cssText =
    `position:absolute; top:6px; right:12px; border:none; background:none;
     font:28px/1 Arial; cursor:pointer; color:#666`;
  x.onclick = toggleDrawer;
  drawer.appendChild(x);

  /* headline */
  const h1 = document.createElement('h1');
  h1.textContent = `${p.score}/100`;
  h1.style.cssText = 'margin:16px 0 4px; font:700 42px/1.1 system-ui';
  h1.style.color   =
    p.score >= 70 ? '#0a7c0a' : p.score >= 40 ? '#e68c00' : '#c62828';
  drawer.appendChild(h1);

  const verdict = document.createElement('p');
  verdict.style.marginTop = '0';
  verdict.textContent =
      p.score >= 70 ? 'Low external tracking detected.' :
      p.score >= 40 ? 'Moderate tracking: some external services active.' :
                      'Heavy tracking & advertising detected!';
  drawer.appendChild(verdict);

  /* metrics chips */
  const chips = document.createElement('div');
  chips.style.cssText = 'display:flex; gap:8px; flex-wrap:wrap; margin:12px 0';
  [
    ['Requests',        p.requests],
    ['3rd-party hosts', p.thirdParty],
    ['Known trackers',  p.trackers]
  ].forEach(([label,val])=>{
    const c = document.createElement('span');
    c.textContent = `${label}: ${val}`;
    c.style.cssText =
      'background:#f2f2f2; border-radius:12px; padding:4px 10px; font-size:12px';
    chips.appendChild(c);
  });
  drawer.appendChild(chips);

  /* host list */
  const table = document.createElement('table');
  table.style.cssText = 'width:100%; border-collapse:collapse; margin-top:6px';
  table.innerHTML =
    `<thead><tr style="text-align:left;font-weight:600">
       <th>Domain</th><th style="width:70px;text-align:right">Hits</th>
     </tr></thead>`;
  const tbody = document.createElement('tbody');
  p.hosts.forEach(({host,hits,tracker})=>{
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td>${tracker ? '⚠️ ' : ''}${host}</td>
       <td style="text-align:right">${hits}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  drawer.appendChild(table);

  /* footer */
  const foot = document.createElement('div');
  foot.style.cssText = 'margin-top:18px; font-size:12px; color:#555';
  foot.innerHTML =
    `Tip: consider <a style="color:#06c"
      href="chrome://settings/content/cookies" target="_blank">
      blocking third-party cookies</a> or installing a dedicated blocker.`;
  drawer.appendChild(foot);
}

/* ---------- live updates from background ----------------------------- */
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type !== 'PRIVACY_SCORE') return;
  lastPayload = msg;

  const el = ensureBadge();
  el.textContent      = msg.score;
  el.style.background = msg.score >= 70 ? '#0a7c0a'
                        : msg.score >= 40 ? '#e68c00' : '#c62828';

  if (drawer && drawer.style.right === '0px') renderDrawer(msg);
});

/* ---------- ⌥ P shortcut --------------------------------------------- */
window.addEventListener('keydown', e => {
  if (e.altKey && e.key.toLowerCase() === 'p') toggleDrawer();
});
