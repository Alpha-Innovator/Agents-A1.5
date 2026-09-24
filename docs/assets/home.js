/* Homepage only: bilingual copy, relative navigation and progressive motion. */
(() => {
  const pageLocation = window.showcaseLocation || location;
  let lang;
  const localized = value => (value?.[lang] ?? value?.zh ?? '').replaceAll('{brand}', HOME.brand);
  const contentAt = path => path.split('.').reduce((value, key) => value?.[key], HOME);
  const text = [...document.querySelectorAll('[data-i18n]')].map(element => ({
    element, value: contentAt(element.dataset.i18n)
  }));
  const links = [...document.querySelectorAll('a[href]')]
    .filter(link => link.dataset.languageMode !== 'independent')
    .map(link => ({link, href: link.getAttribute('href')}));
  const buttons = [...document.querySelectorAll('[data-language]')];
  const readLanguage = () => 'en';

  function setLanguage(next, updateURL = true) {
    next = 'en';
    if (next === lang) return;
    lang = next;
    // Keep the document, decoded cover images, focus and scroll position alive.
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.title = localized(HOME.home.pageTitle);
    document.querySelector('meta[name="description"]').content = localized(HOME.home.description);
    text.forEach(({element, value}) => {
      const nextText = localized(value);
      if (element.textContent !== nextText) element.textContent = nextText;
    });
    links.forEach(({link, href}) => {
      const url = new URL(href, pageLocation.href);
      url.searchParams.set('lang', lang);
      link.href = url.href;
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === lang)));
    if (!updateURL) return;
    const url = new URL(pageLocation.href);
    url.searchParams.set('lang', lang);
    if (window.showcaseLocation) window.showcaseLocation.replace(url.href);
    else history.replaceState(null, '', url);
  }
  buttons.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));
  window.addEventListener('popstate', () => setLanguage(readLanguage(), false));
  setLanguage(readLanguage(), false);

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const cards = [...document.querySelectorAll('.showcase-card')];
  const revealed = new WeakSet();
  const animations = new Map();
  let observer;

  function stopReveal(card) {
    animations.get(card)?.cancel();
    animations.delete(card);
  }

  function observeCards() {
    observer?.disconnect();
    if (reducedMotion.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
    observer = new IntersectionObserver(entries => {
      if (reducedMotion.matches || document.hidden) return;
      entries.forEach(({target, isIntersecting}) => {
        if (!isIntersecting || revealed.has(target)) return;
        revealed.add(target);
        observer.unobserve(target);
        const grid = target.parentElement;
        const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
        const position = [...grid.children].indexOf(target) % columns;
        // Content is visible by default. Only the short entrance is animated;
        // missing JS/observer support can never leave a card hidden.
        const animation = target.animate([
          {opacity: 0, transform: 'translateY(14px)'},
          {opacity: 1, transform: 'translateY(0)'}
        ], {duration: 520, delay: position * 65, easing: 'cubic-bezier(.2,.65,.25,1)', fill: 'backwards'});
        animations.set(target, animation);
        animation.onfinish = () => animations.delete(target);
      });
    }, {threshold: .06});
    cards.forEach(card => { if (!revealed.has(card)) observer.observe(card); });
  }

  let activeCover = null;
  let pointerFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  const properties = ['--spot-x', '--spot-y', '--tilt-x', '--tilt-y', '--art-x', '--art-y'];
  const canTrack = () => finePointer.matches && !reducedMotion.matches;

  function resetPointer() {
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    if (activeCover) properties.forEach(name => activeCover.style.removeProperty(name));
    activeCover = null;
  }

  function paintPointer() {
    pointerFrame = 0;
    if (!activeCover || !canTrack()) return;
    const rect = activeCover.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (pointerX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (pointerY - rect.top) / rect.height));
    const values = [`${x * 100}%`, `${y * 100}%`, `${(.5 - y) * 3}deg`, `${(x - .5) * 3}deg`, `${(x - .5) * 5}px`, `${(y - .5) * 4 - 2}px`];
    properties.forEach((name, index) => activeCover.style.setProperty(name, values[index]));
  }

  document.querySelectorAll('.available .card-cover').forEach(cover => {
    cover.addEventListener('pointermove', event => {
      if (!canTrack() || event.pointerType === 'touch') return;
      if (activeCover !== cover) {
        resetPointer();
        activeCover = cover;
      }
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointer);
    }, {passive: true});
    cover.addEventListener('pointerleave', () => { if (activeCover === cover) resetPointer(); });
    cover.addEventListener('pointercancel', resetPointer);
  });

  document.addEventListener('focusin', event => {
    const card = event.target.closest('.showcase-card');
    if (!card) return;
    revealed.add(card);
    observer?.unobserve(card);
    stopReveal(card);
  });
  reducedMotion.addEventListener('change', () => {
    animations.forEach((_, card) => stopReveal(card));
    resetPointer();
    observeCards();
  });
  finePointer.addEventListener('change', resetPointer);
  window.addEventListener('blur', resetPointer);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      animations.forEach((_, card) => stopReveal(card));
      resetPointer();
    }
  });
  observeCards();
})();
