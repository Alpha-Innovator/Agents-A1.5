/* Shared identity and footer controls; case-specific language handlers stay intact. */
(() => {
  const update = () => {
    const language = document.documentElement.lang.startsWith('en') ? 'en' : 'zh';
    document.querySelectorAll('[data-shell-zh]').forEach(element => {
      const text = element.getAttribute('data-shell-' + language);
      if (element.textContent !== text) element.textContent = text;
    });
    document.querySelectorAll('[data-shell-home], .home-brand').forEach(link => {
      link.href = link.getAttribute('href').split('?')[0] + '?lang=' + language;
      link.setAttribute('aria-label', language === 'en' ? 'Showcase home' : '展示首页');
    });
    const selected = document.querySelector('[data-shell-current-language]');
    if (selected) {
      selected.textContent = language === 'en' ? 'EN' : '中文';
      selected.style.order = language === 'en' ? '2' : '0';
      const toggle = document.getElementById('langToggle');
      toggle.style.order = language === 'en' ? '0' : '2';
      toggle.setAttribute('aria-pressed', 'false');
    }
  };
  update();
  new MutationObserver(update).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  document.querySelector('[data-shell-top]')?.addEventListener('click', () => {
    window.scrollTo({top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
})();
