/* Keep a reader's place when opening a showcase and returning to the model site. */
(() => {
  'use strict';
  const script = document.currentScript;
  const home = new URL('../index.html', script.src);
  const root = new URL('.', home);
  const key = 'agents-a15:showcase-origin:' + root.pathname;
  const pendingKey = key + ':return';
  const isHomePath = path => path === home.pathname || path === root.pathname;
  const isHome = isHomePath(location.pathname);

  function read(key) {
    try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
  }
  function write(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Anchors remain usable. */ }
  }
  function valid(record) {
    if (!record || !Number.isFinite(record.y) || typeof record.url !== 'string') return false;
    try {
      const url = new URL(record.url);
      return url.origin === home.origin && isHomePath(url.pathname);
    } catch { return false; }
  }
  const plainClick = event => event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;

  if (isHome) {
    document.addEventListener('click', event => {
      const card = event.target.closest('a.demo-card');
      if (!card || !plainClick(event)) return;
      const record = {url: location.href, y: scrollY, card: card.id, offset: card.getBoundingClientRect().top};
      write(key, record);
      try { history.replaceState({...history.state, a15ShowcaseOrigin: record}, '', location.href); } catch { /* Storage fallback remains. */ }
    });

    const requested = read(pendingKey);
    try { sessionStorage.removeItem(pendingKey); } catch { /* Storage may be disabled. */ }
    const navigation = performance.getEntriesByType('navigation')[0];
    const record = requested || (navigation?.type === 'back_forward' ? history.state?.a15ShowcaseOrigin : null);
    let interrupted = false;
    for (const name of ['wheel', 'touchstart', 'keydown', 'pointerdown']) {
      window.addEventListener(name, () => { interrupted = true; }, {once: true, passive: true});
    }
    function restore(position) {
      if (interrupted || !valid(position)) return;
      const card = document.getElementById(position.card);
      const y = card && Number.isFinite(position.offset)
        ? scrollY + card.getBoundingClientRect().top - position.offset
        : position.y;
      window.scrollTo({top: Math.max(0, y), behavior: 'instant'});
      card?.focus({preventScroll: true});
    }
    if (valid(record)) requestAnimationFrame(() => restore(record));
    window.addEventListener('pageshow', event => {
      if (event.persisted) interrupted = false;
      const position = event.persisted ? history.state?.a15ShowcaseOrigin : record;
      if (valid(position)) requestAnimationFrame(() => restore(position));
    });
    return;
  }

  const origin = read(key);
  const returnURL = new URL(valid(origin) ? origin.url : home.href);
  returnURL.hash = valid(origin) && origin.card ? origin.card : 'demos';
  document.querySelectorAll('[data-site-return], [data-showcase-return], [data-showcase-home], [data-shell-home], .home-brand').forEach(link => {
    link.href = returnURL.href;
    if (!link.matches('[aria-current="page"]')) link.setAttribute('aria-label', 'Back to all demos');
    const label = link.querySelector('[data-showcase-return-label]');
    if (label) label.textContent = 'Back to demos';
    link.addEventListener('click', event => {
      if (plainClick(event) && valid(origin)) write(pendingKey, origin);
    });
  });
})();
