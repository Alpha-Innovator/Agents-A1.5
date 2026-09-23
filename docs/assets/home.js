/* Homepage only: declarative bilingual copy and relative navigation. */
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
  const readLanguage = () => new URLSearchParams(pageLocation.search).get('lang') === 'en' ? 'en' : 'zh';

  function setLanguage(next, updateURL = true) {
    next = next === 'en' ? 'en' : 'zh';
    if (next === lang) return;
    lang = next;
    // Keep the document, decoded cover images, focus and scroll position alive.
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.title = localized(HOME.home.pageTitle);
    document.querySelector('meta[name="description"]').content = localized(HOME.home.description);
    document.querySelector('.home-brand').setAttribute('aria-label', localized(HOME.home.homeLabel));
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
})();
