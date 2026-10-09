(() => {
  const api = 'https://koomean-proxy.meanchannel52.workers.dev';
  const overlay = document.getElementById('global-maintenance-overlay');
  const english = (navigator.languages?.[0] || navigator.language || 'th').toLowerCase().startsWith('en');
  const copy = english ? {eyebrow:'Temporarily unavailable',title:'We’ll be back soon',label:'Automatic reopening in',foot:'This page will return when the service is available again.',empty:'The service is temporarily unavailable. Please check back soon.'} : {eyebrow:'ปิดปรับปรุงชั่วคราว',title:'ระบบจะกลับมาให้บริการเร็ว ๆ นี้',label:'เปิดให้บริการอีกครั้งใน',foot:'หน้านี้จะกลับมาใช้งานได้โดยอัตโนมัติเมื่อระบบเปิดอีกครั้ง',empty:'ระบบปิดให้บริการชั่วคราว กรุณากลับมาใหม่อีกครั้ง'};
  for (const key of ['eyebrow','title','label','foot']) document.getElementById('global-maintenance-'+key).textContent = copy[key];
  let active = false, deadline = 0, timer = 0, ticker = 0, busy = false, nextPoll = 0;
  function tick() {
    if (!active) return;
    const total = Math.max(0, Math.floor((deadline - Date.now())/1000));
    const days = Math.floor(total/86400), hours = Math.floor(total%86400/3600), minutes = Math.floor(total%3600/60), seconds = total%60;
    document.getElementById('global-maintenance-countdown').textContent = deadline ? (days ? `${days}d ` : '') + `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}` : '—';
  }
  function show(state) {
    deadline = Number(state.reopenAt) || 0;
    document.getElementById('global-maintenance-note').textContent = state.note || copy.empty;
    if (!active) {
      active = true; overlay.hidden = false; overlay.tabIndex = -1;
      document.documentElement.dataset.maintenance = 'active';
      for (const node of document.querySelectorAll('.topbar,main,.modal-backdrop,.skip-link')) { node.inert = true; if (node.classList.contains('modal-backdrop')) node.setAttribute('aria-hidden','true'); }
      document.body.style.overflow = 'hidden'; overlay.focus({preventScroll:true});
    }
    clearInterval(ticker); if (!document.hidden) ticker = setInterval(tick, 1000); tick();
  }
  async function poll() {
    clearTimeout(timer);
    if (busy || document.hidden || !navigator.onLine) return;
    if (Date.now() < nextPoll) { timer = setTimeout(poll, nextPoll-Date.now()); return; }
    busy = true;
    try {
      const response = await fetch(api,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({action:'maintenanceStatus'}),cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(10000)});
      if (response.status === 429) {
        const retry = response.headers.get('Retry-After');
        const wait = retry ? (/^\d+$/.test(retry) ? Number(retry)*1000 : Date.parse(retry)-Date.now()) : 60000;
        nextPoll = Date.now() + Math.max(wait || 60000, 60000); return;
      }
      if (!response.ok) return;
      const data = await response.json();
      if (data.maintenance?.active) show(data.maintenance);
      else if (active) location.reload();
    } catch {} finally {
      busy = false; nextPoll = Math.max(nextPoll, Date.now()+60000);
      if (!document.hidden && navigator.onLine) timer = setTimeout(poll, nextPoll-Date.now());
    }
  }
  document.addEventListener('visibilitychange', () => {
    clearTimeout(timer); clearInterval(ticker);
    if (!document.hidden) { if (active) { tick(); ticker = setInterval(tick,1000); } poll(); }
  });
  window.addEventListener('offline', () => clearTimeout(timer));
  window.addEventListener('online', poll);
  poll();
})();
