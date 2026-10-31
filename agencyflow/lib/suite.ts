// Explicit demo hand-offs mirror the cloud commands. Existing records are never overwritten.
export type SuiteRow = {id?:string;[key:string]:any};
export type SuiteData = Record<'contacts'|'clients'|'deals'|'projects'|'tasks'|'team_tasks'|'members'|'customers'|'project_links'|'companies'|'company_links'|'fn_clients'|'fn_projects'|'reports',SuiteRow[]>;
export const suiteEmpty:SuiteData={contacts:[],clients:[],deals:[],projects:[],tasks:[],team_tasks:[],members:[],customers:[],project_links:[],companies:[],company_links:[],fn_clients:[],fn_projects:[],reports:[]};
export function suiteDemoCommand(source:SuiteData,action:string,p:Record<string,string>,id:()=>string){
 const d=structuredClone(source),o='demo-org';
 const find=(key:keyof SuiteData,keyName:string,value:string)=>d[key].find(r=>r[keyName]===value);
 if(action==='connect_company'){
  const existing=d.company_links[0];if(existing&&existing.company_id!==p.company_id)throw Error('이미 연결된 회사입니다.');
  if(!existing)d.company_links.push({org_id:o,company_id:p.company_id});
 }else if(action==='customer_from_crm'){
  const c=find('contacts','id',p.contact_id);if(!c||c.archived)throw Error('활성 CRM 고객을 선택하세요.');
  if(!find('customers','contact_id',c.id!)){const aid=id();d.clients.push({...c,id:aid});d.customers.push({org_id:o,contact_id:c.id,client_id:aid});}
 }else if(action==='customer_from_pms'){
  const c=find('clients','id',p.client_id);if(!c||c.archived)throw Error('활성 프로젝트 고객을 선택하세요.');
  if(!find('customers','client_id',c.id!)){const cid=id();d.contacts.push({...c,id:cid,source:'ProjectFlow'});d.customers.push({org_id:o,contact_id:cid,client_id:c.id});}
 }else if(action==='customer_to_flownote'){
  if(!d.company_links.length)throw Error('Flownote 회사를 먼저 연결하세요.');
  const link=find('customers','client_id',p.client_id),c=find('clients','id',p.client_id);
  if(!link||!c)throw Error('CRM과 프로젝트 고객을 먼저 연결하세요.');
  if(!/^[A-Za-z0-9_-]{1,40}$/.test(p.csv_client_id))throw Error('CSV 고객 ID를 확인하세요.');
  if(!link.flownote_client_id){if(d.fn_clients.some(r=>r.csv_client_id===p.csv_client_id))throw Error('이미 등록된 CSV 고객 ID입니다.');if(d.fn_clients.length>=3)throw Error('고객 기본 한도는 3곳입니다.');const fid=id();d.fn_clients.push({id:fid,name:c.name,csv_client_id:p.csv_client_id});link.flownote_client_id=fid;}
 }else if(action==='project_from_deal'){
  const deal=find('deals','id',p.deal_id);if(!deal||deal.stage!=='수주'||deal.archived)throw Error('수주 상태의 영업기회를 선택하세요.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(p.starts_on)||p.due_on<p.starts_on)throw Error('프로젝트 기간을 확인하세요.');
  if(!find('project_links','deal_id',deal.id!)){
   const next=suiteDemoCommand(d,'customer_from_crm',{contact_id:deal.contact_id},id);Object.assign(d,next);
   const client=find('customers','contact_id',deal.contact_id)!;const pid=id();
   d.projects.push({id:pid,org_id:o,client_id:client.client_id,name:deal.title,owner_name:deal.owner_name,stage:'견적',amount:0,starts_on:p.starts_on,due_on:p.due_on,archived:false});d.project_links.push({org_id:o,project_id:pid,deal_id:deal.id});
  }
 }else if(action==='project_to_flownote'){
  const project=find('projects','id',p.project_id),link=project&&find('customers','client_id',project.client_id);if(!project||project.archived||!link?.flownote_client_id)throw Error('활성 프로젝트의 고객을 먼저 Flownote에 연결하세요.');
  const campaigns=(p.campaigns||'').split('|').map(s=>s.trim()).filter(Boolean);if(!campaigns.length)throw Error('CSV 캠페인을 입력하세요.');
  let rel=find('project_links','project_id',p.project_id);if(!rel){rel={org_id:o,project_id:p.project_id};d.project_links.push(rel);}
  if(!rel.flownote_project_id){const fid=id();d.fn_projects.push({id:fid,client_id:link.flownote_client_id,name:project.name,campaigns,starts_on:project.starts_on,ends_on:project.due_on});rel.flownote_project_id=fid;}
 }else if(action==='task_to_crew'){
  const task=find('tasks','id',p.task_id);if(!task||!d.members.some(m=>m.user_id===p.assignee_id&&m.role!=='client'))throw Error('프로젝트 작업과 내부 담당자를 선택하세요.');
  if(!find('team_tasks','project_task_id',p.task_id))d.team_tasks.push({...task,id:id(),project_task_id:task.id,assignee_id:p.assignee_id,priority:task.priority==='낮음'?'보통':task.priority});
 }else throw Error('지원하지 않는 연결 작업입니다.');
 return d;
}
