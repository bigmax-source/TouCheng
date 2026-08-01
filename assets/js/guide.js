(() => {
  const items = Array.isArray(window.TOUCHENG_GUIDE_ITEMS) ? window.TOUCHENG_GUIDE_ITEMS : [];
  const container = document.querySelector('#guide-items');
  const empty = document.querySelector('#guide-empty');
  if (!container || !items.length) return;
  empty.hidden = true;
  container.hidden = false;
  container.innerHTML = items.map(item => `
    <article class="guide-item">
      <div><span class="status-chip">${item.status || '待確認'}</span><h3>${item.name}</h3><p>${item.address || '地址待補'}</p>${item.notes ? `<small>${item.notes}</small>` : ''}</div>
      ${item.mapUrl ? `<a class="btn btn-ghost" href="${item.mapUrl}" target="_blank" rel="noopener noreferrer">導航 ↗</a>` : ''}
    </article>`).join('');
})();
