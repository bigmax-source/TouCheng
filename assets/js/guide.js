(() => {
  const items = Array.isArray(window.TOUCHENG_GUIDE_ITEMS) ? window.TOUCHENG_GUIDE_ITEMS : [];
  const list = document.querySelector('#guide-items');
  const search = document.querySelector('#guide-search');
  const categoryWrap = document.querySelector('#guide-categories');
  const resultCount = document.querySelector('#guide-result-count');
  let activeCategory = '全部';

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const categories = ['全部', ...new Set(items.map(item => item.category).filter(Boolean))];

  function renderCategories() {
    categoryWrap.innerHTML = categories.map((category, index) => `
      <button class="guide-category ${index === 0 ? 'is-active' : ''}" type="button" data-category="${esc(category)}">
        <span>${category === '全部' ? '⌕' : '•'}</span><b>${esc(category)}</b><small>${category === '全部' ? `${items.length} 筆已整理資料` : `${items.filter(i => i.category === category).length} 筆`}</small>
      </button>`).join('');
  }

  function render() {
    const q = (search.value || '').trim().toLowerCase();
    const filtered = items.filter(item => {
      const matchesCategory = activeCategory === '全部' || item.category === activeCategory;
      const haystack = [item.name,item.category,item.description,item.notes,item.hours,item.phone].join(' ').toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
    resultCount.textContent = `顯示 ${filtered.length}／${items.length} 筆`;
    list.innerHTML = filtered.length ? filtered.map(item => `
      <article class="guide-item-card">
        <div class="guide-item-main">
          <div class="guide-item-meta"><span class="source-badge supplement">${esc(item.category)}</span><span class="status-chip">${esc(item.status || '待確認')}</span></div>
          <h3>${esc(item.name)}</h3>
          ${item.description ? `<p>${esc(item.description)}</p>` : ''}
          ${item.hours ? `<p><strong>時間：</strong>${esc(item.hours)}</p>` : ''}
          ${item.phone ? `<p><strong>電話：</strong><a href="tel:${esc(item.phone.replace(/[^0-9+]/g,''))}">${esc(item.phone)}</a></p>` : ''}
          ${item.notes ? `<small>${esc(item.notes)}</small>` : ''}
        </div>
        <div class="guide-item-actions">
          ${item.url ? `<a class="btn btn-ghost" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">開啟連結 ↗</a>` : ''}
          ${item.mapUrl ? `<a class="btn btn-primary" href="${esc(item.mapUrl)}" target="_blank" rel="noopener noreferrer">導航 ↗</a>` : ''}
        </div>
      </article>`).join('') : '<p class="guide-empty">找不到符合條件的生活指南資料。</p>';
  }

  categoryWrap.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    categoryWrap.querySelectorAll('[data-category]').forEach(el => el.classList.toggle('is-active', el === button));
    render();
  });
  search.addEventListener('input', render);
  renderCategories();
  render();
})();
