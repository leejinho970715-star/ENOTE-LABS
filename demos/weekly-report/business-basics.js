import {sumSeries,countSeries,chartCardHTML} from './charts.js';
import {escapeHTML as e,encodeCSV} from './core.js';
export const demoEmployees=[
 {id:'e1',name:'샘플 김대표',department:'경영',title:'대표',manager:'',email:'ceo@example.invalid',joined:'2025-01-02'},
 {id:'e2',name:'샘플 이기획',department:'프로젝트팀',title:'팀장',manager:'e1',email:'pm@example.invalid',joined:'2025-03-03'},
 {id:'e3',name:'샘플 박디자인',department:'프로젝트팀',title:'디자이너',manager:'e2',email:'design@example.invalid',joined:'2025-06-02'},
 {id:'e4',name:'샘플 최운영',department:'운영팀',title:'매니저',manager:'e1',email:'ops@example.invalid',joined:'2025-09-01'}
];
export const demoTrades=[
 {id:'t1',kind:'매출',date:'2026-11-02',party:'가상 모노디자인',item:'프로젝트 운영 화면 제작',supply:350000,vat:35000,payment:'미정산'},
 {id:'t2',kind:'매입',date:'2026-11-02',party:'가상 디자인 공급사',item:'디자인 제작 외주',supply:100000,vat:10000,payment:'정산 완료'},
 {id:'t3',kind:'매출',date:'2026-11-03',party:'가상 라움스튜디오',item:'보고서 양식 맞춤 제작',supply:200000,vat:20000,payment:'정산 완료'},
 {id:'t4',kind:'매입',date:'2026-10-28',party:'가상 업무도구 공급사',item:'업무 도구 사용',supply:30000,vat:3000,payment:'미정산'}
];
export function tradeSummary(records){
 const sum=kind=>records.filter(r=>r.kind===kind).reduce((n,r)=>n+r.supply,0);
 return {sales:sum('매출'),purchases:sum('매입'),difference:sum('매출')-sum('매입'),unsettled:records.filter(r=>r.payment==='미정산').length};
}
const won=n=>'KRW '+n.toLocaleString('ko-KR');
export function mountBusinessBasics(host,view){
 let selected='e1',mode='cards',query='',kind='전체',month='2026-11',payment='전체';
 const money=n=>e(won(n));
 function personCard(p){return `<button class="employee-card" aria-pressed="${p.id===selected}" data-employee="${p.id}"><span class="avatar">${e(p.name.slice(-2))}</span><strong>${e(p.name)}</strong><span>${e(p.department)} · ${e(p.title)}</span><small>인사카드 열기 ↗</small></button>`;}
 function tree(id,visited=new Set()){
  if(visited.has(id))return '';visited.add(id);const p=demoEmployees.find(p=>p.id===id);if(!p)return '';
  const children=demoEmployees.filter(x=>x.manager===id);return `<li>${personCard(p)}${children.length?'<ul>'+children.map(x=>tree(x.id,new Set(visited))).join('')+'</ul>':''}</li>`;
 }
 function render(){
  if(!host.isConnected)return;
  if(view==='people'){
   const p=demoEmployees.find(p=>p.id===selected),boss=demoEmployees.find(x=>x.id===p.manager);
   host.innerHTML=`<span class="eyebrow">PEOPLE · SYNTHETIC DEMO</span><h1>직원 인사카드와 조직도</h1><p>가상 직원의 부서·직책·업무 연락처를 확인하는 조회용 데모입니다.</p><div class="actions"><button data-people-mode="cards" aria-pressed="${mode==='cards'}">인사카드</button><button data-people-mode="org" aria-pressed="${mode==='org'}">조직도</button><a class="button outline" href="https://enote-labs.vercel.app/crewmemo/workspace/?mode=demo&view=approvals">Crewmemo 휴가 신청 ↗</a></div><div class="people-layout"><section class="card">${mode==='org'?'<ul class="org-tree" aria-label="샘플 조직도">'+tree('e1')+'</ul>':'<div class="employee-grid">'+demoEmployees.map(personCard).join('')+'</div>'}</section><section class="card"><h2>${e(p.name)} · 인사관리카드</h2><dl class="employee-details"><dt>부서</dt><dd>${e(p.department)}</dd><dt>직책</dt><dd>${e(p.title)}</dd><dt>보고 담당자</dt><dd>${boss?e(boss.name):'없음 (최상위)'}</dd><dt>업무 이메일</dt><dd>${e(p.email)}</dd><dt>입사일 (가상)</dt><dd>${e(p.joined)}</dd></dl><p>급여·주민등록번호·계좌·건강정보는 다루지 않습니다. 휴가 신청·승인은 Crewmemo에서 시연하며, 연차 발생·잔여일수 계산은 포함하지 않습니다.</p></section></div>`;
  }else{
   const rows=demoTrades.filter(r=>(kind==='전체'||r.kind===kind)&&(!month||r.date.startsWith(month))&&(payment==='전체'||r.payment===payment)&&(!query||[r.party,r.item].some(s=>s.includes(query))));
   const total=tradeSummary(rows);
   host.innerHTML=`<span class="eyebrow">SALES & PURCHASES · SYNTHETIC DEMO</span><h1>매출·매입 기록</h1><p>직접 등록한 거래를 확인하는 화면의 예시입니다. 아래는 가상 기록이며 실제 매출·입금 실적이 아닙니다.</p><div class="ledger-filters"><label>조회 월<input data-ledger="month" type="month" value="${e(month)}"></label><label>거래 종류<select aria-label="거래 종류" data-ledger="kind">${['전체','매출','매입'].map(v=>`<option ${v===kind?'selected':''}>${v}</option>`).join('')}</select></label><label>대금 상태<select aria-label="대금 상태" data-ledger="payment">${['전체','미정산','정산 완료'].map(v=>`<option ${v===payment?'selected':''}>${v}</option>`).join('')}</select></label><label>거래처·내용<input data-ledger="query" value="${e(query)}" placeholder="검색어 입력 후 Enter"></label><button data-ledger-download>현재 조회 CSV</button></div><div class="stats"><article class="card"><small>매출 공급가액</small><strong>${money(total.sales)}</strong></article><article class="card"><small>매입 공급가액</small><strong>${money(total.purchases)}</strong></article><article class="card"><small>기록상 차액 · 순이익 아님</small><strong>${money(total.difference)}</strong></article><article class="card"><small>미정산 기록</small><strong>${total.unsettled}건</strong></article></div>${chartCardHTML('매출·매입 공급가액',sumSeries(rows,'kind','supply',['매출','매입']),{unit:'KRW',note:'현재 조회 범위 · 가상 입력값 · 순이익·입금액과 다름'})}${chartCardHTML('대금 상태',countSeries(rows,'payment',['미정산','정산 완료']),{kind:'donut',unit:'건',note:'입력한 상태 · 은행 확인 아님'})}<section class="card"><h2>조회 거래 ${rows.length}건</h2><div class="ledger-list">${rows.map(r=>`<article><div><span class="badge">${e(r.kind)} · ${e(r.payment)}</span><h3>${e(r.party)}</h3><p>${e(r.item)} · ${e(r.date)}</p></div><dl><dt>공급가액</dt><dd>${money(r.supply)}</dd><dt>부가세 (입력값)</dt><dd>${money(r.vat)}</dd><dt>합계</dt><dd>${money(r.supply+r.vat)}</dd></dl></article>`).join('')||'<p>조건에 맞는 가상 거래가 없습니다.</p>'}</div></section><p>단식 거래 목록 데모입니다. 복식부기·급여·세무신고·전자세금계산서 발행·은행 입금 확인을 하지 않습니다. 부가세와 정산 상태는 입력값이며 세법상 매출 인식이나 세액을 검증하지 않습니다.</p>`;
   const download=host.querySelector('[data-ledger-download]');download.onclick=()=>{
    const text=encodeCSV([['종류','거래일','가상 거래처','내용','공급가액_KRW','부가세_KRW','합계_KRW','대금상태'],...rows.map(r=>[r.kind,r.date,r.party,r.item,r.supply,r.vat,r.supply+r.vat,r.payment])]);
    const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='flownote-synthetic-trades.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   };
  }
  host.insertAdjacentHTML('afterbegin','<div class="sample-note"><b>가상 자료 조회 전용</b> 실제 직원·거래 자료를 입력하지 않습니다. 회사 DB의 인사·회계 기능은 연결하지 않았습니다.</div>');
 }
 host.addEventListener('click',event=>{event.stopPropagation();const person=event.target.closest('[data-employee]'),button=event.target.closest('[data-people-mode]');if(person){selected=person.dataset.employee;render();}if(button){mode=button.dataset.peopleMode;render();}});
 host.addEventListener('change',event=>{const key=event.target.dataset.ledger;if(!key)return;event.stopPropagation();if(key==='month')month=event.target.value;if(key==='kind')kind=event.target.value;if(key==='payment')payment=event.target.value;if(key==='query')query=event.target.value.trim();render();});
 render();
}
