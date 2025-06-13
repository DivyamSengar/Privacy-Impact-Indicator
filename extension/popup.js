/* -----------------------------------------------------------------------
   Toolbar popup  –  v0.6.1 (matches throttled badge score & shows worst)
------------------------------------------------------------------------ */

const colour = s => (s >= 70 ? 'green' : s >= 40 ? 'orange' : 'red');

/* ask background for latest score shown to user */
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  const tabId = tabs[0].id;
  chrome.runtime.sendMessage({ type: 'GET_SCORE', tabId }, resp => {
    if (resp) paint(resp);
  });
});

function paint({ score, minScore, trackers, thirdParty, hosts }) {
  /* headline */
  const h = document.getElementById('score');
  h.textContent = score;
  h.className   = colour(score);

  /* summary */
  document.getElementById('summary').textContent =
    `${thirdParty} third-party domain${thirdParty !== 1 ? 's' : ''}, ` +
    `${trackers} tracker${trackers !== 1 ? 's' : ''}, ` +
    `worst seen: ${minScore}`;

  /* domain list */
  const ul = document.getElementById('details');
  ul.innerHTML = '';
  hosts.slice(0, 10).forEach(({ host, tracker, hits }) => {
    const li = document.createElement('li');
    li.textContent = `${tracker ? '⚠️ ' : ''}${host} (${hits})`;
    ul.appendChild(li);
  });
}
