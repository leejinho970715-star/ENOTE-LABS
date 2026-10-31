'use client';
import {useState,useEffect,type FormEvent} from 'react';
import {db,sample} from '../lib/data';
import {studioSample,sampleMembers} from '../lib/studio-domain';
import {suiteEmpty,suiteDemoCommand,type SuiteData,type SuiteRow} from '../lib/suite';
import DataChart from './data-chart';
import {countSeries} from '../../demos/weekly-report/charts.js';
const text=(r:SuiteRow|undefined,k:string)=>String(r?.[k]??'');
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());
export default function SuiteWorkspace(){
 const [data,setData]=useState<SuiteData>(structuredClone(suiteEmpty)),[orgs,setOrgs]=useState<SuiteRow[]>([]),[orgId,setOrgId]=useState(''),[demo,setDemo]=useState(true),[session,setSession]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const org=orgs.find(o=>o.id===orgId)||orgs[0],oid=text(org,'id');
 function loadDemo(){
  const pms=JSON.parse(localStorage.getItem('agencyflow-demo-v1')||'null')||sample();
  const crm=JSON.parse(localStorage.getItem('studio-follonote-demo-v1')||'null')||studioSample();
  const crew=JSON.parse(localStorage.getItem('studio-crewmemo-demo-v1')||'null')||studioSample();
  const links=JSON.parse(localStorage.getItem('enote-suite-demo-v1')||'null')||{};
  setOrgs(pms.orgs);setData({...structuredClone(suiteEmpty),...links,contacts:crm.contacts,deals:crm.deals,clients:pms.clients,projects:pms.projects,tasks:pms.tasks,team_tasks:crew.team_tasks,members:sampleMembers,companies:[{id:'demo-company',name:'Flownote · 통합 샘플'}]});
 }
 async function refresh(id=oid){
  setError('');setBusy(true);try{
   const who=await db.auth.getUser();setSession(!!who.data.user);if(!who.data.user)return;
   const [os,ms,cs]=await Promise.all([db.from('af_orgs').select('*'),db.from('af_members').select('*'),db.from('companies').select('id,name')]);
   for(const r of [os,ms,cs])if(r.error)throw r.error;
   const allowed=(os.data||[]).filter(o=>ms.data?.some(m=>m.org_id===o.id&&m.user_id===who.data.user?.id&&['admin','member'].includes(m.role)));setOrgs(allowed);
   const picked=allowed.find(o=>o.id===id)||allowed[0];if(!picked){setData(structuredClone(suiteEmpty));return;}setOrgId(picked.id);
   const names:Record<string,string>={contacts:'studio_contacts',clients:'af_clients',deals:'studio_deals',projects:'af_projects',tasks:'af_tasks',team_tasks:'studio_team_tasks',members:'af_members',customers:'suite_customers',project_links:'suite_projects',company_links:'suite_companies'};
   const next={...structuredClone(suiteEmpty),companies:cs.data||[]} as SuiteData;
   for(const [k,table] of Object.entries(names)){const r=await db.from(table).select('*').eq('org_id',picked.id).limit(501);if(r.error)throw r.error;if((r.data||[]).length>500)throw Error('제품 연결 화면은 500건까지 표시합니다. 회사 자료 범위를 조정해 주세요.');next[k as keyof SuiteData]=r.data||[];}
   const cid=next.company_links[0]?.company_id;
   if(cid){for(const [k,t] of [['fn_clients','clients'],['fn_projects','projects'],['reports','latest_report_versions']]){const r=await db.from(t).select('*').eq('company_id',cid).limit(501);if(r.error)throw r.error;if((r.data||[]).length>500)throw Error('Flownote 연결 자료가 표시 한도 500건을 넘었습니다.');next[k as keyof SuiteData]=r.data||[];}}
   setData(next);
  }catch(e){setError(e instanceof Error?e.message:'연결 자료를 불러오지 못했습니다.');setData(structuredClone(suiteEmpty));}finally{setBusy(false);}
 }
 useEffect(()=>{const q=new URLSearchParams(location.search);const isDemo=q.get('mode')!=='cloud';setDemo(isDemo);setOrgId(q.get('org')||'');if(isDemo)loadDemo();else refresh(q.get('org')||'');},[]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(busy)return;const form=e.currentTarget,action=form.dataset.action!,p=Object.fromEntries(new FormData(form)) as Record<string,string>;setError('');setMessage('');setBusy(true);
  try{if(demo){const next=suiteDemoCommand(data,action,p,()=>crypto.randomUUID());
    const pms=JSON.parse(localStorage.getItem('agencyflow-demo-v1')||'null')||sample(),crm=JSON.parse(localStorage.getItem('studio-follonote-demo-v1')||'null')||studioSample(),crew=JSON.parse(localStorage.getItem('studio-crewmemo-demo-v1')||'null')||studioSample();
    Object.assign(pms,{clients:next.clients,projects:next.projects,tasks:next.tasks});Object.assign(crm,{contacts:next.contacts,deals:next.deals});crew.team_tasks=next.team_tasks;
    localStorage.setItem('agencyflow-demo-v1',JSON.stringify(pms));localStorage.setItem('studio-follonote-demo-v1',JSON.stringify(crm));localStorage.setItem('studio-crewmemo-demo-v1',JSON.stringify(crew));
    localStorage.setItem('enote-suite-demo-v1',JSON.stringify({customers:next.customers,project_links:next.project_links,company_links:next.company_links,fn_clients:next.fn_clients,fn_projects:next.fn_projects}));setData(next);
   }else{const payload={...p,org_id:oid,...(action==='project_to_flownote'?{campaigns:p.campaigns.split('|').map(s=>s.trim()).filter(Boolean)}:{})};const r=await db.rpc('suite_command',{p_action:action,p_payload:payload});if(r.error)throw r.error;await refresh();}
   setMessage('연결했습니다. 이미 연결된 항목은 중복 생성하지 않습니다.');
  }catch(e){setError(e instanceof Error?e.message:'연결하지 못했습니다.');}finally{setBusy(false);}
 }
 function pick(name:string,label:string,rows:SuiteRow[],key='name'){return <label>{label}<select name={name} required><option value="">선택하세요</option>{rows.filter(r=>!r.archived).map(r=><option key={r.id} value={r.id}>{text(r,key)}</option>)}</select></label>}
 function action(label:string){return <button className="button primary" disabled={busy||(!demo&&!oid)}>{label}</button>}
 const base=demo?'mode=demo':'mode=cloud';
 return <div className="suite-page app-shell"><header className="suite-header"><a className="af-brand" href="https://enote-labs.vercel.app/"><img src="https://enote-labs.vercel.app/assets/enote-labs-logo-20261031.png" alt="" width="32" height="32"/>ENOTE-LABS <small>제품 연결</small></a><div className="actions"><button onClick={()=>{if(demo)loadDemo();else refresh();}}>새로고침</button><a className="button" href={demo?'?mode=cloud':'?mode=demo'}>{demo?'회사 계정':'통합 샘플'}</a></div></header><main>
  <span className="eyebrow">CONNECTED WORKSPACE</span><h1>영업에서 보고까지, 같은 업무를 이어갑니다.</h1><p>{demo?'이 도메인의 브라우저에 저장되는 연결 체험입니다. 실제 회사 자료는 회사 계정 모드에서 연결합니다.':'같은 회사의 고객·프로젝트·팀 업무를 연결합니다. 각 제품의 권한을 그대로 적용합니다.'}</p>
  {error&&<p role="alert" className="error-message">{error}</p>}{message&&<p role="status" className="success-message">{message}</p>}
  {!demo&&!session?<section className="panel"><h2>회사 계정으로 로그인</h2><form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');const p=new FormData(e.currentTarget);const r=await db.auth.signInWithPassword({email:String(p.get('email')),password:String(p.get('password'))});if(r.error)setError(r.error.message);else await refresh();setBusy(false);}}><label>이메일<input type="email" name="email" autoComplete="username" required/></label><label>비밀번호<input type="password" name="password" autoComplete="current-password" required/></label><button disabled={busy}>로그인</button></form><a className="button" href="https://agencyflow-studio-dun.vercel.app/workspace/?mode=cloud">회원가입 · 회사 만들기 ↗</a></section>:<>
  <label className="pms-search">공통 회사<select value={oid} disabled={demo||busy} onChange={e=>{setOrgId(e.target.value);refresh(e.target.value);}}>{orgs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
  <nav className="actions suite-product-links" aria-label="연결 제품"><a className="button" href={'/follonote/workspace/?'+base+'&org='+oid}>Follonote · CRM</a><a className="button" href={'/projectflow/workspace/?'+base+'&org='+oid}>ProjectFlow · PMS</a><a className="button" href={'/crewmemo/workspace/?'+base+'&org='+oid}>Crewmemo · Groupware</a><a className="button" href={'https://flow-note-psi.vercel.app/account.html'+(data.company_links[0]?'?company='+data.company_links[0].company_id:'')}>Flownote · ERP ↗</a></nav>
  <div className="chart-grid"><DataChart title="제품 간 연결 현황" series={[{label:'CRM ↔ 프로젝트 고객',value:data.customers.length},{label:'Flownote 고객',value:data.customers.filter(c=>c.flownote_client_id).length},{label:'영업 → 프로젝트',value:data.project_links.filter(p=>p.deal_id).length},{label:'프로젝트 → 보고 기반',value:data.project_links.filter(p=>p.flownote_project_id).length},{label:'프로젝트 ↔ 팀 작업',value:data.team_tasks.filter(t=>t.project_task_id).length}]} note="연결 건수 기준 · 제품의 전체 등록 수와 구분"/><DataChart title="연결 회사의 보고 상태" series={countSeries(data.reports,'status',[],{DRAFT:'작성 중',IN_REVIEW:'검수 대기',APPROVED:'승인',DELIVERED:'전달 기록'})} kind="donut" note="Flownote 조회 권한으로 확인한 최신 버전 · 보고 자료가 없으면 미집계"/></div>
  <div className="suite-forms">
   <section className="panel"><h2>1. CRM 고객을 프로젝트에서 사용</h2><form data-action="customer_from_crm" onSubmit={submit}>{pick('contact_id','CRM 고객',data.contacts)}{action('고객 연결')}</form><form data-action="customer_from_pms" onSubmit={submit}>{pick('client_id','프로젝트 고객',data.clients)}{action('CRM 고객으로 연결')}</form></section>
   <section className="panel"><h2>2. 수주한 기회를 프로젝트로</h2><form data-action="project_from_deal" onSubmit={submit}>{pick('deal_id','수주 영업기회',data.deals.filter(d=>d.stage==='수주'),'title')}<label>시작일<input type="date" name="starts_on" defaultValue={today()} required/></label><label>종료 예정일<input type="date" name="due_on" defaultValue={today()} required/></label>{action('프로젝트 생성')}</form><p className="muted">{!data.deals.some(d=>d.stage==='수주'&&!d.archived)&&'Follonote에서 수주로 변경한 뒤 새로고침하세요. '}영업 금액은 계약금액·실제 매출로 복사하지 않습니다.</p></section>
   <section className="panel"><h2>3. 프로젝트 작업을 팀 업무로</h2><form data-action="task_to_crew" onSubmit={submit}>{pick('task_id','프로젝트 작업',data.tasks,'title')}{pick('assignee_id','내부 담당자',data.members.filter(m=>m.role!=='client').map(m=>({...m,id:m.user_id})))}{action('Crewmemo에 연결')}</form><p className="muted">회사 모드에서는 연결된 작업의 상태가 양쪽에 반영됩니다. 제목·담당자·기한은 덮어쓰지 않습니다.</p></section>
   <section className="panel"><h2>4. Flownote 보고용 회사 연결</h2><form data-action="connect_company" onSubmit={submit}>{pick('company_id','Flownote 회사',data.companies)}{action('회사 연결')}</form><p className="muted">양쪽 회사의 대표 관리자만 연결할 수 있습니다. 팀원 접근 권한은 자동 부여하지 않습니다.</p></section>
   <section className="panel"><h2>5. 보고용 고객 연결</h2><form data-action="customer_to_flownote" onSubmit={submit}>{pick('client_id','연결 고객',data.clients.filter(c=>data.customers.some(l=>l.client_id===c.id)))}<label>CSV 고객 ID<input name="csv_client_id" pattern="[A-Za-z0-9_-]{1,40}" maxLength={40} required placeholder="예: C01"/></label>{action('Flownote 고객 생성')}</form></section>
   <section className="panel"><h2>6. 프로젝트를 보고 기반으로</h2><form data-action="project_to_flownote" onSubmit={submit}>{pick('project_id','프로젝트',data.projects)}<label>CSV 캠페인명<input name="campaigns" maxLength={500} required placeholder="캠페인A | 캠페인B"/></label>{action('Flownote 프로젝트 생성')}</form><p className="muted">CSV 연결 기준과 프로젝트 기간을 넘깁니다. 보고서 작성·검수는 Flownote 제공 범위를 따릅니다.</p></section>
  </div>
  <section className="panel"><h2>연결된 고객</h2><div className="table-scroll"><table><thead><tr><th>Follonote</th><th>ProjectFlow</th><th>Flownote</th></tr></thead><tbody>{data.customers.map(c=><tr key={c.contact_id}><td>{text(data.contacts.find(x=>x.id===c.contact_id),'name')}</td><td>{text(data.clients.find(x=>x.id===c.client_id),'name')}</td><td>{text(data.fn_clients.find(x=>x.id===c.flownote_client_id),'name')||'미연결 또는 조회 권한 없음'}</td></tr>)}</tbody></table></div>{!data.customers.length&&<p>아직 연결한 고객이 없습니다.</p>}</section>
  <p className="muted">연결은 선택한 자료의 최초 재사용입니다. 고객 정보 전체를 자동 덮어쓰지 않으며 기존 고객과 이름만 같은 자료도 자동 병합하지 않습니다. 회사 계정의 연결 작업은 이력에 기록합니다.</p>
  </>}
 </main></div>;
}
