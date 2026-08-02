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
        <span>${category === '全部' ? '⌕' : '•'}</span><b>${esc(category)}</b><small>${category === '全部' ? `${items.length} 筆資料` : `${items.filter(i => i.category === category).length} 筆`}</small>
      </button>`).join('');
  }
  function render() {
    const q = (search.value || '').trim().toLowerCase();
    const filtered = items.filter(item => {
      const matchesCategory = activeCategory === '全部' || item.category === activeCategory;
      const haystack = [item.name,item.category,item.description,item.notes,item.hours,item.phone,item.address,item.contact,item.email,item.line].join(' ').toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
    resultCount.textContent = `顯示 ${filtered.length}／${items.length} 筆`;
    list.innerHTML = filtered.length ? filtered.map(item => `
      <article class="guide-item-card">
        <div class="guide-item-main">
          <div class="guide-item-meta"><span class="source-badge supplement">${esc(item.category)}</span><span class="status-chip">${esc(item.status || '待確認')}</span></div>
          <h3>${esc(item.name)}</h3>
          ${item.description ? `<p>${esc(item.description)}</p>` : ''}
          ${item.contact ? `<p><strong>聯絡人：</strong>${esc(item.contact)}</p>` : ''}
          ${item.address ? `<p><strong>地址：</strong>${esc(item.address)}</p>` : ''}
          ${item.hours ? `<p><strong>時間：</strong>${esc(item.hours)}</p>` : ''}
          ${item.phone ? `<p><strong>電話：</strong><a href="tel:${esc(item.phone.replace(/[^0-9+]/g,''))}">${esc(item.phone)}</a></p>` : ''}
          ${item.fax ? `<p><strong>傳真：</strong>${esc(item.fax)}</p>` : ''}
          ${item.email ? `<p><strong>電子郵件：</strong><a href="mailto:${esc(item.email)}">${esc(item.email)}</a></p>` : ''}
          ${item.line ? `<p><strong>LINE：</strong>${esc(item.line)}</p>` : ''}
          ${item.businessId ? `<p><strong>統一編號：</strong>${esc(item.businessId)}</p>` : ''}
          ${item.image ? `<a class="guide-image-link" href="${esc(item.image)}" target="_blank" rel="noopener noreferrer"><img src="${esc(item.image)}" alt="${esc(item.name)}資料圖片" loading="lazy"><span>查看資料圖片 ↗</span></a>` : ''}
          ${item.notes ? `<small>${esc(item.notes)}</small>` : ''}
        </div>
        <div class="guide-item-actions">
          ${item.phone ? `<a class="btn btn-ghost" href="tel:${esc(item.phone.replace(/[^0-9+]/g,''))}">立即撥號</a>` : ''}
          ${item.url ? `<a class="btn btn-ghost" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">開啟連結 ↗</a>` : ''}
          ${item.mapUrl ? `<a class="btn btn-primary" href="${esc(item.mapUrl)}" target="_blank" rel="noopener noreferrer">導航 ↗</a>` : ''}
          ${!item.mapUrl && item.address ? `<a class="btn btn-primary" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}" target="_blank" rel="noopener noreferrer">導航 ↗</a>` : ''}
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
  renderCategories(); render();
})();
