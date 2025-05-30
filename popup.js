/* -----------------------------------------------------------------------
   Toolbar popup – now compatible with the richer background payload
------------------------------------------------------------------------ */

function colour(s) { return s>=70?'green' : s>=40?'orange':'red'; }

/* once the popup opens, ask background for the latest data */
chrome.tabs.query({active:true, currentWindow:true}, tabs => {
  const tabId = tabs[0].id;
  chrome.runtime.sendMessage({type:'GET_SCORE', tabId}, resp => {
    if (!resp) return;      // could be a blank tab with no traffic yet
    paint(resp);
  });
});

function paint({score, trackers, thirdParty, hosts}) {
  /* headline */
  const hEl = document.getElementById('score');
  hEl.textContent = score;
  hEl.className   = colour(score);

  /* summary */
  const sEl = document.getElementById('summary');
  sEl.textContent =
      `${thirdParty} third-party domain${thirdParty!==1?'s':''}, `
    + `${trackers} tracker${trackers!==1?'s':''}`;

  /* domain list */
  const ul = document.getElementById('details');
  ul.innerHTML = '';
  hosts.slice(0,10).forEach(({host,tracker,hits})=>{
    const li = document.createElement('li');
    li.textContent =
      `${tracker?'⚠️ ':''}${host}  (${hits})`;
    ul.appendChild(li);
  });
}
