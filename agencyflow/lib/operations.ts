export type Operation = {id:string;kind:string;title:string;status:string;owner:string;due:string;start?:string;endsAt?:string;startsAt?:string;customer?:string;amount?:number;body?:string;created?:string;target?:string};
export type OperationFilter={query:string;status:string;owner:string;kind:string;due:string};
export const emptyOperationFilter:OperationFilter={query:'',status:'전체',owner:'전체',kind:'전체',due:'전체'};
export function validDay(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;}
export function koreaDay(date=new Date()){if(!Number.isFinite(+date))return '';return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function shiftDay(s:string,n:number){if(!validDay(s))throw Error('날짜를 확인하세요.');return new Date(Date.parse(s+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);}
export const operationDone=(r:Operation)=>['완료','승인','취소','반려','수주','종료','운영','일정 종료'].includes(r.status);
export function filterOperations(rows:Operation[],f:OperationFilter,today=koreaDay()){
  const q=f.query.normalize('NFKC').trim().toLocaleLowerCase();
  return rows.filter(r=>(!q||[r.title,r.customer,r.owner,r.body].join(' ').normalize('NFKC').toLocaleLowerCase().includes(q))&&(['status','owner','kind'] as const).every(k=>f[k]==='전체'||r[k]===f[k])&&(f.due==='전체'||(f.due==='날짜 미정'&&!validDay(r.due))||(f.due==='기한 초과'&&!operationDone(r)&&validDay(r.due)&&r.due<today)||(f.due==='오늘'&&!operationDone(r)&&r.due===today)||(f.due==='7일 이내'&&!operationDone(r)&&validDay(r.due)&&r.due>=today&&r.due<=shiftDay(today,7)))).sort((a,b)=>(validDay(a.due)?a.due:'9999').localeCompare(validDay(b.due)?b.due:'9999')||a.title.localeCompare(b.title));
}
export function monthDays(month:string){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!validDay(month+'-01'))throw Error('월을 확인하세요.');const start=month+'-01',offset=new Date(start+'T00:00:00Z').getUTCDay();return Array.from({length:42},(_,i)=>shiftDay(start,i-offset));}
export function operationOnDay(r:Operation,day:string){return validDay(day)&&validDay(r.due)&&day>=((r.start&&validDay(r.start))?r.start:r.due)&&day<=r.due;}
function cell(v:unknown){let s=String(v??'');if(/^[\s]*[=+@-]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function operationsCSV(rows:Operation[]){return '\uFEFF'+[['종류','제목','상태','담당자','고객·프로젝트','시작일','마감·일정일','입력 금액(KRW)','내용'],...rows.map(r=>[r.kind,r.title,r.status,r.owner,r.customer||'',r.start||'',r.due,Number.isSafeInteger(r.amount)?r.amount:'',r.body||''])].map(row=>row.map(cell).join(',')).join('\r\n');}
const escapeICS=(s:string)=>s.replaceAll('\\','\\\\').replace(/\r?\n|\r/g,'\\n').replaceAll(';','\\;').replaceAll(',','\\,');
function foldICS(s:string){let out='',line='',bytes=0;for(const char of s){const n=new TextEncoder().encode(char).length;if(bytes+n>73){out+=line+'\r\n ';line='';bytes=1;}line+=char;bytes+=n;}return out+line;}
export function operationsICS(rows:Operation[],scope:string,now=new Date()){
  const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ENOTE-LABS//Operations//KO','CALSCALE:GREGORIAN'];
  for(const r of rows.filter(r=>validDay(r.due))){
    const timed=!!r.startsAt;
    if(timed&&(!r.endsAt||!Number.isFinite(Date.parse(r.startsAt!))||!Number.isFinite(Date.parse(r.endsAt))||Date.parse(r.endsAt)<=Date.parse(r.startsAt!)))throw Error('잘못된 일정 시간이 있어 내보내기를 중단했습니다.');
    const iso=(s:string)=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
    lines.push('BEGIN:VEVENT',`UID:${encodeURIComponent(scope+'-'+r.kind+'-'+r.id)}@enote-labs`,`DTSTAMP:${stamp}`,...(timed?[`DTSTART:${iso(r.startsAt!)}`,`DTEND:${iso(r.endsAt!)}`]:[`DTSTART;VALUE=DATE:${((r.start&&validDay(r.start))?r.start:r.due).replaceAll('-','')}`,`DTEND;VALUE=DATE:${shiftDay(r.due,1).replaceAll('-','')}`]),`SUMMARY:${escapeICS(r.title)}`,`DESCRIPTION:${escapeICS([r.kind,r.status,r.owner,r.customer,r.body].filter(Boolean).join(' · '))}`,'END:VEVENT');
  }
  return [...lines,'END:VCALENDAR'].map(foldICS).join('\r\n')+'\r\n';
}
export function duplicateContacts(rows:{id:string;name:unknown;email?:unknown;phone?:unknown}[]){
  const groups=new Map<string,string[]>();for(const r of rows){const email=String(r.email||'').trim().toLowerCase(),phone=String(r.phone||'').replace(/\D/g,''),name=String(r.name||'').normalize('NFKC').replace(/\s/g,'').toLowerCase();for(const key of [...(email?['이메일:'+email]:[]),...(phone.length>=8?['전화:'+phone]:[]),...(name?['회사명:'+name]:[])])groups.set(key,[...(groups.get(key)||[]),r.id]);}
  return [...groups].filter(([,ids])=>new Set(ids).size>1).map(([key,ids])=>({key,ids:[...new Set(ids)]}));
}
