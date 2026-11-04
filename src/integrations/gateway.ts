import { z } from 'zod';
import { all,get,insert,update,audit,assertRunning,safeError,transaction } from '../lib/db';
import { consumeApproval,requestApproval } from '../approvals/service';
const text=z.string().min(1).max(20000), segment=z.string().regex(/^[\w.@-]+$/), repo=z.string().regex(/^[\w.-]+\/[\w.-]+$/);
const schemas={
 'github.issue':z.object({repo,title:text,body:text}).strict(),
 'github.branch':z.object({repo,branch:z.string().regex(/^codex\/[a-z0-9-]+$/),sha:z.string().regex(/^[a-f0-9]{40}$/)}).strict(),
 'github.pr':z.object({repo,title:text,body:text,head:z.string().regex(/^codex\/[a-z0-9-]+$/),base:segment}).strict(),
 'gmail.draft':z.object({to:z.email(),subject:text,body:text,purpose:text}).strict(),
 'gmail.send':z.object({to:z.email(),subject:text,body:text,purpose:text}).strict(),
 'calendar.create':z.object({calendarId:segment,summary:text,description:text,start:z.iso.datetime({offset:true}),end:z.iso.datetime({offset:true}),timeZone:z.string().min(1)}).strict(),
 'figma.comment':z.object({fileKey:z.string().regex(/^[a-zA-Z0-9]+$/),message:text}).strict()
};
export type Operation=keyof typeof schemas;
const allowed:Record<string,string[]>={cto:['github.issue','github.branch','github.pr','figma.comment'],cpo:['figma.comment'],cmo:['gmail.draft','gmail.send'],coo:['gmail.draft','gmail.send','calendar.create']};
export function validateOperation(operation:string,payload:unknown,agentId:string){if(!(operation in schemas)||!allowed[agentId]?.includes(operation))throw new Error('지원되지 않거나 역할에 허용되지 않은 작업입니다');if(!get('agents',agentId).enabled)throw new Error('비활성 에이전트의 도구 실행은 차단됩니다');const p=(schemas[operation as Operation] as z.ZodType).parse(payload) as any;
 if(operation==='calendar.create'){new Intl.DateTimeFormat('ko',{timeZone:p.timeZone});if(Date.parse(p.end)<=Date.parse(p.start))throw new Error('일정 종료는 시작 이후여야 합니다');}
 if(operation.startsWith('gmail.')&&/[\r\n]/.test(p.subject))throw new Error('메일 제목 줄바꿈 금지');return p;}
export function proposeTool(operation:string,payload:unknown,agentId:string){const normalized=validateOperation(operation,payload,agentId);return requestApproval('tool',operation,normalized,agentId);}
let googleCache:{token:string;expires:number}|undefined;
async function googleToken(){if(googleCache&&googleCache.expires>Date.now())return googleCache.token;
 if(!process.env.GOOGLE_CLIENT_ID||!process.env.GOOGLE_CLIENT_SECRET||!process.env.GOOGLE_REFRESH_TOKEN)throw new Error('Google OAuth 인증 필요');
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,refresh_token:process.env.GOOGLE_REFRESH_TOKEN,grant_type:'refresh_token'}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Google 토큰 갱신 실패: 재인증이 필요합니다');const json=await response.json();googleCache={token:json.access_token,expires:Date.now()+Math.max(0,json.expires_in-120)*1000};return googleCache.token;
}
export type Transport=(service:string,path:string,method:string,payload?:unknown)=>Promise<any>;
export const transport:Transport=async(service,path,method,payload)=>{
 const hosts:Record<string,string>={github:'https://api.github.com',gmail:'https://gmail.googleapis.com',calendar:'https://www.googleapis.com',figma:'https://api.figma.com'};
 if(!hosts[service]||!path.startsWith('/'))throw new Error('허용되지 않은 서비스');
 const token=service==='github'?process.env.GITHUB_TOKEN:service==='figma'?process.env.FIGMA_TOKEN:await googleToken();if(!token)throw new Error('서비스 인증정보를 설정하세요');
 const headers:Record<string,string>={'Content-Type':'application/json'};
 if(service==='figma')headers['X-Figma-Token']=token;else headers.Authorization=`Bearer ${token}`;
 const r=await fetch(hosts[service]+path,{method,headers,body:payload===undefined?undefined:JSON.stringify(payload),signal:AbortSignal.timeout(20000),redirect:'error'});
 if(!r.ok)throw new Error(`외부 API ${r.status}: ${r.status===403?'권한 부족':r.status===401?'인증 필요':'요청 실패'}`);
 return r.status===204?{}:r.json();
};
export async function readService(service:string,query:Record<string,string>={},send:Transport=transport){
 assertRunning();if(get('integrations',service).disabled)throw new Error('연결 해제된 서비스입니다');
 let path='';const enc=encodeURIComponent;
 if(service==='github')path=query.repo?`/repos/${repo.parse(query.repo)}/${['branches','issues','pulls','commits'].includes(query.resource)?query.resource:'issues'}?per_page=30`:'/user/repos?per_page=30';
 if(service==='gmail')path=query.id?`/gmail/v1/users/me/messages/${enc(segment.parse(query.id))}?format=full`:`/gmail/v1/users/me/messages?maxResults=20&q=${enc(query.q||'')}`;
 if(service==='calendar')path=`/calendar/v3/calendars/${enc(query.calendarId||'primary')}/events?maxResults=30&singleEvents=true&orderBy=startTime&timeMin=${enc(new Date().toISOString())}`;
 if(service==='figma')path=query.fileKey?`/v1/files/${segment.parse(query.fileKey)}?depth=2`:'/v1/me';
 if(!path)throw new Error('알 수 없는 서비스');
 try{const result=await send(service,path,'GET');update('integrations',service,{status:'CONNECTED',verifiedAt:new Date().toISOString(),error:null});audit('integration.read',service);return result;}
 catch(e){const msg=safeError(e);update('integrations',service,{status:msg.includes('403')?'INSUFFICIENT_PERMISSIONS':msg.includes('인증')?'AUTH_REQUIRED':'ERROR',error:msg});throw new Error(msg);}
}
function mime(p:any){return Buffer.from(`To: ${p.to}\r\nSubject: =?UTF-8?B?${Buffer.from(p.subject).toString('base64')}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(p.body).toString('base64')}`).toString('base64url');}
export async function executeTool(approvalId:string,send:Transport=transport){
 const a=get('approvals',approvalId);const p=validateOperation(a.target,a.payload,a.agentId);const service=a.target.split('.')[0];if(get('integrations',service).disabled)throw new Error('연결 해제된 서비스입니다');
 const execution=transaction(()=>{consumeApproval(a.id,'tool',a.target,p,a.agentId);return insert('executions',{approvalId:a.id,operation:a.target,agentId:a.agentId,status:'RUNNING',hash:a.hash});});
 audit('tool.before',execution.id,{approvalId:a.id,operation:a.target});
 try{assertRunning();let path='',body:any;
 switch(a.target){
 case 'github.issue':path=`/repos/${p.repo}/issues`;body={title:p.title,body:p.body};break;
 case 'github.branch':path=`/repos/${p.repo}/git/refs`;body={ref:`refs/heads/${p.branch}`,sha:p.sha};break;
 case 'github.pr':path=`/repos/${p.repo}/pulls`;body={title:p.title,body:p.body,head:p.head,base:p.base,draft:true};break;
 case 'gmail.draft':path='/gmail/v1/users/me/drafts';body={message:{raw:mime(p)}};break;
 case 'gmail.send':path='/gmail/v1/users/me/messages/send';body={raw:mime(p)};break;
 case 'calendar.create':path=`/calendar/v3/calendars/${encodeURIComponent(p.calendarId)}/events`;body={summary:p.summary,description:p.description,start:{dateTime:p.start,timeZone:p.timeZone},end:{dateTime:p.end,timeZone:p.timeZone}};break;
 case 'figma.comment':path=`/v1/files/${p.fileKey}/comments`;body={message:p.message};break;
 default:throw new Error('지원되지 않는 작업');}
 const result=await send(service,path,'POST',body);update('executions',execution.id,{status:'COMPLETED',externalId:result.id||result.number||result.ref||null,url:result.html_url||result.htmlLink||null});audit('tool.after',execution.id,{status:'COMPLETED'});return {executionId:execution.id,externalId:result.id||result.number||null};
 }catch(e){update('executions',execution.id,{status:'UNKNOWN',error:safeError(e)});audit('tool.after',execution.id,{status:'UNKNOWN'});throw e;}
}
