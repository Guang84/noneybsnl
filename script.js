/* BSNL NOC — Redirect + Network Diagnostic Simulation
   - Reads redirects.json and messages.json from same folder.
   - Runs simulated traceroute, ping, and port checks (browser-limited).
   - Attempts a live fetch with timeout to verify reachability.
   - If reachable -> redirect. Otherwise show diagnostics and manual/ retry.
*/

/* ---------- small utilities ---------- */
const $ = sel => document.querySelector(sel);
const log = (text, cls = '') => {
  const el = document.createElement('div');
  el.className = 'line' + (cls ? ' ' + cls : '');
  el.textContent = text;
  const consoleEl = $('#consoleLog');
  consoleEl.appendChild(el);
  consoleEl.scrollTop = consoleEl.scrollHeight;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/* ---------- background canvas: subtle moving network lines ---------- */
(function bgCanvas() {
  const c = document.getElementById('bgCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  function resize(){ c.width = innerWidth; c.height = innerHeight; }
  resize(); window.addEventListener('resize', resize);
  const nodes = [];
  for (let i=0;i<24;i++){
    nodes.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,vx:(Math.random()-0.5)*0.3,vy:(Math.random()-0.5)*0.3,r:Math.random()*2+1});
  }
  function step(){
    ctx.clearRect(0,0,c.width,c.height);
    // draw faint connections
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#00ff9f';
    for (let i=0;i<nodes.length;i++){
      for (let j=i+1;j<nodes.length;j++){
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const d2 = dx*dx + dy*dy;
        if (d2 < 200000){
          ctx.lineWidth = 1 - (Math.sqrt(d2)/700);
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    nodes.forEach(n=>{
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > innerWidth) n.vx *= -1;
      if (n.y < 0 || n.y > innerHeight) n.vy *= -1;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0,255,159,0.08)';
      ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
      ctx.fill();
    });
    requestAnimationFrame(step);
  }
  step();
})();

/* ---------- network helpers ---------- */
async function fetchWithTimeout(url, opts = {}, timeout = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal, cache: "no-store", mode: "no-cors", redirect: "follow" });
    clearTimeout(id);
    // note: mode=no-cors returns opaque responses but resolves unless network unreachable
    return { ok: true, res };
  } catch (err) {
    clearTimeout(id);
    return { ok: false, error: err };
  }
}

/* small IP generator for traceroute simulation */
function randomIP(privateBias = false){
  if (privateBias && Math.random() < 0.7){
    return `192.168.${rand(0,255)}.${rand(1,254)}`;
  }
  return `${rand(1,223)}.${rand(0,255)}.${rand(0,255)}.${rand(1,254)}`;
}

/* ---------- UI refs ---------- */
const statusPill = document.getElementById('statusPill');
const progressFill = document.getElementById('progress');
const progressPct = document.getElementById('progressPct');
const manualLink = document.getElementById('manualLink');
const retryBtn = document.getElementById('retryBtn');

function setStatus(text){ statusPill.textContent = text; }
function setProgress(p){ progressFill.style.width = `${p}%`; progressPct.textContent = `${p}%`; }

/* ---------- core workflow ---------- */
(async function main(){
  setStatus('LOADING CONFIG');
  log('[BOOT] NOC front-end starting…');

  // load config files
  let messages = ["Connecting..."];
  let redirects = [];
  try {
    const [m, r] = await Promise.all([
      fetch('messages.json', {cache:'no-store'}).then(x=>x.ok?x.json():Promise.reject('no messages')).catch(()=>({messages})),
      fetch('redirects.json', {cache:'no-store'}).then(x=>x.ok?x.json():Promise.reject('no redirects')).catch(()=>({redirects}))
    ]);
    if (m && m.messages) messages = m.messages;
    if (r && r.redirects) redirects = r.redirects;
  } catch(e){
    log('[WARN] Could not load config files fully; using defaults', 'muted');
  }

  if (!redirects || redirects.length === 0){
    log('[ERROR] redirects.json has no entries. Place a valid redirects.json and refresh.', 'fail');
    setStatus('NO TARGETS');
    showRetry('Config missing: cannot continue.');
    return;
  }

  // Shuffle or keep as-is; we'll keep order but allow fallback
  setStatus('SCANNING NODES');
  setProgress(4);
  await sleep(400);

  // overall progress steps: DNS(15) -> TRACEROUTE(40) -> PING/PORT(30) -> HANDSHAKE(100)
  let globalProgress = 4;

  // iterate through configured redirects and test each
  let success = false;
  for (let idx = 0; idx < redirects.length; idx++){
    const target = redirects[idx];
    const url = (target.url || '').trim();
    const delay = Number(target.delay) || 500;

    log(`\n[DNS] Resolving target #${idx+1} → ${url}`, 'muted');
    setProgress(Math.min(10 + idx*6, 18));
    await sleep(600);

    // Traceroute simulation
    log(`[TRACE] Traceroute to ${url}`);
    const hops = rand(3,6);
    for (let h=1; h<=hops; h++){
      const ip = randomIP(h < 2); // first hop likely private
      const ms = rand(2, (h===hops? rand(20,120) : 8 + h*6));
      log(`[TRACE] Hop ${h}: ${ip} (${ms} ms)`);
      setProgress(Math.min(globalProgress += Math.floor(20/hops), 18 + Math.floor((idx+1)*8)));
      await sleep(250 + Math.random()*350);
    }

    // Ping sweep
    log(`[PING] Ping sweep to ${url}`);
    const pings = [];
    for (let i=0;i<4;i++){
      const rtt = rand(10, 180);
      const drop = Math.random() < 0.03 ? 1 : 0; // tiny chance of drop
      pings.push({rtt, drop});
      log(`[PING] seq=${i+1} time=${drop? '-' : rtt + ' ms'} ${drop? ' (timeout)' : ''}`);
      await sleep(180);
    }
    const successful = pings.filter(p=>!p.drop).length;
    const avg = Math.round(pings.filter(p=>!p.drop).reduce((s,p)=>s+p.rtt,0) / Math.max(1, successful));
    const lossPct = Math.round(100*(4-successful)/4);
    log(`[PING] Avg=${successful? avg + ' ms' : '-'} | Loss=${lossPct}%`);

    setProgress(Math.min(globalProgress += 8, 40));
    await sleep(350);

    // Port scan (simulated because browser cannot scan arbitrary ports reliably)
    const scanPorts = [80, 443, 8080];
    log(`[SCAN] Quick port scan: ${scanPorts.join(', ')}`);
    let openPorts = [];
    for (const p of scanPorts){
      // bias: if url contains "ngrok" likely only 80/443 open
      const biasOpen = url.includes('ngrok') ? (p===80||p===443) : Math.random() > 0.5;
      const isOpen = Math.random() < (biasOpen ? 0.8 : 0.35);
      log(`[SCAN] port ${p} → ${isOpen ? 'OPEN' : 'CLOSED'}`);
      if (isOpen) openPorts.push(p);
      await sleep(220);
    }

    setProgress(Math.min(globalProgress += 12, 60));
    await sleep(220);

    // Live reachability check — try fetch with timeout; if network unreachable, fetch will reject
    log(`[PROBE] Attempting live probe (timeout 4s) to ${url}`);
    const probe = await fetchWithTimeout(url, { method: 'GET' }, 4000);
    if (probe.ok) {
      // treat as reachable
      log(`[PROBE] Host responded — passing to handshake sequence.`, 'ok');
      setProgress(75);
      // Simulate secure handshake
      log(`[HANDSHAKE] Initiating TLS handshake...`);
      await sleep(700 + rand(0,400));
      log(`[HANDSHAKE] Verifying certificate chain...`);
      await sleep(450 + rand(0,300));
      // fake cert info
      log(`[CERT] CN=${extractHost(url)} | Issuer=Let's Encrypt | Valid=90 days`);
      await sleep(380);
      setProgress(90);
      log(`[LINK] Secure channel established to ${url}. Redirecting in ${delay}ms`, 'ok');
      // show manual link as fallback for a moment (in case browser blocks navigation)
      manualLink.href = url;
      manualLink.classList.remove('hidden');
      setStatus('CONNECTED');
      await sleep(delay);
      // redirect
      success = true;
      try { window.location.href = url; } catch(e){ /* ignore */ }
      break;
    } else {
      log(`[PROBE] No live response: ${probe.error ? probe.error.message : 'timeout' }`, 'fail');
      setStatus('NODE OFFLINE');
      setProgress(Math.min(globalProgress += 6, 65));
      await sleep(450);
      log(`[FALLBACK] Moving to next configured node…`, 'muted');
      await sleep(200);
    }
  } // end for

  if (!success){
    log('\n[ERROR] All configured nodes unreachable. Displaying diagnostics.', 'fail');
    setStatus('ALL NODES DOWN');
    setProgress(100);
    showRetry('All nodes unreachable. Please check your ngrok/local server or network and retry.');
  }

})();

/* ---------- helpers ---------- */
function extractHost(url){
  try{
    const u = new URL(url);
    return u.hostname + (u.port ? ':' + u.port : '');
  }catch(e){
    return url;
  }
}

function showRetry(message){
  log(`[ALERT] ${message}`, 'fail');
  const manual = document.getElementById('manualLink');
  manual.classList.remove('hidden');
  manual.href = (window.redirectLink||'#');
  retryBtn.classList.remove('hidden');
  retryBtn.onclick = () => {
    // reset UI
    document.getElementById('consoleLog').innerHTML = '';
    setProgress(0);
    setStatus('RETRYING');
    manual.classList.add('hidden');
    retryBtn.classList.add('hidden');
    // restart main flow
    (async ()=>{ await sleep(200); mainRestart(); })();
  };
}

/* restart wrapper to avoid name conflicts — called by retry */
function mainRestart(){
  // very simple reload to re-run the same script logic
  // simpler and robust: just reload page so config re-fetch happens
  window.location.reload();
}
