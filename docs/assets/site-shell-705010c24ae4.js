/* Shared navigation and footer for the English-only showcase site. */
(() => {
  document.querySelectorAll('[data-shell-en]').forEach(element => {
    const text = element.getAttribute('data-shell-en');
    if (element.textContent !== text) element.textContent = text;
  });
  document.querySelector('[data-shell-top]')?.addEventListener('click', () => {
    window.scrollTo({top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
})();
