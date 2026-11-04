import { Agent } from '@openai/agents';
import {baseOutputSchema,liveOutputSchema,type AgentOutput} from './contracts';
import {createLiveExecutor,liveAgent,researchPhase,maxTurnsFor} from './live-executor';
import {saveResearch,type ResearchTrace} from './research';
import { instructions } from './registry';
import { all, get, insert, update, config, assertRunning, safeError, type Row } from '../lib/db';
import { reserve,settle,rates } from './budget';
export const outputSchema=baseOutputSchema;
export type {AgentOutput} from './contracts';
export type Execute = (agent: Agent<any,any>,input:string,phase:string,agentId:string,signal:AbortSignal)=>Promise<{output:AgentOutput,inputTokens:number,outputTokens:number,research?:ResearchTrace,modelRequests?:number}>;
export const mock:Execute=async(_agent,_input,phase,id)=>{
 const opinions:Record<string,string>={cso:'대표님, 전략을 맡은 서연입니다. 먼저 고객이 반복해서 겪는 문제와 기존 대안을 확인하면 좋겠습니다. 시장 규모와 수익성은 아직 조사 전이니, 가설과 검증 항목을 나눠 정리하겠습니다.',cpo:'유나입니다. 서연님이 제안한 고객 검증을 바탕으로, 가장 자주 반복되는 업무 하나를 MVP의 중심에 두고 싶어요. 사용자 흐름과 인수 조건까지 문서로 연결하겠습니다.',cto:'기술 담당 다은입니다. MVP는 실제로 검증할 수 있는 작은 범위로 시작하겠습니다. 인증, 데이터 보관, 테스트 기준을 설계하고 구현 전 확인해야 할 위험을 분리해 보고드릴게요.',cmo:'하린입니다. 기능을 많이 소개하기보다 고객의 어떤 시간을 줄여주는지 선명하게 전달하고 싶어요. 제품 범위가 정리되면 포지셔닝과 사전 콘텐츠 초안을 준비하겠습니다. 게시나 발송은 대표님 승인 후 진행할게요.',coo:'수빈입니다. 시장 검증 → 제품 범위 → 기술 검토 → 마케팅 준비 순서로 의존성을 정리하겠습니다. 확정 일정은 아직 잡지 않고, 각 업무의 완료 조건과 차단 요인을 먼저 확인하겠습니다.'};
 const debate:Record<string,string>={cso:'유나님, 핵심 업무 하나에 집중하는 방향에 동의합니다. 다만 고객 인터뷰 없이 문제의 우선순위를 확정하면 위험해요. MVP 범위는 검증 전 가설로 남기는 것을 제안합니다.',cpo:'다은님, 작은 범위로 시작하는 데 동의해요. 기술 구현의 편의만으로 기능을 정하지 않도록 사용자 성공 기준도 함께 넣겠습니다. 서연님의 검증 결과에 따라 범위를 조정할 수 있게 하죠.',cto:'유나님, 사용자 성공 기준을 테스트 가능한 조건으로 바꾸겠습니다. 하린님이 제안한 메시지도 실제 기능이 확인된 범위에서 작성하면 좋겠어요. 개발과 배포는 구분하고 배포 승인을 따로 받겠습니다.',cmo:'다은님 의견에 동의해요. 아직 구현하거나 검증하지 않은 기능은 확정된 약속처럼 표현하지 않겠습니다. 서연님의 고객 가설과 유나님의 MVP 흐름이 먼저 정리되면 메시지를 맞추겠습니다.',coo:'의견을 종합하면 고객 검증과 MVP 인수 조건이 선행되어야 합니다. 출시 날짜를 지금 확정하는 데는 이견이 있어요. 지안님, 이 점을 미해결 항목으로 남기고 대표님께 결정 요청을 올려주세요.'};
 const summary=phase==='plan'?'대표님, 지안입니다. 이번 안건은 전략·제품·기술·마케팅·운영이 모두 연결되어 있어 다섯 임원을 소집하겠습니다. 먼저 독립 의견을 받고, 서로의 가정을 검토한 뒤 업무와 승인 사항을 정리해드릴게요.':phase==='synthesis'?'대표님, 지안입니다. 임원진은 고객 문제 검증부터 시작하고, MVP·기술·마케팅·일정 초안을 순서대로 연결하는 데 의견을 모았습니다. 출시 일정과 시장성은 아직 미검증이며 이견으로 남겼습니다. 아래 다섯 업무의 배분을 승인해주시면 내부 초안을 준비하겠습니다.':phase==='task'?`${opinions[id]||'담당 업무의 내부 초안을 준비하겠습니다.'}\n\n예시 산출물: 목표와 가정, 필요한 근거, 완료 조건, 위험, 다음 검증 단계를 구분합니다. 실제 조사나 코드 실행은 수행하지 않은 검증용 예시입니다.`:phase==='debate'?debate[id]:opinions[id];
 return {inputTokens:0,outputTokens:0,output:{summary:`[MOCK · 예시 대화 / 실제 AI 아님]\n${summary}`,evidence:['검증용 고정 예시: 실제 고객 조사·시장 조사·AI 호출·코드 실행 미수행'],dissent:phase==='debate'?['검증 전 출시 일정 확정에 반대하며 고객 검증을 먼저 요구합니다.']:[],participants:phase==='plan'?['cso','cpo','cto','cmo','coo']:[],tasks:phase==='synthesis'?['cso','cpo','cto','cmo','coo'].map((a,i)=>({title:`${a} 출시 계획 초안`,description:'Mock 테스트 산출물 작성',agentId:a,acceptanceCriteria:'가정과 인수 조건을 명시한 내부 문서',dependsOn:i?[`${['cso','cpo','cto','cmo','coo'][i-1]} 출시 계획 초안`]:[]})):[]}};
};
export async function callAgent(job:Row,agentId:string,phase:string,input:unknown,execute?:Execute,signal=AbortSignal.timeout(120000)) {
 assertRunning(); const key=`${job.id}:${phase}:${agentId}`; const cached=all('runs').find(r=>r.key===key);
 if(cached){if(cached.status==='COMPLETED')return cached.output as AgentOutput;throw new Error('이전 호출의 결과가 불확실합니다. 비용과 실행 기록을 확인하고 새 회의를 생성하세요.');}
 const agentData=get('agents',agentId); if(!agentData.enabled)throw new Error('비활성화된 에이전트입니다');
 const cfg=config(),mode=job.payload.mode,system=instructions(agentId);const inputText=JSON.stringify(input);
 if(!['mock','live'].includes(mode))throw new Error('실행 모드가 명확하지 않습니다');
 if(inputText.length>cfg.maxInputChars)throw new Error('입력 길이 제한 초과: 회의/지식 문서를 줄이세요');
 const model=agentData.model||process.env.OPENAI_MODEL;
 if(mode==='live'&&(!process.env.OPENAI_API_KEY||!model))throw new Error('OpenAI API 키 및 에이전트 모델을 설정하세요');
 const agent=mode==='live'?liveAgent(agentId,model!,system,phase,job.id,signal,cfg.maxOutputTokens):new Agent({name:agentId,instructions:system,model:'mock-only',outputType:outputSchema});
 // UTF-8 byte count + schema overhead is a conservative input-token ceiling.
 const rate=mode==='live'?rates(model):{input:0,output:0,fx:0},search=mode==='live'&&researchPhase(phase),turns=mode==='live'?maxTurnsFor(phase):1;
 const searchUsdPerCall=search?Number(process.env.WEB_SEARCH_USD_PER_CALL):0;
 if(search&&!(searchUsdPerCall>0))throw new Error('웹 검색 단가 WEB_SEARCH_USD_PER_CALL을 설정하세요');
 const tokenReserve=search?Number(process.env.SEARCH_TOKEN_RESERVE||128000):0;
 if(search&&(!Number.isFinite(tokenReserve)||tokenReserve<128000))throw new Error('검색 토큰 예약은 최소 128000이어야 합니다');
 const ceiling=(((Buffer.byteLength(system+inputText,'utf8')+16000+tokenReserve+turns*12000)*turns*rate.input+cfg.maxOutputTokens*turns*rate.output)/1e6+searchUsdPerCall)*rate.fx;
 const usage=reserve(job,agentId,ceiling,mode,{rate,searchUsdPerCall,requestsReserved:turns});
 const run=insert('runs',{key,jobId:job.id,projectId:job.projectId,meetingId:job.meetingId||null,agentId,phase,mode,model:mode==='live'?model:null,status:'RUNNING',usageId:usage.id});update('agents',agentId,{status:'RUNNING'});
 try {const result=await (execute||(mode==='mock'?mock:createLiveExecutor()))(agent,inputText,phase,agentId,signal);assertRunning();const output:AgentOutput=mode==='live'?liveOutputSchema.parse(result.output):outputSchema.parse(result.output);
 const trace=result.research||{sources:[],searches:0,responseIds:[]};
 if(mode==='live')saveResearch(job,run.id,agentId,trace,output.sources||[]);
 settle(usage.id,result.inputTokens,result.outputTokens,mode,trace.searches);
 if(search&&(trace.searches===0||trace.sources.length===0))throw new Error('실제 검색 출처가 수집되지 않았습니다. 조사 성공으로 처리하지 않습니다.');
 update('runs',run.id,{status:'COMPLETED',output,responseIds:trace.responseIds,modelRequests:result.modelRequests||1,searchCalls:trace.searches});return output;}
 catch(e){update('runs',run.id,{status:'FAILED',error:safeError(e)});throw e;}
 finally{update('agents',agentId,{status:'IDLE'});}
}
