(() => {
  const stories = [...(window.TOUCHENG_STORIES || [])].reverse();
  const storyById = new Map(stories.map(story => [story.id, story]));
  const grid = document.querySelector('#storiesGrid');
  const search = document.querySelector('#storySearch');
  const filters = document.querySelector('#storyFilters');
  const count = document.querySelector('#storyCount');
  const dialog = document.querySelector('#storyDialog');
  const state = { category: '全部', query: '' };
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const normalize = value => String(value ?? '').toLocaleLowerCase('zh-Hant');

  const placeTargets = [
    ['頭城老街','map.html#place-toucheng-old-street'], ['烏石港','map.html#place-wushih-harbor'],
    ['蘭陽博物館','map.html#place-lanyang-museum'], ['慶元宮','map.html#place-qingyuan-temple'],
    ['頭城媽祖廟','map.html#place-qingyuan-temple'], ['南門福德祠','map.html#place-south-fude-temple'],
    ['北門福德祠','map.html#place-north-fude-temple'], ['東嶽廟','map.html#place-dongyue-temple'],
    ['頭城車站','map.html#place-toucheng-station'], ['草嶺隧道','map.html#place-old-caoling-tunnel'],
    ['頭城文創園區','map.html#place-toucheng-cultural-park'], ['龜山島','map.html#place-guishan-island'],
    ['史雲湖','map.html#place-shiyun-lake'], ['大坑罟','map.html#place-dakenggu']
  ].map(([name,url]) => ({name,url}));
  const peopleTargets = [
    ['馬偕','people.html#george-mackay'], ['盧纘祥','people.html#lu-zuanxiang'],
    ['李榮春','people.html#li-rongchun'], ['卓媽媽','people.html#zhuo-mama'],
    ['卓陳明','people.html#zhuo-mama'], ['莊漢川','people.html#zhuang-hanchuan'],
    ['連明偉','people.html#lian-mingwei'], ['彭仁鴻','people.html#peng-renhong'],
    ['林瑞文','people.html#lin-ruiwen']
  ].map(([name,url]) => ({name,url}));

  document.querySelectorAll('[data-story-total]').forEach(el => el.textContent = stories.length);

  function unique(items, key = item => item.name || item.id || item) {
    const seen = new Set();
    return items.filter(item => {
      const value = key(item);
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  function splitContext(value) {
    if (!value || /^相關閱讀[：:]/.test(value) || /待建立|關聯資料待整理/.test(value)) return [];
    return unique(value.split(/[、，,／]/).map(item => item.trim()).filter(Boolean));
  }

  function relationText(story) {
    return [story.related, ...(story.list || []), ...(story.tags || [])].filter(Boolean).join(' ');
  }

  function inferRelations(story, targets) {
    const text = relationText(story);
    return targets.filter(target => text.includes(target.name));
  }

  function storyRelations(story) {
    const places = [...(story.relatedPlaces || []), ...inferRelations(story, placeTargets)];
    const people = [...(story.relatedPeople || []), ...inferRelations(story, peopleTargets)];
    if (story.listType === 'places') {
      for (const item of story.list || []) {
        const target = placeTargets.find(place => item.includes(place.name));
        places.push(target || {name:item});
      }
    }
    if (story.listType === 'people') {
      for (const item of story.list || []) {
        const name = item.split('（')[0].trim();
        const target = peopleTargets.find(person => name.includes(person.name));
        people.push(target ? {...target,note:item} : {name,note:item});
      }
    }
    return {places:unique(places), people:unique(people)};
  }

  function storyTags(story, relations) {
    const tags = story.tags || (story.listType === 'tags' ? story.list || [] : []);
    const relationNames = new Set([...relations.places, ...relations.people].map(item => item.name));
    return unique(tags.filter(tag => !relationNames.has(tag)));
  }

  function filtered() {
    return stories.filter(story => {
      const categoryOK = state.category === '全部' || story.category === state.category;
      const haystack = normalize([
        story.title, story.content, story.category, ...(story.list || []), ...(story.tags || []),
        story.related, story.source, ...(story.relatedPlaces || []).map(item => item.name),
        ...(story.relatedPeople || []).map(item => item.name)
      ].join(' '));
      return categoryOK && (!state.query || haystack.includes(normalize(state.query)));
    });
  }

  function renderFilters() {
    const categories = unique(stories.map(story => story.category)).sort((a,b) => a.localeCompare(b,'zh-Hant'));
    filters.innerHTML = ['全部', ...categories].map(category => `<button type="button" class="tag-filter ${category === state.category ? 'active' : ''}" data-story-filter="${esc(category)}">${esc(category)}</button>`).join('');
  }

  function render() {
    const items = filtered();
    count.textContent = `顯示 ${items.length}／${stories.length} 則故事`;
    grid.innerHTML = items.length ? items.map(story => `
      <article class="archive-story-card reveal visible" id="story-card-${esc(story.id)}" tabindex="0" data-story-id="${esc(story.id)}">
        <div class="story-number">${String(stories.indexOf(story)+1).padStart(2,'0')}</div>
        <span class="story-category">${esc(story.category)}</span>
        <h2>${esc(story.title)}</h2><p>${esc(story.content)}</p>
        <div class="story-card-footer"><span>頭城小故事</span><button type="button" aria-label="閱讀 ${esc(story.title)}">閱讀故事 →</button></div>
      </article>`).join('') : '<div class="empty-state"><h2>找不到故事</h2><p>請換一個關鍵字或分類。</p></div>';
  }

  function renderChip(item, className = '') {
    const label = esc(item.name || item);
    const note = item.note ? ` title="${esc(item.note)}"` : '';
    return item.url
      ? `<a class="story-chip ${className}" href="${esc(item.url)}"${note}>${label}<span aria-hidden="true">→</span></a>`
      : `<span class="story-chip story-chip-static ${className}"${note}>${label}</span>`;
  }

  function renderSource(story) {
    const wrap = dialog.querySelector('[data-story-source-wrap]');
    const text = dialog.querySelector('[data-story-source-text]');
    const links = dialog.querySelector('[data-story-source-links]');
    const sourceLinks = [...(story.sourceLinks || [])];
    if (story.sourceUrl) sourceLinks.unshift({label:'開啟原始來源',url:story.sourceUrl});
    wrap.hidden = false;
    text.textContent = story.source || '本站既有地方記憶整理；原始來源尚未附入本筆公開資料。';
    text.hidden = false;
    links.innerHTML = unique(sourceLinks, item => item.url).map(item => `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.label || '開啟原始來源')} ↗</a>`).join('');
    links.hidden = !sourceLinks.length;
  }

  function renderRelationGroup(selector, items) {
    const wrap = dialog.querySelector(`[data-story-${selector}-wrap]`);
    const container = dialog.querySelector(`[data-story-${selector}]`);
    wrap.hidden = !items.length;
    container.innerHTML = items.map(item => renderChip(item)).join('');
  }

  function openStory(id, {updateHash = true} = {}) {
    const story = storyById.get(id);
    if (!story) return false;
    const relations = storyRelations(story);
    const relationNames = new Set([...relations.places, ...relations.people].map(item => item.name));
    const tags = unique([...storyTags(story, relations), ...splitContext(story.related)]).filter(tag => !relationNames.has(tag));
    const highlights = story.listType === 'highlights' ? story.list || [] : [];

    dialog.querySelector('[data-story-category]').textContent = story.category;
    dialog.querySelector('[data-story-title]').textContent = story.title;
    dialog.querySelector('[data-story-content]').textContent = story.content;
    const observationWrap = dialog.querySelector('[data-story-observation-wrap]');
    observationWrap.hidden = !story.editorialObservation;
    dialog.querySelector('[data-story-observation]').textContent = story.editorialObservation || '';

    const imageWrap = dialog.querySelector('[data-story-image-wrap]');
    const image = dialog.querySelector('[data-story-image]');
    imageWrap.hidden = !story.image;
    if (story.image) {
      image.src = story.image;
      image.alt = story.imageAlt || story.title;
      dialog.querySelector('[data-story-image-caption]').textContent = story.imageCaption || '';
    } else {
      image.removeAttribute('src'); image.alt = '';
    }
    const gallery = dialog.querySelector('[data-story-gallery]');
    const galleryImages = (story.images || []).filter((item,index) => index > 0 || item.src !== story.image);
    gallery.hidden = !galleryImages.length;
    gallery.innerHTML = galleryImages.map(item => `<figure><img src="${esc(item.src)}" alt="${esc(item.alt || story.title)}" loading="lazy"><figcaption>${esc(item.caption || '')}</figcaption></figure>`).join('');

    const highlightWrap = dialog.querySelector('[data-story-highlights-wrap]');
    highlightWrap.hidden = !highlights.length;
    dialog.querySelector('[data-story-highlights]').innerHTML = highlights.map(item => `<li>${esc(item)}</li>`).join('');
    const tagWrap = dialog.querySelector('[data-story-tags-wrap]');
    tagWrap.hidden = !tags.length;
    dialog.querySelector('[data-story-tags]').innerHTML = tags.map(tag => renderChip({name:tag},'story-tag')).join('');

    const readings = (story.relatedStories || []).filter(item => storyById.has(item.id));
    const readingWrap = dialog.querySelector('[data-story-reading-wrap]');
    readingWrap.hidden = !readings.length;
    dialog.querySelector('[data-story-reading]').innerHTML = readings.map(item => `<a class="story-reading-card" href="stories.html#${encodeURIComponent(item.id)}" data-related-story-id="${esc(item.id)}"><strong>${esc(item.title)}</strong>${item.note ? `<span>${esc(item.note)}</span>` : ''}<em>查看更多 →</em></a>`).join('');

    renderRelationGroup('places', relations.places);
    renderRelationGroup('people', relations.people);
    renderSource(story);

    const permalink = dialog.querySelector('[data-story-link]');
    permalink.href = `stories.html#${encodeURIComponent(story.id)}`;
    permalink.setAttribute('aria-label', `開啟「${story.title}」固定連結`);
    if (updateHash) history.replaceState(null, '', `#${encodeURIComponent(story.id)}`);
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('[data-dialog-close]').focus();
    return true;
  }

  filters?.addEventListener('click', event => {
    const button = event.target.closest('[data-story-filter]');
    if (!button) return;
    state.category = button.dataset.storyFilter;
    renderFilters(); render();
  });
  search?.addEventListener('input', () => { state.query = search.value.trim(); render(); });
  grid?.addEventListener('click', event => { const card = event.target.closest('[data-story-id]'); if (card) openStory(card.dataset.storyId); });
  grid?.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-story-id]')) {
      event.preventDefault(); openStory(event.target.dataset.storyId);
    }
  });
  dialog?.addEventListener('click', event => {
    const reading = event.target.closest('[data-related-story-id]');
    if (reading) { event.preventDefault(); openStory(reading.dataset.relatedStoryId); return; }
    if (event.target === dialog) dialog.close();
  });
  dialog?.querySelector('[data-dialog-close]')?.addEventListener('click', () => dialog.close());
  window.addEventListener('hashchange', () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id && storyById.has(id)) openStory(id, {updateHash:false});
  });

  renderFilters(); render();
  if (location.hash) setTimeout(() => openStory(decodeURIComponent(location.hash.slice(1)), {updateHash:false}), 50);
})();
