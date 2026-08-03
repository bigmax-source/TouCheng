(() => {
  const root=document.querySelector('[data-on-this-day]');
  if(!root)return;
  const escapeHTML=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const taipeiParts=()=>Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Taipei',month:'2-digit',day:'2-digit',year:'numeric'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  const card=item=>`<article class="today-card"><div><time>${escapeHTML(item.date)}</time><span>${escapeHTML(item.category)}</span></div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.summary)}</p><footer><small>資料來源：${escapeHTML(item.source)}</small><a href="history.html#event-${encodeURIComponent(item.id)}">查看時間軸紀錄 →</a></footer></article>`;
  async function init(){
    try{
      const response=await fetch('assets/data/on-this-day.json?v=1.62');
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json(),parts=taipeiParts(),key=`${parts.month}-${parts.day}`;
      const exact=data.eventsByDay?.[key]||[];
      document.querySelector('[data-today-date]').textContent=`${parts.year}年${Number(parts.month)}月${Number(parts.day)}日`;
      if(exact.length){
        document.querySelector('[data-today-heading]').textContent='歷史上的今天';
        document.querySelector('[data-today-note]').textContent=`典藏中找到 ${exact.length} 筆同月同日紀錄。`;
        root.innerHTML=exact.map(card).join('');
      }else{
        const monthEvents=Object.entries(data.eventsByDay||{}).filter(([day])=>day.startsWith(`${parts.month}-`)).flatMap(([,events])=>events).sort((a,b)=>a.date.slice(5).localeCompare(b.date.slice(5))||b.year-a.year);
        document.querySelector('[data-today-heading]').textContent='今天尚無已校訂紀錄';
        if(monthEvents.length){
          const shown=monthEvents.slice(0,6),remaining=monthEvents.length-shown.length;
          document.querySelector('[data-today-note]').textContent=`看看${Number(parts.month)}月的頭城歷史：本月共有 ${monthEvents.length} 筆完整日期紀錄${remaining?'，先顯示6筆':''}。`;
          root.innerHTML=shown.map(card).join('')+(remaining?`<p class="today-more"><a href="history.html?query=-${parts.month}-">查看本月其餘 ${remaining} 筆紀錄 →</a></p>`:'');
        }else{
          document.querySelector('[data-today-note]').textContent='本月目前也沒有具完整月日的紀錄，歡迎前往完整時間軸閱讀。';
          root.innerHTML='<p class="today-error"><a href="history.html">前往完整時間軸 →</a></p>';
        }
      }
    }catch(error){
      console.error(error);root.innerHTML='<p class="today-error">今日資料暫時無法載入，請稍後重新整理。</p>';
    }
  }
  init();
})();
