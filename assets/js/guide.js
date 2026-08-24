(() => {
  const data = window.TOUCHENG_PUBLIC_LIFE_INFO || {};
  const recycling = data.clothingRecycling || {};
  document.querySelectorAll('[data-recycling-map-count]').forEach(el => {
    el.textContent = `${recycling.mapCollectionCount || 0} 份地圖資料`;
  });
  document.querySelectorAll('[data-recycling-status]').forEach(el => {
    el.textContent = recycling.status || '待整理';
  });
  document.querySelectorAll('[data-recycling-map-link]').forEach(el => {
    if (recycling.mapUrl) el.href = recycling.mapUrl;
  });
  document.querySelectorAll('[data-recycling-map-frame]').forEach(el => {
    if (recycling.embedUrl) el.src = recycling.embedUrl;
  });
})();
