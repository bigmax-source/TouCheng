(() => {
  // 資料檔依編纂時間持續向後追加；閱讀頁則以最新加入者優先呈現。
  const stories = [...(window.TOUCHENG_STORIES || [])].reverse();
  const grid = document.querySelector('#storiesGrid');
  const search = document.querySelector('#storySearch');
  const filters = document.querySelector('#storyFilters');
  const count = document.querySelector('#storyCount');
  document.querySelectorAll('[data-story-total]').forEach(el=>el.textContent=stories.length);
  const dialog = document.querySelector('#storyDialog');
  const state = { category: '全部', query: '' };
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const normalize = value => String(value ?? '').toLocaleLowerCase('zh-Hant');
  function filtered(){
    return stories.filter(s => {
      const categoryOK = state.category === '全部' || s.category === state.category;
      const haystack = normalize([s.title,s.content,s.category,(s.list||[]).join(' '),s.related,s.source].join(' '));
      return categoryOK && (!state.query || haystack.includes(normalize(state.query)));
    });
  }
  function render(){
    const items = filtered();
    count.textContent = `顯示 ${items.length}／${stories.length} 則故事`;
    grid.innerHTML = items.length ? items.map((s,i)=>`<article class="archive-story-card reveal visible" tabindex="0" data-story-id="${esc(s.id)}"><div class="story-number">${String(stories.indexOf(s)+1).padStart(2,'0')}</div><span class="story-category">${esc(s.category)}</span><h2>${esc(s.title)}</h2><p>${esc(s.content)}</p><div class="story-card-footer"><span>頭城小故事</span><button type="button" aria-label="閱讀 ${esc(s.title)}">閱讀故事 →</button></div></article>`).join('') : '<div class="empty-state"><h2>找不到故事</h2><p>請換一個關鍵字或分類。</p></div>';
  }
  function openStory(id){
    const s=stories.find(x=>x.id===id); if(!s) return;
    dialog.querySelector('[data-story-category]').textContent=s.category;
    dialog.querySelector('[data-story-title]').textContent=s.title;
    dialog.querySelector('[data-story-content]').textContent=s.content;
    const observationWrap=dialog.querySelector('[data-story-observation-wrap]');
    const observation=dialog.querySelector('[data-story-observation]');
    observationWrap.hidden=!s.editorialObservation;
    observation.textContent=s.editorialObservation||'';
    const imageWrap=dialog.querySelector('[data-story-image-wrap]');
    const image=dialog.querySelector('[data-story-image]');
    const imageCaption=dialog.querySelector('[data-story-image-caption]');
    imageWrap.hidden=!s.image;
    if(s.image){image.src=s.image;image.alt=s.imageAlt||s.title;imageCaption.textContent=s.imageCaption||''}
    const gallery=dialog.querySelector('[data-story-gallery]');
    const galleryImages=(s.images||[]).filter((item,index)=>index>0 || item.src!==s.image);
    gallery.hidden=!galleryImages.length;
    gallery.innerHTML=galleryImages.map(item=>`<figure><img src="${esc(item.src)}" alt="${esc(item.alt||s.title)}" loading="lazy"><figcaption>${esc(item.caption||'')}</figcaption></figure>`).join('');
    const list=dialog.querySelector('[data-story-list]');
    list.innerHTML=(s.list||[]).map(x=>`<li>${esc(x)}</li>`).join('');
    list.hidden=!(s.list||[]).length;
    dialog.querySelector('[data-story-related]').textContent=s.related || '關聯資料待整理';
    const sourceWrap=dialog.querySelector('[data-story-source-wrap]');
    const source=dialog.querySelector('[data-story-source]');
    sourceWrap.hidden=!s.source;
    if(s.source){source.textContent=s.source;source.href=s.sourceUrl||'#'}
    dialog.querySelector('[data-story-link]').href=`stories.html#${s.id}`;
    history.replaceState(null,'',`#${s.id}`);
    dialog.showModal();
  }
  filters?.addEventListener('click',e=>{
    const btn=e.target.closest('[data-story-filter]'); if(!btn)return;
    filters.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===btn));
    state.category=btn.dataset.storyFilter; render();
  });
  search?.addEventListener('input',()=>{state.query=search.value.trim();render()});
  grid?.addEventListener('click',e=>{const card=e.target.closest('[data-story-id]');if(card)openStory(card.dataset.storyId)});
  grid?.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-story-id]')){e.preventDefault();openStory(e.target.dataset.storyId)}});
  dialog?.querySelector('[data-dialog-close]')?.addEventListener('click',()=>dialog.close());
  dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  render();
  if(location.hash) setTimeout(()=>openStory(location.hash.slice(1)),50);
})();
