const root = document.documentElement;
const themeButton = document.querySelector('[data-theme-toggle]');
const menuButton = document.querySelector('[data-menu-toggle]');
const navLinks = document.querySelector('.nav-links');
const header = document.querySelector('.site-header');

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
