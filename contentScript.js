let badge;

function ensureBadge () {
  if (badge) return badge;

  badge = document.createElement('div');
  badge.id = '__privacyImpactBadge';
  badge.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;
    min-width: 64px; height: 64px; padding: 10px;
    border-radius: 50%; font: 700 24px/44px system-ui, sans-serif;
    text-align: center; color: #fff; background: #0a7c0a;
    box-shadow: 0 0 6px rgba(0,0,0,.25); cursor: pointer;
    transition: transform 0.15s ease;
  `;
  badge.title = 'Privacy-impact score';
  badge.onmouseenter = () => (badge.style.transform = 'scale(1.07)');
  badge.onmouseleave = () => (badge.style.transform = 'scale(1.0)');
  badge.onclick       = () => chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
  document.documentElement.appendChild(badge);
  return badge;
}

chrome.runtime.onMessage.addListener((m) => {
  if (m.type !== 'PRIVACY_SCORE') return;

  const el = ensureBadge();
  el.textContent = m.score;

  const col = m.score >= 70 ? '#0a7c0a' : m.score >= 40 ? '#e68c00' : '#c62828';
  el.style.background = col;
  el.title =
    `Privacy-impact: ${m.score}/100\n${m.thirdPartyHosts.size} third-party ` +
    `domain${m.thirdPartyHosts.size !== 1 ? 's' : ''}, ${m.trackers} tracker${m.trackers !== 1 ? 's' : ''}`;
});
