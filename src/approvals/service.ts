import { createHash } from 'node:crypto';
import { all, get, insert, update, transaction, audit, assertRunning, type Row } from '../lib/db';
function canonical(x: any): string { if (Array.isArray(x)) return '['+x.map(canonical).join(',')+']'; if(x && typeof x==='object') return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}'; return JSON.stringify(x); }
export function digest(x:unknown){return createHash('sha256').update(canonical(x)).digest('hex');}
export function requestApproval(kind:string,target:string,payload:unknown,agentId:string) {
 return insert('approvals',{kind,target,payload,agentId,hash:digest({kind,target,payload,agentId}),status:'PENDING',expiresAt:new Date(Date.now()+24*3600000).toISOString()});
}
export function decide(id:string,decision:'APPROVED'|'REJECTED'|'CHANGES_REQUESTED',note:string) {
 return transaction(()=>{const a=get('approvals',id); if(a.status!=='PENDING')throw new Error('이미 결정된 승인입니다'); if(Date.parse(a.expiresAt)<Date.now())throw new Error('승인 요청이 만료되었습니다');
 const result=update('approvals',id,{status:decision,note,decidedBy:'CEO',decidedAt:new Date().toISOString()}); audit('approval.'+decision,id,{hash:a.hash});
 if(a.kind==='ai_budget') {
  const job=get('jobs',a.target);
  if(decision==='APPROVED')update('jobs',job.id,{status:'QUEUED',approvedHash:a.hash,approvedPayloadHash:digest(job.payload),spendLimit:a.payload.spendLimit,approvedMaxCalls:a.payload.maxCalls});
  else update('jobs',job.id,{status:'CANCELLED'});
 }
 if(a.kind==='tool'&&a.taskId){
  if(decision==='APPROVED')insert('jobs',{key:'tool:'+a.id,kind:'tool',approvalId:a.id,taskId:a.taskId,projectId:a.projectId,status:'QUEUED',payload:{mode:'live'},attempts:0});
  else update('tasks',a.taskId,{status:'BLOCKED',error:decision==='REJECTED'?'CEO가 외부 작업을 반려했습니다':'외부 작업 수정 요청: 새 업무 또는 작업 제안이 필요합니다'});
 }
 return result;});
}
export function consumeApproval(id:string,kind:string,target:string,payload:unknown,agentId:string):Row {
 assertRunning();
 return transaction(()=>{const a=get('approvals',id);
  if(a.status!=='APPROVED'||Date.parse(a.expiresAt)<Date.now()||a.hash!==digest({kind,target,payload,agentId}))throw new Error('CEO 승인 없거나 작업 범위가 변경되었습니다');
  update('approvals',id,{status:'CONSUMED',consumedAt:new Date().toISOString()}); audit('approval.consumed',id,{hash:a.hash}); return a;
 });
}
export function approvedJob(job:Row) { const a=all('approvals').find(a=>a.target===job.id&&a.kind==='ai_budget'&&a.hash===job.approvedHash); if(!a||!['APPROVED','CONSUMED'].includes(a.status)||job.approvedPayloadHash!==digest(job.payload))throw new Error('회의 실행에 대한 CEO 예산 승인이 필요합니다'); if(a.status==='APPROVED')consumeApproval(a.id,'ai_budget',job.id,a.payload,'chief-of-staff'); }
