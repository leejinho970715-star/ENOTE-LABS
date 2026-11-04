import type {Row} from '../lib/db';
const brief=(s:any,n=250)=>String(s||'').slice(0,n);
export function meetingContext(messages:Row[]){return messages.map(m=>({
 agentId:m.agentId,phase:m.phase,summary:brief(m.summary,500),abridged:true,
 sources:(m.sources||[]).slice(0,4).map((s:any)=>({url:s.url,title:brief(s.title,100),claim:brief(s.claim,150)})),
 opportunities:(m.opportunities||[]).slice(0,3).map((o:any)=>({...o,name:brief(o.name,100),customer:brief(o.customer,100),problem:brief(o.problem,150),scoreRationale:brief(o.scoreRationale,200),revenueModel:brief(o.revenueModel,150),demandEvidence:o.demandEvidence.slice(0,4),risks:o.risks.slice(0,3).map((s:string)=>brief(s,100)),strategy:o.strategy.slice(0,3).map((s:string)=>brief(s,100)),validationTasks:o.validationTasks.slice(0,3).map((s:string)=>brief(s,100)),economics:{...o.economics,assumptions:o.economics.assumptions.slice(0,3).map((s:string)=>brief(s,100))}})),
 reviews:(m.reviews||[]).slice(0,2).map((r:any)=>({...r,claim:brief(r.claim,150),reason:brief(r.reason,250),sourceUrls:r.sourceUrls.slice(0,3)})),dissent:(m.dissent||[]).slice(0,2).map((s:string)=>brief(s,150))
}));}
