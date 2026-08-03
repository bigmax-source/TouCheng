(() => {
  const $ = (s) => document.querySelector(s);
  const search=$('#historySearch'), dynasty=$('#dynastyFilter'), category=$('#categoryFilter'), source=$('#sourceFilter');
  const sort=$('#sortOrder'), results=$('#historyResults'), summary=$('#resultSummary'), yearIndex=$('#yearIndex');
  const empty=$('#emptyState'), quickTags=$('#quickTags'), viewToggle=$('#viewToggle'), journey=$('#journeyToggle');
  const totalCount=$('#totalCount'), loadMore=$('#loadMoreHistory'), loadStatus=$('#historyLoadStatus');
  const topicCategories=['港口與海洋','交通與建設','產業與商業','信仰與祭典','教育與文化','人物與文學','生活與民俗','文化資產與地景','公共事務','地方記憶與社群'];
  let data=[], manifest=null, visibleLimit=50, allLoaded=false, journeyTimer=null;

  const normalize=(s='')=>s.toString().toLowerCase().replace(/\s+/g,'');
  const escapeHTML=(s='')=>s.toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const highlight=(text,q)=>{if(!q)return escapeHTML(text);const safe=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return escapeHTML(text).replace(new RegExp(`(${safe})`,'ig'),'<mark>$1</mark>')};
  const sourceGroup=x=>x.sources?.[0]?.type||({'official':'官方／公共機構','local-publication':'地方出版與文史',local_history:'地方出版與文史',news:'新聞紀錄',community:'地方生活與社群',folklore:'民間傳說與口述'}[x.recordType]||'地方生活與社群');
  const badge=x=>{const group=sourceGroup(x),map={'官方／公共機構':['official','官方／公共機構'],'地方出版與文史':['manuscript','地方出版與文史'],'新聞紀錄':['news','新聞紀錄'],'地方生活與社群':['supplement','地方生活與社群'],'民間傳說與口述':['oral','民間傳說與口述']},b=map[group]||['supplement',group];return `<span class="source-badge ${b[0]}">${b[1]}</span>`};

  function state(){return {q:search.value.trim(),d:dynasty.value,c:category.value,s:source.value,order:sort.value}}
  function haystack(x){return [x.startDate,x.endDate,x.year,x.dynasty,x.era,x.ganzhi,x.title,x.event,x.primaryCategory,...(x.tags||[]),...(x.locations||[]),...(x.villages||[]),...(x.people||[]),...(x.organizations||[]),...(x.sources||[]).flatMap(s=>[s.name,s.type])].join(' ')}
  function filtered(){const s=state(),nq=normalize(s.q);return data.filter(x=>(!nq||normalize(haystack(x)).includes(nq))&&(!s.d||x.dynasty===s.d)&&(!s.c||x.primaryCategory===s.c||(x.tags||[]).includes(s.c))&&(!s.s||sourceGroup(x)===s.s)).sort((a,b)=>s.order==='asc'?String(a.startDate||a.year).localeCompare(String(b.startDate||b.year)):String(b.startDate||b.year).localeCompare(String(a.startDate||a.year)))}
  function metadata(x){const rows=[['地點',[...(x.locations||[]),...(x.villages||[])]],['人物',x.people||[]],['機構／店家',x.organizations||[]]].filter(([,v])=>v.length);return rows.length?`<dl class="research-fields">${rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${v.map(escapeHTML).join('、')}</dd></div>`).join('')}</dl>`:''}
  function sourceList(x){return (x.sources||[]).map(s=>s.url?`<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.name)} ↗</a>`:escapeHTML(s.name)).join('<br>')}
  function card(x,q){const tags=[x.primaryCategory,...(x.tags||[]).filter(t=>topicCategories.includes(t))].filter(Boolean);return `<article class="history-card ${escapeHTML(x.recordType)}" id="event-${escapeHTML(x.id)}" data-year="${escapeHTML(x.year)}"><div class="event-year"><span>${escapeHTML(x.startDate||x.year)}</span><small>${escapeHTML(x.dynasty)}</small></div><div class="event-body"><div class="event-heading"><div>${badge(x)}<p class="event-era">${escapeHTML(x.era)}${x.ganzhi?'・'+escapeHTML(x.ganzhi):''}</p><h2>${highlight(x.title,q)}</h2></div><button class="permalink" type="button" data-copy-link="event-${escapeHTML(x.id)}" aria-label="複製此事件連結">#</button></div><div class="event-tags">${[...new Set(tags)].map(c=>`<button class="event-tag" type="button" data-pick-category="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join('')}</div>${metadata(x)}<p class="event-text">${highlight(x.event,q)}</p>${x.images?.length?`<div class="then-now-grid">${x.images.map(img=>`<figure><img src="${escapeHTML(img.src)}" alt="${escapeHTML(img.alt||'')}" loading="lazy"><figcaption>${escapeHTML(img.caption||'')}</figcaption></figure>`).join('')}</div>`:''}${x.importance?`<div class="why-note"><strong>為什麼記錄？</strong><span>${escapeHTML(x.importance)}</span></div>`:''}<details class="source-details"><summary>資料來源與校訂狀態</summary><dl><div><dt>來源</dt><dd>${sourceList(x)}</dd></div><div><dt>可信度</dt><dd>${escapeHTML(x.review?.confidence||'待查證')}</dd></div><div><dt>最後更新</dt><dd>${escapeHTML(x.review?.lastUpdated||'—')}</dd></div></dl><p>${escapeHTML(x.review?.status||x.reviewStatus||'待查證')}</p></details></div></article>`}

  function bindCards(){document.querySelectorAll('[data-pick-category]').forEach(b=>b.onclick=()=>{category.value=b.dataset.pickCategory;visibleLimit=50;syncQuick();render();document.querySelector('.archive-toolbar').scrollIntoView({behavior:'smooth',block:'start'})});document.querySelectorAll('[data-copy-link]').forEach(b=>b.onclick=async()=>{const url=`${location.href.split('#')[0]}#${b.dataset.copyLink}`;try{await navigator.clipboard.writeText(url);b.textContent='✓';setTimeout(()=>b.textContent='#',1200)}catch{location.hash=b.dataset.copyLink}})}
  function render(){const items=filtered(),shown=items.slice(0,visibleLimit),s=state();const qualified=(s.q||s.d||s.c||s.s)?`找到 ${items.length} 筆`:`共 ${items.length} 筆`;summary.textContent=`${qualified}，目前顯示 ${shown.length} 筆`;results.innerHTML=shown.map(x=>card(x,s.q)).join('');empty.hidden=items.length!==0;results.hidden=items.length===0;loadMore.hidden=shown.length>=items.length;loadMore.textContent=`載入更多（尚有 ${Math.max(0,items.length-shown.length)} 筆）`;const years=[...new Set(shown.map(x=>Math.floor(x.year/10)*10))].sort((a,b)=>b-a);yearIndex.innerHTML=years.map(y=>`<a href="#event-${shown.find(x=>Math.floor(x.year/10)*10===y).id}">${y}年代</a>`).join('');bindCards()}
  function syncQuick(){document.querySelectorAll('.tag-filter').forEach(b=>b.classList.toggle('active',b.dataset.category===category.value))}
  function resetLimitAndRender(){visibleLimit=50;syncQuick();render()}
  function populateFilters(){const current=dynasty.value,currentCategory=category.value;dynasty.innerHTML='<option value="">全部時期</option>';[...new Set(data.map(x=>x.dynasty))].filter(Boolean).forEach(v=>dynasty.append(new Option(v,v)));dynasty.value=current;category.innerHTML='<option value="">全部分類</option>';topicCategories.forEach(v=>category.append(new Option(v,v)));category.value=currentCategory;quickTags.innerHTML='';topicCategories.forEach(v=>{const b=document.createElement('button');b.type='button';b.className='tag-filter';b.textContent=v;b.dataset.category=v;quickTags.append(b)});syncQuick()}
  async function getJSON(url){const response=await fetch(url);if(!response.ok)throw new Error(`${response.status} ${url}`);return response.json()}

  [search,dynasty,category,source,sort].forEach(el=>el.addEventListener(el===search?'input':'change',resetLimitAndRender));
  quickTags.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;category.value=category.value===b.dataset.category?'':b.dataset.category;resetLimitAndRender()});
  $('#resetFilters').onclick=()=>{search.value='';dynasty.value='';category.value='';source.value='';sort.value='desc';resetLimitAndRender();search.focus()};
  $('#emptyReset').onclick=$('#resetFilters').onclick;
  loadMore.onclick=()=>{visibleLimit+=50;render()};
  viewToggle.onclick=()=>{const compact=results.classList.toggle('compact');viewToggle.setAttribute('aria-pressed',String(compact));viewToggle.textContent=compact?'切換完整閱讀':'切換精簡閱讀'};
  journey?.addEventListener('click',()=>{if(journeyTimer){clearInterval(journeyTimer);journeyTimer=null;journey.textContent='開始歷史漫遊';return}const cards=[...document.querySelectorAll('.history-card')];let i=0;journey.textContent='停止漫遊';const move=()=>{if(i>=cards.length){clearInterval(journeyTimer);journeyTimer=null;journey.textContent='開始歷史漫遊';return}cards[i++].scrollIntoView({behavior:'smooth',block:'center'})};move();journeyTimer=setInterval(move,2800)});
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!/input|textarea|select/i.test(document.activeElement.tagName)){e.preventDefault();search.focus()}});

  async function init(){try{
    manifest=await getJSON('assets/data/history/manifest.json');totalCount.textContent=manifest.totalCount;loadStatus.textContent='正在載入最新年代…';
    const params=new URLSearchParams(location.search),initialCategory=params.get('category'),initialSource=params.get('source'),initialQuery=params.get('query')||params.get('q');
    if(initialQuery)search.value=initialQuery;
    let initialChunkCount=0,initialRecordCount=0;while(initialChunkCount<manifest.chunks.length&&initialRecordCount<50){initialRecordCount+=manifest.chunks[initialChunkCount].count;initialChunkCount++}
    const initialBatches=await Promise.all(manifest.chunks.slice(0,initialChunkCount).map(c=>getJSON(c.url)));data=initialBatches.flat();populateFilters();if(initialCategory)category.value=initialCategory;if(initialSource)source.value=initialSource;syncQuick();
    const hasDeepFilter=Boolean(initialCategory||initialSource||initialQuery);
    if(!hasDeepFilter){render();loadStatus.textContent=`已先載入最新 ${data.length} 筆，完整索引背景載入中…`}
    const remaining=await Promise.all(manifest.chunks.slice(initialChunkCount).map(c=>getJSON(c.url)));data=data.concat(...remaining);allLoaded=true;populateFilters();
    if(location.hash){const wanted=location.hash.replace('#event-',''),index=filtered().findIndex(x=>x.id===wanted);if(index>=0)visibleLimit=Math.ceil((index+1)/50)*50}
    render();loadStatus.textContent=`完整 ${data.length} 筆索引已載入；頁面每次只顯示50筆。`;
    if(location.hash)setTimeout(()=>{const target=document.querySelector(location.hash);if(target)target.scrollIntoView({behavior:'smooth',block:'center'})},100)
  }catch(error){console.error(error);loadStatus.textContent='資料載入失敗，請重新整理頁面。';summary.textContent='無法載入時間軸資料。'}}
  init();
})();
