from pathlib import Path
from collections import Counter, defaultdict
from datetime import datetime
import hashlib, json, os, re, shutil

ROOT=Path(__file__).parent
SITE_VERSION=os.environ.get('TOUCHENG_SITE_VERSION','1.81')
SITE=ROOT.parent
SOURCE=SITE/"tools/history-source-v1.5.json"
COMPAT=SITE/"assets/data/history-data.js"
OUTDIR=SITE/"assets/data/history"
UPDATED=os.environ.get('TOUCHENG_UPDATED_AT','2026-08-08')

records=json.loads(SOURCE.read_text(encoding="utf-8"))
ids=[record['id'] for record in records]
if len(ids)!=len(set(ids)):
    raise ValueError('history source contains duplicate event IDs')

# Two clear duplicates are consolidated. Ambiguous candidates remain untouched for manual review.
resolved_merges=[]
by_id={x['id']:x for x in records}
museum_keep=by_id['2010-10-29-lanyang-museum'];museum_other=by_id['2010-10-29-lanyang-open']
museum_keep['_extraSources']=[{'name':museum_other.get('source','蘭陽博物館電子報'),'url':museum_other.get('sourceUrl',''),'type':'官方／公共機構','sourceDate':'2010-10-29','note':'與地方生活紀錄並列'}]
records=[x for x in records if x['id']!='2010-10-29-lanyang-open']
resolved_merges.append({'keptId':'2010-10-29-lanyang-museum','mergedIds':['2010-10-29-lanyang-open'],'reason':'事件名稱與日期完全相同，合併後並列蘭陽博物館電子報及地方紀錄來源。'})
wushih_keep=by_id['1883-wushih-grounding'];wushih_other=by_id['1883-018']
wushih_keep['_extraSources']=[{'name':wushih_other.get('source','莊錫財（2010）手稿辨識稿'),'url':wushih_other.get('sourceUrl',''),'type':'地方出版與文史','sourceDate':'1883','note':'原手稿曾把船難、馬偕與徐春生的不同年代混寫；本版只併入船難線索。'}]
records=[x for x in records if x['id']!='1883-018']
resolved_merges.append({'keptId':'1883-wushih-grounding','mergedIds':['1883-018'],'reason':'同一烏石港船隻觸礁事件合併來源；移除原手稿混接的教會年代敘述。'})
records=[x for x in records if x['id']!='office-1993-36a13d898']
resolved_merges.append({'keptId':'office-1993-e073be40e','mergedIds':['office-1993-36a13d898'],'reason':'同一工程的概括紀錄與1993年7月開工紀錄合併，保留日期較完整者。'})
records=[x for x in records if x['id']!='office-2007-133bbcabe']
resolved_merges.append({'keptId':'office-2007-dfc7bca98','mergedIds':['office-2007-133bbcabe'],'reason':'依人工校訂保留2007年2月13日「業已完竣」紀錄，移除3月13日的衝突紀錄。'})

for record in records:
    if record['id']=='office-1966-2d08b52b5': record['title']='宜蘭頭城線北駛至大里、馬崗'
    if record['id']=='office-1976-b16137e87': record['title']='宜蘭頭城線延駛至福隆'

decisions_path=SITE/'tools/editor-decisions.json'
if decisions_path.exists():
    decisions=json.loads(decisions_path.read_text(encoding='utf-8'))
    for action in decisions.get('removeRecords',[]):
        records=[x for x in records if x['id']!=action['id']]
        resolved={'keptId':action.get('keepId',''),'mergedIds':[action['id']],'reason':action['reason']}
        if action.get('removedOnly'): resolved['removedOnly']=True
        resolved_merges.append(resolved)

TOPICS=['港口與海洋','交通與建設','產業與商業','信仰與祭典','教育與文化','人物與文學','生活與民俗','文化資產與地景','公共事務','地方記憶與社群']
def topic(value=''):
    rules=[
      ('港口與海洋',r'港口|海洋|漁業|烏石港|頭圍港'),('交通與建設',r'交通|鐵路|自行車|公共建設|地方建設'),
      ('產業與商業',r'產業|商業|餐飲|零售|店家|旅宿|觀光|地方創生'),('信仰與祭典',r'信仰|祭典|宗教|大神尪|將軍廟|慶元宮'),
      ('人物與文學',r'人物|文學|李榮春|書法'),('教育與文化',r'教育|文化推廣|文化復振|文化館舍|出版|展覽|校園'),
      ('文化資產與地景',r'文化資產|地景|建築|修復|史雲湖|頭城老街|盧宅|自然|環境|地理|災害|聚落|族群|土地|開墾'),
      ('生活與民俗',r'生活|民俗|醫療|福利|社會互助'),('公共事務',r'政治|行政|公共|戰爭|政權|地方行動|新聞|社區參與|都市發展|地方發展|街區發展')]
    for name,pattern in rules:
        if re.search(pattern,value): return name
    return '地方記憶與社群'

PLACE_TERMS=['烏石港','頭圍港','史雲湖','頭城老街','慶元宮','頭城文創園區','頭城文化園區','頭城火車站','頭城車站','外澳車站','龜山車站','大溪車站','大里車站','石城車站','頂埔車站','蘭陽博物館','頭城海水浴場','龜山島','桃源谷','草嶺古道','蜜月灣','微笑灣休閒農場','頭城農場','源合成街屋','李榮春文學館','大溪漁港','梗枋漁港','烏石漁港','竹安河口']
VILLAGES=['石城里','大里里','大溪里','合興里','更新里','龜山里','外澳里','港口里','武營里','城東里','城西里','城南里','城北里','新建里','拔雅里','頂埔里','下埔里','二城里','中崙里','金面里','福成里','竹安里']
PEOPLE=['李榮春','連明偉','林瑞文','彭仁鴻','卓陳明','卓媽媽','莊錫財','吳沙','盧纘祥','陳忠茂','郭章垣','蘇耀邦','葉風鼓','林蔡齡','呂金發','賴阿塗','曾朝宜','康阿振','康阿裕']
ORGS=['頭城鎮公所','蘭陽博物館','頭城二三事','燦景工作室','頭城文化發展協會','頭城鎮農會','頭城區漁會','國立頭城家商','頭城國中','頭城國小','佛光大學','宜蘭家扶','媽媽號','金魚厝邊','交通部','宜蘭縣政府']
def found(text,terms): return [x for x in terms if x in text]

def source_group(record_type):
    return {'official':'官方／公共機構','local-publication':'地方出版與文史','local_history':'地方出版與文史','news':'新聞紀錄','community':'地方生活與社群','folklore':'民間傳說與口述'}.get(record_type,'地方生活與社群')
def confidence(record_type):
    return {'official':'高','news':'高','local-publication':'中','community':'中','local_history':'待交叉查證','folklore':'待交叉查證'}.get(record_type,'待查證')

for r in records:
    text=' '.join(str(r.get(k,'')) for k in ['title','event','source','sourceType'])
    mapped=[]
    for c in r.get('categories',[]):
        m=topic(c)
        if m not in mapped:mapped.append(m)
    primary=mapped[0] if mapped else '地方記憶與社群'
    tags=[]
    for c in r.get('categories',[])+mapped[1:]:
        if c!=primary and c not in tags:tags.append(c)
    sources=[{'name':r.get('source','來源待補'),'url':r.get('sourceUrl',''),'type':source_group(r.get('recordType')),'sourceDate':'','note':''}]
    if r.get('referenceUrl'):
        sources.append({'name':r.get('referenceLabel','延伸參考'),'url':r['referenceUrl'],'type':'延伸參考','sourceDate':'','note':''})
    sources.extend(r.pop('_extraSources',[]))
    r.update({
      'startDate':r.get('date',str(r.get('year',''))), 'endDate':r.get('endDate',''),
      'locations':found(text,PLACE_TERMS), 'villages':found(text,VILLAGES),
      'people':found(text,PEOPLE), 'organizations':found(text,ORGS),
      'primaryCategory':primary, 'tags':tags, 'sources':sources,
      'review':{'status':r.get('reviewStatus','待查證'),'confidence':confidence(r.get('recordType')),'notes':'','lastUpdated':UPDATED}
    })

def norm(s): return re.sub(r'[^0-9A-Za-z\u4e00-\u9fff]','',s or '').lower()
def bigrams(s):
    s=norm(s); return {s[i:i+2] for i in range(max(0,len(s)-1))}
def similarity(a,b):
    x,y=bigrams(a),bigrams(b)
    return len(x&y)/len(x|y) if x and y else 0

issues=[]
for r in records:
    d=str(r.get('startDate',''))
    if re.fullmatch(r'\d{4}',d):
        issues.append({'type':'日期精度','severity':'提醒','recordIds':[r['id']],'title':r['title'],'detail':'目前只有年份，未擅自補入月份或日期。'})
    elif re.fullmatch(r'\d{4}-\d{2}',d):
        issues.append({'type':'日期精度','severity':'提醒','recordIds':[r['id']],'title':r['title'],'detail':'目前只有年月，未擅自補入日期。'})
    elif not re.fullmatch(r'\d{4}-\d{2}-\d{2}',d):
        issues.append({'type':'日期精度','severity':'提醒','recordIds':[r['id']],'title':r['title'],'detail':f'目前使用「{d}」的年代描述，尚無可確認的完整日期。'})

by_year=defaultdict(list)
for r in records: by_year[r.get('year')].append(r)
seen_pairs=set()
for year,group in by_year.items():
    for i,a in enumerate(group):
        for b in group[i+1:]:
            fa=re.match(r'^(.{1,6})社區活動中心',a['title']);fb=re.match(r'^(.{1,6})社區活動中心',b['title'])
            if fa and fb and fa.group(1)!=fb.group(1): continue
            score=similarity(a['title'],b['title'])
            if score>=0.62:
                key=tuple(sorted([a['id'],b['id']]))
                if key not in seen_pairs:
                    seen_pairs.add(key);issues.append({'type':'疑似重複','severity':'需人工判斷','recordIds':list(key),'title':f"{a['title']}／{b['title']}",'detail':f'同為{year}年，標題相似度 {score:.0%}；不自動合併。'})

by_title=defaultdict(list)
for r in records: by_title[norm(r['title'])].append(r)
for title,group in by_title.items():
    dates=sorted({str(x['startDate']) for x in group})
    if title and len(group)>1 and len(dates)>1:
        issues.append({'type':'同名不同日期','severity':'需人工判斷','recordIds':[x['id'] for x in group],'title':group[0]['title'],'detail':'相同標題出現不同日期：'+'、'.join(dates)+'。'})

debug_candidates_path=SITE/'tools/debug-candidates-v1.72.json'
if debug_candidates_path.exists():
    known_ids={r['id'] for r in records}
    for candidate in json.loads(debug_candidates_path.read_text(encoding='utf-8')):
        candidate['recordIds']=[record_id for record_id in candidate.get('recordIds',[]) if record_id in known_ids]
        if candidate['recordIds']:
            issues.append(candidate)

url_groups=defaultdict(list)
for r in records:
    for s in r['sources']:
        if s['url']:url_groups[s['url']].append(r['id'])
shared_urls=[{'url':u,'count':len(ids),'recordIds':ids} for u,ids in url_groups.items() if len(ids)>1]

source_counts=Counter(r['sources'][0]['name'] for r in records)
source_type_counts=Counter(r['sources'][0]['type'] for r in records)
category_counts=Counter(r['primaryCategory'] for r in records)
precision_counts=Counter('完整日期' if re.fullmatch(r'\d{4}-\d{2}-\d{2}',str(r['startDate'])) else '年月' if re.fullmatch(r'\d{4}-\d{2}',str(r['startDate'])) else '年份／年代描述' for r in records)

report={
 'generatedAt':UPDATED,'recordCount':len(records),'rule':'所有未確認項目僅供人工校訂，不自動刪除、合併或改寫原始事件。',
 'summary':{'issueCount':len(issues),'possibleDuplicates':sum(x['type']=='疑似重複' for x in issues),'sameTitleDifferentDate':sum(x['type']=='同名不同日期' for x in issues),'datePrecision':dict(precision_counts),'sharedSourceUrls':len(shared_urls)},
 'sourceCounts':[{'name':k,'count':v} for k,v in source_counts.most_common()],
 'sourceTypeCounts':[{'name':k,'count':v} for k,v in source_type_counts.most_common()],
 'categoryCounts':[{'name':k,'count':v} for k,v in category_counts.most_common()],
 'sharedSourceUrls':shared_urls,'resolvedMerges':resolved_merges,'issues':issues
}

if OUTDIR.exists(): shutil.rmtree(OUTDIR)
OUTDIR.mkdir(parents=True)
chunks=defaultdict(list)
for r in records:
    y=r.get('year')
    key=f'{(int(y)//10)*10}s' if isinstance(y,(int,float)) and y>0 else 'undated'
    chunks[key].append(r)

def chunk_order(k):
    m=re.match(r'(\d+)s',k);return int(m.group(1)) if m else -1
manifest_chunks=[]
for key in sorted(chunks,key=chunk_order,reverse=True):
    data=sorted(chunks[key],key=lambda x:(str(x.get('startDate','')),x['id']),reverse=True)
    filename=f'history-{key}.json'
    (OUTDIR/filename).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    years=[x['year'] for x in data if isinstance(x.get('year'),(int,float))]
    manifest_chunks.append({'key':key,'url':f'assets/data/history/{filename}','count':len(data),'minYear':min(years) if years else None,'maxYear':max(years) if years else None})

manifest={'version':SITE_VERSION,'updatedAt':UPDATED,'totalCount':len(records),'minYear':min(x['year'] for x in records if isinstance(x.get('year'),(int,float)) and x['year']>0),'maxYear':max(x['year'] for x in records if isinstance(x.get('year'),(int,float))),'chunks':manifest_chunks,'sourceTypeCounts':report['sourceTypeCounts'],'categoryCounts':report['categoryCounts']}
(OUTDIR/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

# 對最終公開事件作正規化後的 SHA-256，與分檔、排序方式無關。
canonical_records=json.dumps(sorted(records,key=lambda x:x['id']),ensure_ascii=False,sort_keys=True,separators=(',',':')).encode('utf-8')
integrity={
  'version':SITE_VERSION,'generatedAt':UPDATED,'algorithm':'SHA-256',
  'scope':'依典藏編號排序之最終公開事件 JSON（UTF-8、鍵名排序、無多餘空白）',
  'recordCount':len(records),
  'datasetSha256':hashlib.sha256(canonical_records).hexdigest(),
  'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest()
}
(SITE/'assets/data/data-integrity.json').write_text(json.dumps(integrity,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(SITE/'assets/data/data-integrity.js').write_text('window.TOUCHENG_DATA_INTEGRITY = '+json.dumps(integrity,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')

# 首頁與每日郵件共用的「歷史上的今天」輕量索引，只收錄具有完整月日的事件。
def today_item(r):
    return {
      'id':r['id'],'date':r['startDate'],'year':r['year'],'title':r['title'],
      'summary':r['event'],'category':r['primaryCategory'],
      'source':r['sources'][0]['name'] if r.get('sources') else '來源待補'
    }
exact_date_records=[r for r in records if re.fullmatch(r'\d{4}-\d{2}-\d{2}',str(r.get('startDate','')))]
today_by_day=defaultdict(list)
for r in exact_date_records: today_by_day[str(r['startDate'])[5:]].append(today_item(r))
for day in today_by_day: today_by_day[day].sort(key=lambda x:(x['year'],x['id']),reverse=True)
today_index={
  'version':SITE_VERSION,'updatedAt':UPDATED,
  'eventsByDay':dict(sorted(today_by_day.items()))
}
(SITE/'assets/data/on-this-day.json').write_text(json.dumps(today_index,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(SITE/'assets/data/audit-report.json').write_text(json.dumps(report,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(SITE/'assets/data/audit-report.js').write_text('window.TOUCHENG_AUDIT = '+json.dumps(report,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
COMPAT.write_text(f"// v{SITE_VERSION} 相容入口：完整資料已依年代拆至 assets/data/history/。\nwindow.TOUCHENG_HISTORY = [];\nwindow.TOUCHENG_HISTORY_MANIFEST = 'assets/data/history/manifest.json';\n",encoding='utf-8')

print(json.dumps({'records':len(records),'chunks':len(chunks),'issues':len(issues),'duplicates':report['summary']['possibleDuplicates'],'datePrecision':dict(precision_counts)},ensure_ascii=False))
