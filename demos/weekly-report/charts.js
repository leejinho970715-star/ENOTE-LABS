// Shared, deterministic visual summaries. Never infer revenue, attendance or completion.
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const palette = ['#c4541b','#e58643','#efb079','#815b43','#b77a50','#efd0b3'];
const number = n => Number(n).toLocaleString('ko-KR', {maximumFractionDigits:2});
export function countSeries(rows, key, order = [], labels = {}) {
  const map = new Map(order.map(k => [k, 0]));
  for (const row of rows) { const k = String(row[key] ?? '').trim() || '미지정'; map.set(k,(map.get(k)||0)+1); }
  return [...map].map(([key,value]) => ({label:labels[key] || key,value,count:value,missing:0}));
}
export function sumSeries(rows, key, field, order = [], labels = {}) {
  const map = new Map(order.map(k => [k,{value:0,count:0,missing:0}]));
  for(const row of rows){const k=String(row[key]??'').trim()||'미지정',v=map.get(k)||{value:0,count:0,missing:0};v.count++;
    const raw=row[field],n=Number(raw);if(raw===null||raw===undefined||raw===''||!Number.isFinite(n)||n<0)v.missing++;else v.value+=n;map.set(k,v);}
  return [...map].map(([key,v])=>({label:labels[key]||key,...v}));
}
export function dayKey(value) {
  if(typeof value!=='string'||!value)return '';
  if(/^\d{4}-\d{2}-\d{2}$/.test(value)){const d=new Date(value+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value?value:'';}
  const d=new Date(value);return Number.isFinite(+d)?new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(d):'';
}
export function dueSeries(rows, key, today, done = r => r.status==='완료') {
  if(!dayKey(today))throw Error('집계 기준일이 올바르지 않습니다.');
  const end=new Date(today+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+7);const last=end.toISOString().slice(0,10);
  return countSeries(rows.map(r=>{const day=dayKey(r[key]);return {bucket:done(r)?'완료·종료':!day?'날짜 미정':day<today?'기한 초과':day===today?'오늘':day<=last?'7일 이내':'8일 이후'};}),'bucket',['기한 초과','오늘','7일 이내','8일 이후','날짜 미정','완료·종료']);
}
export function daySeries(rows, key, today, days = 7) {
  if(!dayKey(today)||!Number.isInteger(days)||days<1||days>31)throw Error('일정 집계 범위가 올바르지 않습니다.');
  const dates=Array.from({length:days},(_,i)=>{const d=new Date(today+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10);});
  return dates.map(day=>({label:day.slice(5).replace('-','/'),value:rows.filter(r=>dayKey(r[key])===day).length}));
}
export function periodSeries(rows, start, end, today) {
  if(!dayKey(today))throw Error('집계 기준일이 올바르지 않습니다.');
  return countSeries(rows.map(r=>{const a=dayKey(r[start]),b=dayKey(r[end]);return {bucket:!a||!b||b<a?'날짜 확인':a>today?'시작 전':b<today?'기간 종료':'진행 기간'};}),'bucket',['시작 전','진행 기간','기간 종료','날짜 확인']);
}
export function chartHTML(input, {kind='bar',unit='건',title='집계 도표'} = {}) {
  const rows=input.map(r=>({...r,label:String(r.label),value:Number(r.value)}));
  if(rows.some(r=>!Number.isFinite(r.value)||r.value<0))return '<p class="chart-empty">집계 값을 확인해 주세요.</p>';
  const total=rows.reduce((n,r)=>n+r.value,0),missing=rows.reduce((n,r)=>n+(r.missing||0),0),max=Math.max(1,...rows.map(r=>r.value));
  const plot=rows.length>10?[...rows.slice(0,9),{label:`그 외 ${rows.length-9}항목`,value:rows.slice(9).reduce((n,r)=>n+r.value,0)}]:rows;
  const value=r=>`${number(r.value)}${esc(unit)}${r.missing?` · 미입력 ${r.missing}`:''}`;
  const legend=plot.map((r,i)=>`<li><i style="background:${palette[i%palette.length]}"></i><span>${esc(r.label)}</span><b>${value(r)}</b></li>`).join('');
  let body='';
  if(total===0)body=`<p class="chart-empty">${rows.some(r=>r.count>0)?(missing?'유효한 금액의 합계는 0입니다. 미입력·형식 확인 항목은 제외했습니다.':'등록 자료의 집계 값은 0입니다.'):'조회 범위에 집계할 자료가 없습니다.'}</p>`;
  else if(kind==='donut'){let offset=0;const circumference=2*Math.PI*44;const circles=plot.filter(r=>r.value>0).map(r=>{const i=plot.indexOf(r),len=r.value/total*circumference;const circle=`<circle cx="60" cy="60" r="44" fill="none" stroke="${palette[i%palette.length]}" stroke-width="15" stroke-dasharray="${len.toFixed(4)} ${circumference.toFixed(4)}" stroke-dashoffset="${(-offset).toFixed(4)}" transform="rotate(-90 60 60)"/>`;offset+=len;return circle;}).join('');body=`<div class="chart-donut"><svg viewBox="0 0 120 120" role="img" aria-label="${esc(title)}: 합계 ${number(total)}${esc(unit)}"><circle cx="60" cy="60" r="44" class="chart-ring"/>${circles}<text x="60" y="59" text-anchor="middle">${number(total)}</text><text x="60" y="76" text-anchor="middle" class="chart-unit">${esc(unit)}</text></svg><ul class="chart-legend">${legend}</ul></div>`;}
  else if(kind==='columns')body=`<div class="chart-columns-scroll"><div class="chart-columns" style="--chart-columns:${plot.length}">${plot.map((r,i)=>`<div><b>${value(r)}</b><span class="chart-column-track"><i style="height:${(r.value/max*100).toFixed(3)}%;background:${palette[i%palette.length]}"></i></span><span>${esc(r.label)}</span></div>`).join('')}</div></div>`;
  else body=`<div class="chart-bars">${plot.map((r,i)=>`<div class="chart-row"><span>${esc(r.label)}</span><b>${value(r)}</b><span class="chart-track"><i style="width:${(r.value/max*100).toFixed(3)}%;background:${palette[i%palette.length]}"></i></span></div>`).join('')}</div>`;
  if(total===0&&rows.length)body+=`<ul class="chart-legend">${legend}</ul>`;
  const table=`<details class="chart-table"><summary>수치표 보기</summary><div><table><caption>${esc(title)}</caption><thead><tr><th scope="col">구분</th><th scope="col">값 (${esc(unit)})</th></tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${esc(r.label)}</th><td>${value(r)}</td></tr>`).join('')}</tbody></table></div></details>`;
  return body+(missing?`<p class="chart-note">금액 미입력·형식 확인 ${missing}건은 금액 합계에서 제외했습니다.</p>`:'')+(rows.length?table:'');
}
export function chartCardHTML(title, series, options = {}) {
  return `<section class="data-chart"><header><h2>${esc(title)}</h2>${options.note?`<p>${esc(options.note)}</p>`:''}</header>${chartHTML(series,{...options,title})}</section>`;
}
