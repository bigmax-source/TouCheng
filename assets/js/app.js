const root = document.documentElement;
const themeButton = document.querySelector('[data-theme-toggle]');
const menuButton = document.querySelector('[data-menu-toggle]');
const navLinks = document.querySelector('.nav-links');
const header = document.querySelector('.site-header');
const historyData = Array.isArray(window.TOUCHENG_HISTORY) ? window.TOUCHENG_HISTORY : [];
const siteMeta = window.SITE_META || {};

document.querySelectorAll('[data-site-version]').forEach(el=>el.textContent=siteMeta.version || '1.5');
document.querySelectorAll('[data-site-updated]').forEach(el=>el.textContent=siteMeta.updatedAt || '2026-08-03');
document.querySelectorAll('[data-history-count]').forEach(el=>el.textContent=siteMeta.historyCount || historyData.length || '—');
document.querySelectorAll('[data-site-coverage]').forEach(el=>el.textContent=siteMeta.coverage || '—');
document.querySelectorAll('[data-source-type-count]').forEach(el=>el.textContent=siteMeta.sourceTypeCount || '—');
document.querySelectorAll('[data-curation-count]').forEach(el=>el.textContent=siteMeta.curationCount || '—');

const storedTheme = localStorage.getItem('toucheng-theme');
if (storedTheme) root.dataset.theme = storedTheme;

function updateThemeIcon(){
  if(!themeButton) return;
  const dark = root.dataset.theme === 'dark';
  themeButton.textContent = dark ? '☀' : '☾';
  themeButton.setAttribute('aria-label', dark ? '切換為淺色模式' : '切換為深色模式');
}
updateThemeIcon();

themeButton?.addEventListener('click',()=>{
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('toucheng-theme',root.dataset.theme);
  updateThemeIcon();
});

menuButton?.addEventListener('click',()=>{
  const open = navLinks.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

window.addEventListener('scroll',()=>header?.classList.toggle('scrolled',scrollY>24),{passive:true});

const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}
}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
