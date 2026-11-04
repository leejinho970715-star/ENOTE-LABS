import {all,config} from './db';
export function workerState(){const w=all('settings').find(x=>x.id==='worker');return {online:!!w&&Date.now()-Date.parse(w.heartbeatAt)<20000,heartbeatAt:w?.heartbeatAt||null,pid:w?.pid||null};}
export function liveReadiness(){
 const missing:string[]=[];if(!process.env.OPENAI_API_KEY)missing.push('OPENAI_API_KEY');if(!process.env.OPENAI_MODEL)missing.push('OPENAI_MODEL');
 for(const k of ['INPUT_USD_PER_MILLION','OUTPUT_USD_PER_MILLION','USD_KRW','WEB_SEARCH_USD_PER_CALL'])if(!(Number(process.env[k])>0))missing.push(k);
 if(config().maxOutputTokens<6000)missing.push('설정: 최대 출력 토큰 6000 이상 (TOP 3 보고서)');
 const missingModels=all('agents').filter(a=>a.enabled&&!a.model&&!process.env.OPENAI_MODEL).map(a=>a.id);
 const worker=workerState();return {ready:missing.length===0&&missingModels.length===0&&worker.online&&!config().paused,missing,missingModels,worker};
}
export function errorCode(e:unknown){const s=String(e instanceof Error?e.message:e);if(/예산|토큰|호출 횟수/.test(s))return 'BUDGET_EXCEEDED';if(/401|API 키|인증/.test(s))return 'AUTH_REQUIRED';if(/429|rate.limit/i.test(s))return 'RATE_LIMITED';if(/approval|승인/.test(s))return 'APPROVAL_REQUIRED';if(/timeout|시간 초과|abort/i.test(s))return 'TIMEOUT';if(/검색|출처/.test(s))return 'RESEARCH_FAILED';return 'EXECUTION_FAILED';}
