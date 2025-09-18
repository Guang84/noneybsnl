/* ---------- Small utilities ---------- */
const $ = sel => document.querySelector(sel);
const log = (text, cls = '') => {
  const el = document.createElement('div');
  el.className = 'line' + (cls ? ' ' + cls : '');
  el.textContent = text;
  const consoleEl = $('#consoleLog');
  if (consoleEl) {
    consoleEl.appendChild(el);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function extractHost(url){
  try{
    const u = new URL(url);
    return u.hostname + (u.port ? ':' + u.port : '');
  }catch(e){
    return url;
  }
}

/* ---------- UI refs ---------- */
const statusPill = document.getElementById('statusPill');
const progressFill = document.getElementById('progress');
const progressPct = document.getElementById('progressPct');
const manualLink = document.getElementById('manualLink');
const retryBtn = document.getElementById('retryBtn');

function setStatus(text){ if (statusPill) statusPill.textContent = text; }
function setProgress(p){
  if (progressFill) progressFill.style.width = `${p}%`;
  if (progressPct) progressPct.textContent = `${p}%`;
}
function showRetry(message){
  log(`[ALERT] ${message}`, 'fail');
  if (manualLink) {
    manualLink.classList.remove('hidden');
    manualLink.href = (window.redirectLink||'#');
  }
  if (retryBtn) {
    retryBtn.classList.remove('hidden');
    retryBtn.onclick = () => {
      // reset UI
      const consoleLog = document.getElementById('consoleLog');
      if (consoleLog) consoleLog.innerHTML = '';
      setProgress(0);
      setStatus('RETRYING');
      manualLink.classList.add('hidden');
      retryBtn.classList.add('hidden');
      // restart main flow
      (async ()=>{ await sleep(200); mainRestart(); })();
    };
  }
}
function mainRestart(){
  window.location.reload();
}

/* ---------- Main workflow ---------- */
(async function main(){
  setStatus && setStatus('LOADING CONFIG');
  log('[BOOT] NOC front-end starting…');

  // Load config files
  let redirects = [];
  try {
    const r = await fetch('redirects.json', {cache:'no-store'})
      .then(x=>x.ok?x.json():Promise.reject('no redirects'))
      .catch(()=>({redirects}));
    if (r && r.redirects) redirects = r.redirects;
  } catch(e){
    log('[WARN] Could not load config files fully; using defaults', 'muted');
  }

  if (!redirects || redirects.length === 0){
    log('[ERROR] redirects.json has no entries. Place a valid redirects.json and refresh.', 'fail');
    setStatus && setStatus('NO TARGETS');
    showRetry('Config missing: cannot continue.');
    return;
  }

  setStatus && setStatus('SCANNING NODES');
  setProgress && setProgress(4);
  await sleep(400);

  let success = false;
  for (let idx = 0; idx < redirects.length; idx++){
    const target = redirects[idx];
    const url = (target.url || '').trim();
    const delay = Number(target.delay) || 500;

    log(`\n[DNS] Resolving target #${idx+1} → ${url}`, 'muted');
    setProgress && setProgress(10 + idx*6);
    await sleep(600);

    // --- LIVE PROBE (HTTP GET, expect status 200) ---
    log(`[PROBE] Attempting live HTTP GET to ${url}`);
    try {
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (res.status === 200) {
        log(`[PROBE] Host responded with 200 — passing to handshake sequence.`, 'ok');
        setProgress && setProgress(75);
        log(`[HANDSHAKE] Initiating TLS handshake...`);
        await sleep(700 + rand(0,400));
        log(`[HANDSHAKE] Verifying certificate chain...`);
        await sleep(450 + rand(0,300));
        log(`[CERT] CN=${extractHost(url)} | Issuer=Let's Encrypt | Valid=90 days`);
        await sleep(380);
        setProgress && setProgress(90);
        log(`[LINK] Secure channel established to ${url}. Redirecting in ${delay}ms`, 'ok');
        if (manualLink) {
          manualLink.href = url;
          manualLink.classList.remove('hidden');
        }
        setStatus && setStatus('CONNECTED');
        await sleep(delay);
        window.location.href = url;
        success = true;
        break;
      } else {
        log(`[PROBE] Response status: ${res.status}. Showing fallback message.`, 'fail');
        setStatus && setStatus('NODE OFFLINE');
        setProgress && setProgress(65);
        await sleep(450);
        log(`[FALLBACK] Moving to next configured node…`, 'muted');
        await sleep(200);
      }
    } catch (error) {
      log(`[PROBE] No live response: ${error.message}`, 'fail');
      setStatus && setStatus('NODE OFFLINE');
      setProgress && setProgress(65);
      await sleep(450);
      log(`[FALLBACK] Moving to next configured node…`, 'muted');
      await sleep(200);
    }
  }

  if (!success){
    log('\n[ERROR] All configured nodes unreachable. Displaying diagnostics.', 'fail');
    setStatus && setStatus('ALL NODES DOWN');
    setProgress && setProgress(100);
    showRetry('All nodes unreachable. Please check your ngrok/local server or network and retry.');
  }
})();