(() => {
  const places = window.TOUCHENG_PLACES || [];
  const categories = ['歷史地景', '信仰文化', '人物與文學', '港口與交通', '生活飲食'];
  const symbols = {'歷史地景':'史','信仰文化':'祀','人物與文學':'文','港口與交通':'港','生活飲食':'食'};
  const slugs = {'歷史地景':'history','信仰文化':'faith','人物與文學':'literature','港口與交通':'harbor','生活飲食':'living'};
  const $ = selector => document.querySelector(selector);
  const esc = (value='') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const active = new Set(categories.filter(category=>category!=='生活飲食'));
  const markers = new Map();
  let selectedId = '';

  const map = L.map('touchengMap', {zoomControl:true, scrollWheelZoom:false}).setView([24.864,121.829],14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
  }).addTo(map);
  const groups = Object.fromEntries(categories.map(category => [category,L.layerGroup()]));
  for(const category of active) groups[category].addTo(map);

  for (const place of places) {
    const marker = L.marker([place.lat,place.lng], {
      title:place.name,
      icon:L.divIcon({className:'place-marker-wrap',html:`<span class="place-marker ${slugs[place.category]}"><i>${symbols[place.category]}</i></span>`,iconSize:[38,44],iconAnchor:[19,42],popupAnchor:[0,-38]})
    });
    marker.bindTooltip(place.name,{direction:'top',offset:[0,-36]});
    marker.on('click',()=>selectPlace(place.id,false));
    marker.addTo(groups[place.category]);
    markers.set(place.id,marker);
  }

  const filterWrap=$('#mapLayerFilters');
  filterWrap.innerHTML=categories.map(category=>`<label class="map-layer-chip ${slugs[category]}"><input type="checkbox" value="${esc(category)}" ${active.has(category)?'checked':''}><span>${symbols[category]}</span><strong>${esc(category)}</strong><small>${places.filter(place=>place.category===category).length}</small></label>`).join('');

  function visiblePlaces(){const query=$('#placeSearch').value.trim().toLowerCase();return places.filter(place=>active.has(place.category)&&(!query||[place.name,place.address,place.summary,place.category].join(' ').toLowerCase().includes(query)))}
  function navigationUrl(place){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address||`${place.lat},${place.lng}`)}`}
  function relatedReadingUrl(place){return place.peopleUrl||(place.id==='lanyang-museum'?'people.html#lanyang-museum-tbm':'')}
  function emptyDetail(){return '<div class="place-detail-empty"><span>地</span><h2>選一個地方開始閱讀</h2><p>點選地圖標記或下方地點名稱，查看簡介、相關事件與導航。</p></div>'}

  function renderList(){
    const visible=visiblePlaces();
    $('#mapResultSummary').textContent=`顯示 ${visible.length} 個地點`;
    $('#placeList').innerHTML=visible.length?visible.map(place=>`<button type="button" class="place-list-item ${selectedId===place.id?'active':''}" data-place-id="${esc(place.id)}"><span class="place-list-symbol ${slugs[place.category]}">${symbols[place.category]}</span><span><small>${esc(place.category)}・${place.relatedEvents.length}筆相關紀錄</small><strong>${esc(place.name)}</strong><em>${esc(place.address)}</em></span><b aria-hidden="true">→</b></button>`).join(''):'<div class="map-empty"><strong>找不到符合的地點</strong><p>請改用其他關鍵字，或重新開啟圖層。</p></div>';
  }

  function renderDetail(place){
    const events=place.relatedEvents.slice(0,6);
    const eventList=events.length?`<ol class="place-event-list">${events.map(event=>`<li><time>${esc(event.date)}</time><a href="history.html#event-${encodeURIComponent(event.id)}">${esc(event.title)}</a></li>`).join('')}</ol>`:'<p class="place-no-events">這個地點目前先以地方專題保存，尚待建立可確認日期的年表紀錄。</p>';
    const phoneFact=place.phone?`<div><dt>電話</dt><dd><a href="tel:${esc(place.phone.replace(/[^0-9+]/g,''))}">${esc(place.phone)}</a></dd></div>`:`<div><dt>電話</dt><dd>暫無公開電話</dd></div>`;
    const isLiving=place.category==='生活飲食';
    const readingUrl=relatedReadingUrl(place);
    $('#placeDetail').innerHTML=`<div class="place-detail-head"><span class="source-badge ${slugs[place.category]}">${esc(place.category)}</span><button type="button" class="place-close" aria-label="關閉地點介紹">×</button></div><h2>${esc(place.name)}</h2><p>${esc(place.summary)}</p><dl class="place-facts"><div><dt>位置</dt><dd>${esc(place.address)}</dd></div>${isLiving?phoneFact:`<div><dt>關聯</dt><dd>${place.relatedEvents.length}筆時間軸紀錄</dd></div>`}</dl>${isLiving?'<p class="place-data-note">生活資訊可能變動，出發前請向店家或地圖平台再次確認。</p>':`<h3>相關事件</h3>${eventList}`}<div class="place-actions">${!isLiving?`<a class="btn btn-primary" href="history.html?query=${encodeURIComponent(place.historyQuery)}">查看此地全部相關紀錄 →</a>`:''}${place.phone?`<a class="btn btn-primary" href="tel:${esc(place.phone.replace(/[^0-9+]/g,''))}">撥打電話</a>`:''}<a class="btn btn-ghost" href="${navigationUrl(place)}" target="_blank" rel="noopener noreferrer">Google Maps 導航 ↗</a>${readingUrl?`<a class="btn btn-ghost" href="${esc(readingUrl)}">閱讀相關專題 →</a>`:''}<a class="place-source" href="${esc(place.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看地點資料來源 ↗</a></div>`;
  }

  function selectPlace(id,move=true){
    const place=places.find(item=>item.id===id);if(!place)return;
    selectedId=id;renderDetail(place);renderList();history.replaceState(null,'',`#place-${place.id}`);
    if(!active.has(place.category)){active.add(place.category);const checkbox=[...filterWrap.querySelectorAll('input')].find(input=>input.value===place.category);if(checkbox)checkbox.checked=true;groups[place.category].addTo(map)}
    if(move)map.flyTo([place.lat,place.lng],place.id==='guishan-island'||place.id==='old-caoling-tunnel'?13:16,{duration:.7});
    markers.get(place.id)?.openTooltip();
    if(window.innerWidth<760)$('#placeDetail').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function syncLayers(){
    for(const category of categories){if(active.has(category))groups[category].addTo(map);else map.removeLayer(groups[category])}
    if(selectedId&&!visiblePlaces().some(place=>place.id===selectedId)){selectedId='';$('#placeDetail').innerHTML=emptyDetail()}
    renderList();
  }

  filterWrap.addEventListener('change',event=>{const checkbox=event.target.closest('input[type="checkbox"]');if(!checkbox)return;if(checkbox.checked)active.add(checkbox.value);else active.delete(checkbox.value);syncLayers()});
  $('#placeSearch').addEventListener('input',renderList);
  $('#placeList').addEventListener('click',event=>{const button=event.target.closest('[data-place-id]');if(button)selectPlace(button.dataset.placeId)});
  $('#placeDetail').addEventListener('click',event=>{if(!event.target.closest('.place-close'))return;selectedId='';history.replaceState(null,'',location.pathname);$('#placeDetail').innerHTML=emptyDetail();renderList()});
  $('#resetMapFilters').addEventListener('click',()=>{active.clear();categories.forEach(category=>active.add(category));filterWrap.querySelectorAll('input').forEach(input=>input.checked=true);$('#placeSearch').value='';syncLayers();map.flyTo([24.864,121.829],14,{duration:.7})});
  $('#placeCount').textContent=places.length;
  $('#placeEventCount').textContent=new Set(places.flatMap(place=>place.eventIds)).size;
  renderList();
  const initial=decodeURIComponent(location.hash.replace('#place-',''));
  if(initial&&places.some(place=>place.id===initial))setTimeout(()=>selectPlace(initial),80);
})();
