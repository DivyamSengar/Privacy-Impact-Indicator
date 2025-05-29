function colour(score) {
    return score >= 70 ? 'green' : score >= 40 ? 'orange' : 'red';
  }
  
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tabId = tabs[0].id;
  
    /* ask background for the latest data */
    chrome.runtime.sendMessage({ type: 'GET_SCORE', tabId }, resp => {
      if (!resp) return;   // tab hasn't loaded any requests yet
      updateUI(resp);
    });
  });
  
  /* helper that paints the popup */
  function updateUI({ score, trackers, thirdPartyHosts }) {
    const scoreEl = document.getElementById('score');
    scoreEl.textContent = score;
    scoreEl.className   = colour(score);
  
    document.getElementById('summary').textContent =
      `${thirdPartyHosts.length} third-party domain${thirdPartyHosts.length !== 1 ? 's' : ''}, `
    + `${trackers} tracker${trackers !== 1 ? 's' : ''}`;
  
    const ul = document.getElementById('details');
    ul.innerHTML = '';
    thirdPartyHosts.slice(0, 10).forEach(h => {
      const li = document.createElement('li');
      li.textContent = h;
      ul.appendChild(li);
    });
  }
  