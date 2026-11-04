import {insert,all,type Row} from '../lib/db';
export type ResearchTrace={sources:{url:string;title:string}[];searches:number;responseIds:string[]};
export function extractResearch(responses:any[]):ResearchTrace{
 const urls=new Map<string,string>();let searches=0;const responseIds:string[]=[];
 const seenCalls=new Set<string>();
 const visit=(x:any)=>{if(!x||typeof x!=='object')return;
  if(x.type==='web_search_call'||x.name==='web_search_call') {const id=x.id||JSON.stringify(x);if(!seenCalls.has(id)){seenCalls.add(id);searches++;}}
  if(typeof x.url==='string'){try{const u=new URL(x.url);if(['https:','http:'].includes(u.protocol)&&!u.username&&!u.password)urls.set(u.href,typeof x.title==='string'?x.title:u.hostname);}catch{}}
  for(const [key,v] of Object.entries(x))if(key!=='text'&&key!=='arguments') {if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);}
 };
 for(const r of responses){if(r.responseId)responseIds.push(r.responseId);visit(r.output);if(Array.isArray(r.output))r.output.forEach(visit);}
 return {sources:[...urls].map(([url,title])=>({url,title})),searches,responseIds};
}
export function saveResearch(job:Row,runId:string,agentId:string,trace:ResearchTrace,claimed:any[]=[]){
 const observed=new Map(trace.sources.map(s=>[s.url,s.title]));
 const merged=new Map<string,any>();for(const s of trace.sources)merged.set(s.url,{...s,claim:'',assessment:'UNCHECKED'});
 for(const s of claimed){try{const u=new URL(s.url);if(!['https:','http:'].includes(u.protocol))continue;merged.set(u.href,{...s,url:u.href});}catch{}}
 for(const s of merged.values())insert('researchSources',{...s,jobId:job.id,runId,meetingId:job.meetingId||null,projectId:job.projectId,agentId,mode:job.payload.mode,verification:observed.has(s.url)?'RETRIEVED':'UNVERIFIED',retrievedAt:observed.has(s.url)?new Date().toISOString():null,truthVerified:false});
 insert('researchSearches',{jobId:job.id,runId,agentId,mode:job.payload.mode,searchCalls:trace.searches,responseIds:trace.responseIds,status:trace.searches?'SEARCH_COMPLETED':'NO_SEARCH',sourceCount:trace.sources.length});
}
export function sourcesFor(projectId:string){return all('researchSources').filter(s=>s.projectId===projectId&&s.mode==='live');}
