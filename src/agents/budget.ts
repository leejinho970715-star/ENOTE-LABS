import { all,get,insert,update,transaction,config,assertRunning,type Row } from '../lib/db';
export function rates(model=process.env.OPENAI_MODEL||''){let p:any;try{p=JSON.parse(process.env.MODEL_PRICING_JSON||'{}')[model];}catch{throw new Error('MODEL_PRICING_JSON 형식 오류');}if(!p&&model&&process.env.OPENAI_MODEL&&model!==process.env.OPENAI_MODEL)throw new Error('선택한 모델 단가를 MODEL_PRICING_JSON에 설정하세요');const input=Number(p?.input??process.env.INPUT_USD_PER_MILLION),output=Number(p?.output??process.env.OUTPUT_USD_PER_MILLION),fx=Number(process.env.USD_KRW);if (![input,output,fx].every(x=>Number.isFinite(x)&&x>0))throw new Error('실제 모델 단가와 USD/KRW 환율 설정이 필요합니다');return {input,output,fx};}
export function reserve(job:Row,agentId:string,maxKrw:number,mode:string,extra:Record<string,any>={}){return transaction(()=>{
 assertRunning(); const cfg=config(),agent=get('agents',agentId),project=get('projects',job.projectId);
 const month=new Intl.DateTimeFormat('en-CA',{timeZone:cfg.timezone,year:'numeric',month:'2-digit'}).format(new Date());
 const records=all('usage').filter(u=>u.mode==='live'&&u.month===month);
 const sum=(list:Row[])=>list.reduce((s,u)=>s+u.costKrw,0);
 if(all('usage').filter(r=>r.jobId===job.id).reduce((s,u)=>s+(u.requestsReserved||1),0)+(extra.requestsReserved||1)>(job.approvedMaxCalls||cfg.maxCalls))throw new Error('최대 에이전트 호출 횟수 초과');
 if(mode==='live' && (sum(records)+maxKrw>cfg.monthlyBudget ||sum(records.filter(u=>u.agentId===agentId))+maxKrw>agent.budget ||sum(all('usage').filter(u=>u.mode==='live'&&u.projectId===project.id))+maxKrw>project.budget ||sum(all('usage').filter(u=>u.jobId===job.id))+maxKrw>job.spendLimit))throw new Error('예산 한도 초과: 호출을 중단했습니다');
 return insert('usage',{jobId:job.id,projectId:project.id,agentId,mode,month,costKrw:mode==='live'?maxKrw:0,status:'RESERVED',inputTokens:0,outputTokens:0,kind:'ESTIMATE',...extra});
});}
export function settle(id:string,inputTokens:number,outputTokens:number,mode:string,searchCalls=0){const u=get('usage',id);const rate=mode==='live'?(u.rate||rates()):{input:0,output:0,fx:0};return update('usage',id,{inputTokens,outputTokens,searchCalls,costKrw:((inputTokens*rate.input+outputTokens*rate.output)/1000000+searchCalls*(u.searchUsdPerCall||0))*rate.fx,status:'SETTLED'});}
