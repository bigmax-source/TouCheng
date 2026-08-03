(() => {
  const data = Array.isArray(window.TOUCHENG_HISTORY) ? window.TOUCHENG_HISTORY : [];
  const $ = (s) => document.querySelector(s);
  const search=$('#historySearch'), dynasty=$('#dynastyFilter'), category=$('#categoryFilter'), source=$('#sourceFilter');
  const sort=$('#sortOrder'), results=$('#historyResults'), summary=$('#resultSummary'), yearIndex=$('#yearIndex');
  const empty=$('#emptyState'), quickTags=$('#quickTags'), viewToggle=$('#viewToggle'), journey=$('#journeyToggle');
  const totalCount=$('#totalCount'); if(totalCount) totalCount.textContent=data.length;
  let journeyTimer=null;
  const topicCategories=['港口與海洋','交通與建設','產業與商業','信仰與祭典','教育與文化','人物與文學','生活與民俗','文化資產與地景','公共事務','地方記憶與社群'];
  function mapCategory(category='') {
    if (/港口|海洋|漁業|烏石港|頭圍港/.test(category)) return '港口與海洋';
    if (/交通|鐵路|自行車|公共建設|地方建設/.test(category)) return '交通與建設';
    if (/產業|商業|餐飲|零售|店家|旅宿|觀光|地方創生/.test(category)) return '產業與商業';
    if (/信仰|祭典|宗教|大神尪|將軍廟|慶元宮/.test(category)) return '信仰與祭典';
    if (/人物|文學|李榮春|書法/.test(category)) return '人物與文學';
    if (/教育|文化推廣|文化復振|文化館舍|出版|展覽|校園/.test(category)) return '教育與文化';
    if (/文化資產|地景|建築|修復|史雲湖|頭城老街|盧宅|自然|環境|地理|災害|聚落|族群|土地|開墾/.test(category)) return '文化資產與地景';
    if (/生活|民俗|醫療|福利|社會互助/.test(category)) return '生活與民俗';
    if (/政治|行政|公共|戰爭|政權|地方行動|新聞|社區參與|都市發展|地方發展|街區發展/.test(category)) return '公共事務';
    return '地方記憶與社群';
  }
  const displayCategories=x=>[...new Set((x.categories||[]).map(mapCategory))].sort((a,b)=>topicCategories.indexOf(a)-topicCategories.indexOf(b));
  const normalize=(s='')=>s.toString().toLowerCase().replace(/\s+/g,'');
  const sourceGroup=(x)=>({
    official:'official',
    'local-publication':'local_publication_history',
    local_history:'local_publication_history',
    news:'news',
    community:'local_community',
    folklore:'oral_legend'
  }[x.recordType]||'local_community');
  const escapeHTML=(s='')=>s.toString().replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const highlight=(text,q)=>{ if(!q) return escapeHTML(text); const safe=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); return escapeHTML(text).replace(new RegExp(`(${safe})`,'ig'),'<mark>$1</mark>'); };
  [...new Set(data.map(x=>x.dynasty))].forEach(v=>dynasty.add(new Option(v,v)));
  const categories=topicCategories.filter(v=>data.some(x=>displayCategories(x).includes(v)));
  categories.forEach(v=>category.add(new Option(v,v)));
  const quick=topicCategories;
  quick.filter(v=>categories.includes(v)).forEach(v=>{const b=document.createElement('button');b.type='button';b.className='tag-filter';b.textContent=v;b.dataset.category=v;quickTags.append(b)});
  function state(){return {q:search.value.trim(),d:dynasty.value,c:category.value,s:source.value,order:sort.value}}
  function filtered(){const s=state(),nq=normalize(s.q);return data.filter(x=>{const consolidated=displayCategories(x);const hay=normalize([x.date,x.year,x.dynasty,x.era,x.ganzhi,x.title,x.event,x.source,x.sourceType,...x.categories,...consolidated].join(' '));return(!nq||hay.includes(nq))&&(!s.d||x.dynasty===s.d)&&(!s.c||consolidated.includes(s.c))&&(!s.s||sourceGroup(x)===s.s)}).sort((a,b)=>s.order==='asc'?(a.date||a.year).toString().localeCompare((b.date||b.year).toString()):(b.date||b.year).toString().localeCompare((a.date||a.year).toString()))}
  function badge(x){const map={official:['official','官方／公共機構'],local_publication_history:['manuscript','地方出版與文史'],news:['news','新聞紀錄'],local_community:['supplement','地方生活與社群'],oral_legend:['oral','民間傳說與口述']};const b=map[sourceGroup(x)]||['supplement','地方生活與社群'];return `<span class="source-badge ${b[0]}">${b[1]}</span>`}
  function card(x,q){const cats=displayCategories(x).map(c=>`<button class="event-tag" type="button" data-pick-category="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join('');return `<article class="history-card ${x.recordType}" id="event-${x.id}" data-year="${x.year}"><div class="event-year"><span>${escapeHTML(x.date||x.year)}</span><small>${escapeHTML(x.dynasty)}</small></div><div class="event-body"><div class="event-heading"><div>${badge(x)}<p class="event-era">${escapeHTML(x.era)}${x.ganzhi?'・'+escapeHTML(x.ganzhi):''}</p><h2>${highlight(x.title,q)}</h2></div><button class="permalink" type="button" data-copy-link="event-${x.id}" aria-label="複製此事件連結">#</button></div><div class="event-tags">${cats}</div><p class="event-text">${highlight(x.event,q)}</p>${x.images?.length?`<div class="then-now-grid">${x.images.map(img=>`<figure><img src="${escapeHTML(img.src)}" alt="${escapeHTML(img.alt||'')}" loading="lazy"><figcaption>${escapeHTML(img.caption||'')}</figcaption></figure>`).join('')}</div>`:''}${x.importance?`<div class="why-note"><strong>為什麼記錄？</strong><span>${escapeHTML(x.importance)}</span></div>`:''}<details class="source-details"><summary>資料來源與閱讀提醒</summary><dl><div><dt>來源</dt><dd>${x.sourceUrl?`<a href="${escapeHTML(x.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(x.source)} ↗</a>`:escapeHTML(x.source)}${x.referenceUrl?`<br><a href="${escapeHTML(x.referenceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(x.referenceLabel||'延伸參考')} ↗</a>`:''}</dd></div><div><dt>資料位置</dt><dd>${escapeHTML(x.sourceType)}</dd></div><div><dt>整理狀態</dt><dd>${escapeHTML(x.reviewStatus)}</dd></div></dl><p>${x.recordType==='official'?'此筆依官方或公共文化機構資料整理，仍建議循來源連結閱讀完整原文與上下文。':x.recordType==='local_history'?'此筆為地方文史資料，尚未完成全面交叉查證；請勿視為唯一或確定的歷史結論。':'此筆為地方生活與社群紀錄，可隨新證據、照片與居民回憶持續補充。'}</p></details></div></article>`}
  function render(){const items=filtered(),s=state();summary.textContent=(s.q||s.d||s.c||s.s)?`找到 ${items.length} 筆符合條件的紀錄`:`顯示全部 ${items.length} 筆紀錄`;results.innerHTML=items.map(x=>card(x,s.q)).join('');empty.hidden=items.length!==0;results.hidden=items.length===0;const years=[...new Set(items.map(x=>Math.floor(x.year/10)*10))].sort((a,b)=>b-a);yearIndex.innerHTML=years.map(y=>`<a href="#event-${items.find(x=>Math.floor(x.year/10)*10===y).id}">${y}年代</a>`).join('');document.querySelectorAll('[data-pick-category]').forEach(b=>b.onclick=()=>{category.value=b.dataset.pickCategory;syncQuick();render();document.querySelector('.archive-toolbar').scrollIntoView({behavior:'smooth',block:'start'})});document.querySelectorAll('[data-copy-link]').forEach(b=>b.onclick=async()=>{const url=`${location.href.split('#')[0]}#${b.dataset.copyLink}`;try{await navigator.clipboard.writeText(url);b.textContent='✓';setTimeout(()=>b.textContent='#',1200)}catch{location.hash=b.dataset.copyLink}})}
  function syncQuick(){document.querySelectorAll('.tag-filter').forEach(b=>b.classList.toggle('active',b.dataset.category===category.value))}
  [search,dynasty,category,source,sort].forEach(el=>el.addEventListener(el===search?'input':'change',()=>{syncQuick();render()}));
  quickTags.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;category.value=category.value===b.dataset.category?'':b.dataset.category;syncQuick();render()});
  function reset(){search.value='';dynasty.value='';category.value='';source.value='';sort.value='desc';syncQuick();render();search.focus()}
  $('#resetFilters').onclick=reset;$('#emptyReset').onclick=reset;
  viewToggle.onclick=()=>{const compact=results.classList.toggle('compact');viewToggle.setAttribute('aria-pressed',String(compact));viewToggle.textContent=compact?'切換完整閱讀':'切換精簡閱讀'};
  journey?.addEventListener('click',()=>{if(journeyTimer){clearInterval(journeyTimer);journeyTimer=null;journey.textContent='開始歷史漫遊';return;}const cards=[...document.querySelectorAll('.history-card')];let i=0;journey.textContent='停止漫遊';const move=()=>{if(i>=cards.length){clearInterval(journeyTimer);journeyTimer=null;journey.textContent='開始歷史漫遊';return;}cards[i++].scrollIntoView({behavior:'smooth',block:'center'});};move();journeyTimer=setInterval(move,2800)});
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!/input|textarea|select/i.test(document.activeElement.tagName)){e.preventDefault();search.focus()}});
  const params=new URLSearchParams(location.search);
  const initialCategory=params.get('category');
  const initialSource=params.get('source');
  const initialQuery=params.get('query')||params.get('q');
  if(initialCategory&&categories.includes(initialCategory)) category.value=initialCategory;
  if(initialSource&&[...source.options].some(o=>o.value===initialSource)) source.value=initialSource;
  if(initialQuery) search.value=initialQuery;
  syncQuick();render();if(location.hash)setTimeout(()=>document.querySelector(location.hash)?.scrollIntoView({behavior:'smooth',block:'center'}),100);
})();
