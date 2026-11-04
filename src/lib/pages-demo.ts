import {personas} from './personas';
type Item=Record<string,any>;
const key='ai-universe-public-demo-v1';
const ids=['chief-of-staff','cso','cpo','cto','cmo','coo'],executives=ids.filter(x=>x!=='chief-of-staff');
const jobs:Record<string,string>={'chief-of-staff':'AI 비서실장',cso:'전략총괄',cpo:'제품총괄',cto:'기술총괄',cmo:'마케팅총괄',coo:'운영총괄'};
const lines:Record<string,string>={
 'chief-of-staff':'대표님, 지안입니다. 다섯 임원의 의견을 독립적으로 확인하고, 가정과 이견을 구분해 실행 계획으로 정리하겠습니다.',
 cso:'전략을 맡은 서연입니다. 먼저 고객이 반복해서 겪는 문제와 현재 사용하는 대안을 확인하면 좋겠습니다. 시장 규모와 수익성은 조사 전이므로 가설로 남기겠습니다.',
 cpo:'유나입니다. 서연님이 제안한 고객 검증을 바탕으로 가장 중요한 사용자 흐름 하나를 MVP로 설계하고 싶어요. 개발팀이 검증할 수 있는 인수 조건도 함께 정리하겠습니다.',
 cto:'다은입니다. 작은 기능부터 구현하고 인증·데이터 보관·자동 테스트를 함께 설계하겠습니다. 아직 개발하거나 검증하지 않은 기능을 완료한 것처럼 보고하지 않겠습니다.',
 cmo:'하린입니다. 고객에게 어떤 시간을 줄여주는지 분명하게 전달하고 싶어요. 제품 범위에 맞춰 브랜드 메시지와 사전 콘텐츠를 준비하되 실제 게시나 발송은 CEO 승인을 받겠습니다.',
 coo:'수빈입니다. 고객 검증부터 제품 범위, 기술 검토, 마케팅 준비까지 의존성을 연결하겠습니다. 각 업무의 완료 조건과 차단 요인을 먼저 확인하고 일정을 제안하겠습니다.'
};
function row(data:Item):Item{const now=new Date().toISOString();return {id:crypto.randomUUID(),createdAt:now,updatedAt:now,version:1,...data};}
export function newDemoState():Item{
 const state:Item={authenticated:true,agents:ids.map((id,i)=>row({id,name:id==='chief-of-staff'?'Chief of Staff':id.toUpperCase(),title:jobs[id],department:['경영지원','전략팀','제품팀','개발팀','마케팅팀','운영팀'][i],mission:personas[id].trait,manager:id==='chief-of-staff'?'CEO':'chief-of-staff',model:'공개 데모 · 실제 모델 미연결',budget:30000,enabled:true,status:'IDLE',color:['#a99aff','#6caaff','#b9a0ff','#65d8c0','#e5aa77','#f08db8'][i]})),projects:[],tasks:[],meetings:[],messages:[],approvals:[],decisions:[],documents:[row({id:'vision',title:'회사 비전 · 공개 예시',content:'# 회사 비전\n\n인간 CEO의 비전을 AI 임원진의 검증 가능한 실행으로 연결합니다.\n이 문서는 공개 체험용 예시입니다.'})],runs:[],usage:[],audit:[],executions:[],jobs:[],schedules:[],roles:ids.map(id=>({id,content:`# ${personas[id].name} · ${jobs[id]}\n\n${personas[id].trait}.\n\n공개 데모의 고정 페르소나입니다. 실제 실행용 상세 MD는 GitHub 저장소의 agents/roles에 있습니다.`})),settings:{id:'company',monthlyBudget:100000,maxOutputTokens:1800,maxInputChars:24000,maxRounds:2,maxCalls:20,timezone:'Asia/Seoul',paused:false},integrations:['github','gmail','calendar','figma'].map(id=>({id,status:'DISCONNECTED',configured:false,verifiedAt:null})),runtime:{apiConfigured:false,mode:'public-demo'}};
 createDemoMeeting(state,'[공개 데모] AI SaaS 출시를 위한 전략·제품·기술·마케팅·운영 계획');return state;
}
function createDemoMeeting(state:Item,goal:string){
 if(state.settings.paused)throw new Error('데모 실행이 일시 중지되었습니다');
 if(!goal.trim()||goal.length>4000)throw new Error('안건은 1~4000자로 입력하세요');
 const project=row({name:goal.slice(0,60),goal,budget:30000,status:'ACTIVE'});state.projects.push(project);
 const meeting=row({agenda:goal,projectId:project.id,participants:executives,status:'APPROVAL_PENDING',mode:'mock'});state.meetings.push(meeting);
 function message(agentId:string,phase:string,summary:string){state.messages.push(row({agentId,meetingId:meeting.id,phase,summary:'[공개 데모 · 고정 예시 / 실제 AI 아님]\n'+summary,evidence:['예시 데이터입니다. 실제 AI 호출·조사·코드 실행은 수행하지 않았습니다.'],dissent:phase==='debate'?['고객 검증 전에 출시 날짜를 확정하는 데 반대합니다.']:[]}));state.runs.push(row({agentId,meetingId:meeting.id,projectId:project.id,phase,status:'COMPLETED',mode:'mock'}));}
 message('chief-of-staff','plan',lines['chief-of-staff']);for(const id of executives)message(id,'opinion',lines[id]);
 for(let i=0;i<executives.length;i++){const id=executives[i],other=executives[(i+1)%executives.length];message(id,'debate',`${personas[other].name}님, 제안하신 방향에 동의합니다. 다만 확인되지 않은 가정을 확정된 계획으로 다루지 않으면 좋겠습니다. 고객 검증과 인수 조건을 먼저 확인하고 위험을 공유하겠습니다.`);}
 const summary='대표님, 고객 문제 검증부터 MVP·기술 검토·마케팅·운영 초안을 연결하는 다섯 업무를 제안합니다. 시장성과 출시 일정은 아직 검증하지 않았으며, 일정 확정에 대한 이견을 남겼습니다.';message('chief-of-staff','synthesis',summary);
 const created=executives.map((agentId,i)=>row({agentId,projectId:project.id,meetingId:meeting.id,title:`${jobs[agentId]} · 출시 계획 초안`,description:lines[agentId],acceptanceCriteria:'가정·근거·완료 조건을 구분한 내부 초안',status:'BACKLOG',dependencies:[],artifacts:[],requiresApproval:true}));created.forEach((t,i)=>{t.dependencies=i?[created[i-1].id]:[];});state.tasks.push(...created);
 const decision=row({meetingId:meeting.id,projectId:project.id,summary,status:'PENDING'});state.decisions.push(decision);
 state.approvals.push(row({kind:'decision',target:decision.id,agentId:'chief-of-staff',status:'PENDING',hash:'PUBLIC-DEMO-NO-SECURITY-APPROVAL',expiresAt:new Date(Date.now()+86400000).toISOString(),payload:{summary,taskIds:created.map(t=>t.id),projectId:project.id}}));
 return {meetingId:meeting.id,projectId:project.id};
}
function load():Item{try{const data=JSON.parse(localStorage.getItem(key)||'null');if(data?.runtime?.mode==='public-demo'&&Array.isArray(data.agents)&&data.agents.length===6)return data;}catch{}return newDemoState();}
function save(state:Item){localStorage.setItem(key,JSON.stringify(state));}
export function demoState():Item{const state=load();save(state);return state;}
function prepareReadyTasks(s:Item){for(const t of s.tasks.filter((t:Item)=>t.status==='READY'&&t.dependencies.every((id:string)=>s.tasks.find((x:Item)=>x.id===id)?.status==='COMPLETED'))){const doc=row({title:t.title,content:`# 공개 데모 산출물\n\n${t.description}\n\n검증 항목: 고객 문제, 가정, 인수 조건, 위험, 다음 업무.\n실제 조사나 코드 실행을 수행하지 않은 고정 예시입니다.`,projectId:t.projectId,taskId:t.id,mode:'mock'});s.documents.push(doc);t.artifacts=[doc.id];t.status='REVIEW';}}
export function applyDemoCommand(s:Item,b:Item):Item{
 const find=(table:string,id:string)=>{const r=s[table].find((x:Item)=>x.id===id);if(!r)throw new Error('항목을 찾을 수 없습니다');return r;};
 let result:Item={ok:true};
 switch(b.action){
 case 'meeting':if(b.mode!=='mock')throw new Error('GitHub Pages에서는 실제 AI를 실행할 수 없습니다. Mock 체험을 선택하세요.');result=createDemoMeeting(s,b.goal);break;
 case 'decide':{const a=find('approvals',b.id);if(a.status!=='PENDING')throw new Error('이미 처리된 데모 승인입니다');if(!['APPROVED','REJECTED','CHANGES_REQUESTED'].includes(b.decision))throw new Error('지원하지 않는 결정');a.status=b.decision;a.note=b.note||'';const d=find('decisions',a.target);d.status=b.decision;if(b.decision==='APPROVED'){a.status='CONSUMED';find('meetings',d.meetingId).status='APPROVED';for(const t of s.tasks.filter((t:Item)=>t.meetingId===d.meetingId))t.status='READY';prepareReadyTasks(s);}break;}
 case 'task.complete':{const t=find('tasks',b.id);if(t.status!=='REVIEW')throw new Error('검토 대기 업무만 완료할 수 있습니다');t.status='COMPLETED';prepareReadyTasks(s);const tasks=s.tasks.filter((x:Item)=>x.projectId===t.projectId);if(tasks.every((x:Item)=>x.status==='COMPLETED')){const project=find('projects',t.projectId);project.status='COMPLETED';s.documents.push(row({title:'CEO 최종 보고 · '+project.name,projectId:project.id,content:'# 공개 데모 최종 보고\n\n5개 업무의 예시 산출물을 CEO가 검토했습니다. 실제 AI 작업이나 외부 실행은 수행하지 않았습니다.'}));}break;}
 case 'pause':s.settings.paused=!!b.paused;break;
 case 'document':{const d=find('documents',b.id);if(d.version!==b.version)throw new Error('문서 버전 충돌');d.content=String(b.content).slice(0,60000);d.version++;break;}
 case 'settings':if(!(Number(b.settings.monthlyBudget)>0))throw new Error('양수 예산을 입력하세요');Object.assign(s.settings,b.settings);break;
 case 'agent':Object.assign(find('agents',b.id),b.agent);break;
 case 'project':if(!(Number(b.budget)>0))throw new Error('양수 예산을 입력하세요');find('projects',b.id).budget=b.budget;break;
 case 'integration.disconnect':Object.assign(find('integrations',b.service),{disabled:b.disabled,status:'DISCONNECTED'});break;
 case 'schedule.toggle':find('schedules',b.id).enabled=!!b.enabled;break;
 case 'schedule':throw new Error('GitHub Pages는 worker가 없어 정기 실행을 제공하지 않습니다. 실제 서버 앱에서 설정하세요.');
 case 'logout':throw new Error('공개 데모는 로그인 없이 체험합니다. 실제 CEO 비밀번호를 입력하지 마세요.');
 case 'tool.propose':case 'tool.execute':case 'integration.read':throw new Error('공개 데모에서는 외부 서비스에 접근하지 않습니다. 실제 연동은 서버 앱에서 진행하세요.');
 default:throw new Error('공개 데모에서 지원하지 않는 명령입니다');
 }
 s.audit.push(row({action:'demo.'+b.action,target:b.id||'public-demo',actor:'공개 데모 사용자'}));return result;
}
export function demoCommand(b:Item):Item{const s=load();const result=applyDemoCommand(s,b);save(s);return result;}
