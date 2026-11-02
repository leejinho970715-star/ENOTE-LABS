import type {SuiteData,SuiteRow} from './suite';
import {validDay,koreaDay} from './operations.ts';
export type HandoffCheck={id:string;state:'확인됨'|'확인 필요'|'미설정'|'권한상 확인 불가';title:string;evidence:string;href:string};
export function handoffChecks(data:SuiteData,orgId:string,{demo=false,today=koreaDay(),periodStart=''}={}){
 const checks:HandoffCheck[]=[],scope=(key:keyof SuiteData)=>data[key].filter(r=>r.org_id===orgId),mode=demo?'demo':'cloud',base='https://enote-labs.vercel.app',query=`mode=${mode}&org=${encodeURIComponent(orgId)}`;
 if(!orgId)return checks;
 const projects=scope('projects').filter(r=>!r.archived),links=scope('project_links'),crew=scope('team_tasks'),company=scope('company_links')[0];
 const pms=(p?:SuiteRow)=>`${base}/projectflow/workspace/?${query}${p?'&project='+encodeURIComponent(p.id!):''}`;
 const add=(c:HandoffCheck)=>checks.push(c);
 for(const d of scope('deals').filter(d=>!d.archived&&d.stage==='수주')){const rel=links.find(l=>l.deal_id===d.id),p=projects.find(p=>p.id===rel?.project_id);add({id:'deal-'+d.id,state:p?'확인됨':'확인 필요',title:String(d.title),evidence:p?'수주 기회에 활성 프로젝트가 명시적으로 연결돼 있습니다.':'수주 기회와 연결된 활성 프로젝트가 조회되지 않습니다. 별도 프로젝트로 진행 중인지 확인하세요.',href:p?pms(p):`${base}/suite/?${query}`});}
 for(const p of projects){const tasks=scope('tasks').filter(t=>t.project_id===p.id),rel=links.find(l=>l.project_id===p.id);if(!tasks.length)add({id:'tasks-'+p.id,state:'확인 필요',title:String(p.name),evidence:'등록 작업이 없습니다. 작업 등록이 필요한 프로젝트인지 확인하세요.',href:pms(p)});
  for(const t of tasks.filter(t=>t.status!=='완료')){if(!String(t.owner_name||'').trim()||!validDay(String(t.due_on||''))||String(t.due_on)<today)add({id:'task-'+t.id,state:'확인 필요',title:String(t.title),evidence:`담당: ${t.owner_name||'미배정'} · 마감: ${t.due_on||'미정'} · 상태: ${t.status}. 등록된 값 기준이며 실제 수행 여부를 추정하지 않습니다.`,href:pms(p)});const linked=crew.find(c=>c.project_task_id===t.id);if(linked)add({id:'crew-'+t.id,state:linked.status===t.status?'확인됨':'확인 필요',title:String(t.title),evidence:`ProjectFlow ${t.status} / Crewmemo ${linked.status} · 연결된 작업의 현재 상태입니다.`,href:`${base}/crewmemo/workspace/?${query}&view=tasks`});}
  if(!rel?.flownote_project_id){add({id:'report-'+p.id,state:'미설정',title:String(p.name),evidence:'Flownote 보고 연결은 선택 사항입니다. 연결되지 않은 프로젝트를 보고 누락으로 확정하지 않습니다.',href:`${base}/suite/?${query}`});continue;}
  const canRead=company&&data.companies.some(c=>c.id===company.company_id);
  if(!canRead){add({id:'report-'+p.id,state:'권한상 확인 불가',title:String(p.name),evidence:'연결된 Flownote 회사의 조회 권한을 확인하지 못했습니다. 보고서 없음으로 판단하지 않습니다.',href:'https://flow-note-psi.vercel.app/account.html'});continue;}
  const reports=data.reports.filter(r=>r.company_id===company.company_id&&r.project_id===rel.flownote_project_id&&(!periodStart||(r.period_start||r.snapshot?.period_start)===periodStart));
  const latest=new Map<string,SuiteRow>();for(const r of reports){const key=String(r.report_id||r.id);if(!latest.has(key)||Number(latest.get(key)!.version)<Number(r.version))latest.set(key,r);}
  if(!latest.size)add({id:'report-'+p.id,state:'확인 필요',title:String(p.name),evidence:periodStart?'선택한 보고 시작일의 조회 가능한 보고서가 없습니다.':'조회 가능한 보고서가 없습니다. 보고 주기를 지정하지 않아 기간 누락을 확정하지 않습니다.',href:`https://flow-note-psi.vercel.app/account.html?company=${encodeURIComponent(company.company_id)}`});
  for(const r of latest.values())add({id:'version-'+r.id,state:r.status==='DELIVERED'?'확인됨':'확인 필요',title:String(p.name)+` · v${r.version}`,evidence:`${r.snapshot?.period_start||r.period_start||''} · ${r.status}. 저장된 최신 버전 기준이며 전달 기록도 고객 수신 확인은 아닙니다.`,href:`https://flow-note-psi.vercel.app/account.html?company=${encodeURIComponent(company.company_id)}`});
 }
 return checks;
}
