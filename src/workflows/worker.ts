import { all,get,insert,update,transaction,config,safeError,audit } from '../lib/db';
import { seed } from '../agents/registry';
import { createMeeting,runMeeting,runTask } from '../orchestration/engine';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import {executeTool,type Transport} from '../integrations/gateway';
import {errorCode} from '../lib/readiness';
export function heartbeat(){const w=all('settings').find(x=>x.id==='worker');const fields={heartbeatAt:new Date().toISOString(),pid:process.pid};if(w)update('settings','worker',fields);else insert('settings',{id:'worker',...fields});}
export async function runApprovedToolJob(job:ReturnType<typeof get>,send?:Transport){
 if(job.kind!=='tool'||job.payload?.mode!=='live')throw new Error('외부 도구 작업은 LIVE 승인 큐에서만 실행합니다');
 await executeTool(job.approvalId,send);update('jobs',job.id,{status:'COMPLETED'});
 const task=get('tasks',job.taskId);const done=(task.toolApprovalIds||[]).every((id:string)=>all('executions').some(x=>x.approvalId===id&&x.status==='COMPLETED'));
 if(done)update('tasks',task.id,{status:'REVIEW'});
}
export function claim(){return transaction(()=>{
 if(config().paused)return;
 const job=all('jobs').find(j=>j.status==='QUEUED'&&(!j.nextAttemptAt||Date.parse(j.nextAttemptAt)<=Date.now())&&(j.kind!=='task'||get('tasks',j.taskId).dependencies.every((id:string)=>get('tasks',id).status==='COMPLETED')));
 return job?update('jobs',job.id,{status:'RUNNING',startedAt:new Date().toISOString(),leaseUntil:Date.now()+30*60*1000,attempts:job.attempts+1}):undefined;
});}
export function recover(){transaction(()=>{for(const j of all('jobs').filter(j=>j.status==='RUNNING'&&j.leaseUntil<Date.now())){update('jobs',j.id,{status:'NEEDS_REVIEW',error:'작업 실행 중 프로세스가 종료되었습니다. 중복 유료 호출 방지를 위해 CEO 확인이 필요합니다.'});if(j.meetingId)update('meetings',j.meetingId,{status:'NEEDS_REVIEW'});if(j.taskId)update('tasks',j.taskId,{status:'BLOCKED'});audit('job.recovery',j.id);}});}
export function tickSchedules(){transaction(()=>{if(config().paused)return;for(const s of all('schedules').filter(s=>s.enabled&&Date.parse(s.nextRunAt)<=Date.now())){
 createMeeting(s.goal,s.mode,s.spendLimit,`schedule:${s.id}:${s.nextRunAt}`);update('schedules',s.id,{lastRunAt:s.nextRunAt,nextRunAt:new Date(Date.now()+s.intervalHours*3600000).toISOString()});
 }});}
export async function tick(){seed();heartbeat();recover();tickSchedules();const job=claim();if(!job)return false;
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(new Error('작업 최대 시간 초과')),20*60*1000);const pause=setInterval(()=>{if(config().paused)controller.abort(new Error('CEO 긴급 중지'));},500);const beat=setInterval(heartbeat,5000);
 try{if(job.kind==='meeting')await runMeeting(job,undefined,controller.signal);else if(job.kind==='tool'){
  await runApprovedToolJob(job);
 }else await runTask(job,undefined,controller.signal);}
 catch(e){const code=errorCode(e);update('jobs',job.id,{status:'FAILED',failureCode:code,error:safeError(e)});if(job.meetingId)update('meetings',job.meetingId,{status:'FAILED',failureCode:code,error:safeError(e),activeAgent:null});if(job.taskId)update('tasks',job.taskId,{status:job.kind==='tool'?'BLOCKED':'FAILED',failureCode:code,error:safeError(e)});audit('job.failed',job.id,{code,error:safeError(e)});}
 finally{clearTimeout(timer);clearInterval(pause);clearInterval(beat);}return true;
}
const entry=resolve(process.argv[1]||'');
const self=fileURLToPath(import.meta.url);
if(process.platform==='win32'?entry.toLowerCase()===self.toLowerCase():entry===self){
 seed();console.log('AI UNIVERSE worker 시작. 유료 실행은 CEO 승인 이후에만 진행합니다.');
 let stopping=false;process.on('SIGINT',()=>stopping=true);process.on('SIGTERM',()=>stopping=true);
 while(!stopping){await tick();await new Promise(r=>setTimeout(r,1500));}
}
