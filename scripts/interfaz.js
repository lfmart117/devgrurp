/* DEVGRU-ES :: control del video de fondo + tema */

/* ---------- Ambient background video: playback continuity + mute ---------- */
(function bgSound(){
  const video = document.querySelector('.bg-video');
  const btn = document.getElementById('sound-btn');
  if(!video) return;

  const KEY_TIME = 'devgru:bgv:time';
  const KEY_MUTED = 'devgru:bgv:muted';

  function ss(){ try{ return window.sessionStorage; }catch(e){ return null; } }

  // Restore mute preference (default: muted).
  const store = ss();
  const savedMuted = store ? store.getItem(KEY_MUTED) : null;
  video.muted = savedMuted === null ? true : savedMuted === '1';

  // Restore playback position so switching pages resumes instead of restarting.
  const savedTime = store ? parseFloat(store.getItem(KEY_TIME)) : NaN;
  function restoreTime(){
    if(isNaN(savedTime)) return;
    try{
      const d = video.duration;
      video.currentTime = (isFinite(d) && d > 0) ? (savedTime % d) : savedTime;
    }catch(e){}
  }
  if(video.readyState >= 1) restoreTime();
  else video.addEventListener('loadedmetadata', restoreTime, { once:true });

  // Persist state (throttled to whole seconds) + right before navigation.
  let lastSaved = -1;
  function persist(){
    if(!store) return;
    store.setItem(KEY_TIME, String(video.currentTime));
    store.setItem(KEY_MUTED, video.muted ? '1' : '0');
  }
  video.addEventListener('timeupdate', function(){
    const s = Math.floor(video.currentTime);
    if(s !== lastSaved){ lastSaved = s; persist(); }
  });
  window.addEventListener('pagehide', persist);
  window.addEventListener('beforeunload', persist);

  function paint(){
    if(!btn) return;
    const ICON_MUTED = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3,9 8,9 13,4 13,20 8,15 3,15" fill="currentColor" stroke="none"/><line x1="16" y1="9" x2="22" y2="15"/><line x1="22" y1="9" x2="16" y2="15"/></svg>';
    const ICON_ON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3,9 8,9 13,4 13,20 8,15 3,15" fill="currentColor" stroke="none"/><path d="M16 8a5 5 0 0 1 0 8"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
    const muted = video.muted;
    btn.innerHTML = muted ? ICON_MUTED : ICON_ON;
    const t = muted ? 'Activar sonido del video de fondo' : 'Silenciar el video de fondo';
    btn.setAttribute('aria-label', t);
    btn.setAttribute('title', t);
  }
  paint();

  // Autoplay. If sound was wanted but the browser blocks it, keep the picture
  // running muted and unmute on the first user gesture.
  video.play().catch(function(){
    if(video.muted) return;
    video.muted = true;
    paint();
    video.play().catch(function(){});
    const resume = function(){
      video.muted = false;
      video.play().catch(function(){});
      persist(); paint();
    };
    document.addEventListener('pointerdown', resume, { once:true });
    document.addEventListener('keydown', resume, { once:true });
  });

  document.addEventListener('visibilitychange', function(){
    if(!document.hidden) video.play().catch(function(){});
  });

  if(btn){
    btn.addEventListener('click', function(){
      video.muted = !video.muted;
      if(!video.muted) video.play().catch(function(){});
      persist(); paint();
    });
  }
})();

/* ---------- Theme: light (default) / dark (gold & black) ---------- */
(function theme(){
  const KEY = 'devgru:theme';
  const root = document.documentElement;
  const btn = document.getElementById('theme-btn');

  function ls(){ try{ return window.localStorage; }catch(e){ return null; } }
  function isDark(){ return root.classList.contains('theme-dark'); }

  function icon(dark){
    const fill = dark ? 'M4 4 L20 4 L4 20 Z' : 'M20 20 L4 20 L20 4 Z';
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">'
      + '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/>'
      + '<path d="' + fill + '" fill="currentColor" stroke="none"/></svg>';
  }
  function paint(){
    if(!btn) return;
    btn.innerHTML = icon(isDark());
    const t = isDark() ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
    btn.setAttribute('aria-label', t);
    btn.setAttribute('title', t);
  }

  const store = ls();
  if(store && store.getItem(KEY) === 'dark') root.classList.add('theme-dark');
  paint();

  if(btn){
    btn.addEventListener('click', function(){
      root.classList.toggle('theme-dark');
      if(store) store.setItem(KEY, isDark() ? 'dark' : 'light');
      paint();
    });
  }
})();
