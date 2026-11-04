import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { assertOrigin,requireCEO,verifyPassword,issueSession } from '../../../auth/session';
import { all,get,insert,update,config,audit,safeError,transaction } from '../../../lib/db';
import { seed } from '../../../agents/registry';
import { createMeeting,queueTasks,completeTask } from '../../../orchestration/engine';
import { decide,consumeApproval } from '../../../approvals/service';
import { executeTool,readService,proposeTool } from '../../../integrations/gateway';
import {liveReadiness,errorCode} from '../../../lib/readiness';
export const runtime='nodejs';export const dynamic='force-dynamic';
let attempts:{count:number;until:number}={count:0,until:0};
const id=z.string().min(1).max(200),positive=z.number().positive().max(100000000);
export async function POST(req:Request){try{
 assertOrigin(req);if(Number(req.headers.get('content-length')||0)>100000)throw new Error('요청이 너무 큽니다');const raw=await req.text();if(raw.length>100000)throw new Error('요청이 너무 큽니다');const b=JSON.parse(raw);
 if(b.action==='login'){
  if(attempts.until>Date.now()&&attempts.count>=5)return NextResponse.json({error:'로그인 시도가 많습니다. 10분 후 다시 시도하세요.'},{status:429});
  if(!verifyPassword(z.string().max(200).parse(b.password))){attempts={count:attempts.until>Date.now()?attempts.count+1:1,until:Date.now()+600000};throw new Error('비밀번호가 올바르지 않거나 초기 설정이 필요합니다');}
  attempts={count:0,until:0};(await cookies()).set('ai-universe-session',issueSession(),{httpOnly:true,sameSite:'strict',secure:process.env.APP_ORIGIN?.startsWith('https://')||new URL(req.url).protocol==='https:',path:'/',maxAge:8*3600});return NextResponse.json({ok:true});
 }
 await requireCEO();seed();let result:unknown={ok:true};
 switch(b.action){
 case 'logout':(await cookies()).delete('ai-universe-session');break;
 case 'meeting':{const mode=z.enum(['live','mock']).parse(b.mode);if(mode==='live'){const r=liveReadiness();if(!r.ready)throw new Error('LIVE 시작 불가: '+[...r.missing,...r.missingModels.map(x=>'모델 '+x),...(!r.worker.online?['worker 중지']:[]),...(config().paused?['CEO 긴급 중지']:[])].join(', '));}result=createMeeting(z.string().min(1).max(4000).parse(b.goal),mode,positive.parse(b.spendLimit),id.parse(b.key));break;}
 case 'pause':result=update('settings','company',{paused:z.boolean().parse(b.paused)});audit('company.pause','company',{paused:b.paused});break;
 case 'decide':{
 const decision=z.enum(['APPROVED','REJECTED','CHANGES_REQUESTED']).parse(b.decision);const a=get('approvals',id.parse(b.id));
 result=transaction(()=>{const r=decide(a.id,decision,z.string().max(2000).parse(b.note||''));if(a.kind==='decision'&&decision==='APPROVED'){consumeApproval(a.id,'decision',a.target,a.payload,a.agentId);queueTasks(a.target);}else if(a.kind==='decision'){update('decisions',a.target,{status:decision});}return r;});break;}
 case 'tool.propose':result=proposeTool(id.parse(b.operation),b.payload,id.parse(b.agentId));break;
 case 'tool.execute':result=await executeTool(id.parse(b.id));break;
 case 'integration.read':result=await readService(z.enum(['github','gmail','calendar','figma']).parse(b.service),z.record(z.string(),z.string().max(500)).parse(b.query||{}));break;
 case 'integration.disconnect':result=update('integrations',z.enum(['github','gmail','calendar','figma']).parse(b.service),{disabled:z.boolean().parse(b.disabled),status:'DISCONNECTED',verifiedAt:null});audit('integration.toggle',b.service,{disabled:b.disabled});break;
 case 'document':{const d=z.object({id,content:z.string().max(60000),version:z.number().int()}).parse(b);result=update('documents',d.id,{content:d.content},d.version);audit('document.updated',d.id);break;}
 case 'settings':{const data=z.object({monthlyBudget:positive,maxOutputTokens:z.number().int().min(256).max(8000),maxInputChars:z.number().int().min(2000).max(48000),maxRounds:z.number().int().min(1).max(2),maxCalls:z.number().int().min(3).max(30),timezone:z.string()}).parse(b.settings);new Intl.DateTimeFormat('ko',{timeZone:data.timezone});result=update('settings','company',data);audit('settings.updated','company');break;}
 case 'agent':{const data=z.object({name:z.string().min(1).max(80),title:z.string().min(1).max(80),department:z.string().min(1).max(80),manager:id,model:z.string().max(100),budget:positive,enabled:z.boolean()}).parse(b.agent);if(data.manager===b.id)throw new Error('자기 자신을 상급자로 지정할 수 없습니다');if(data.manager!=='CEO')get('agents',data.manager);result=update('agents',id.parse(b.id),data);audit('agent.updated',b.id);break;}
 case 'project':result=update('projects',id.parse(b.id),{budget:positive.parse(b.budget)});break;
 case 'task.complete':result=completeTask(id.parse(b.id));break;
 case 'schedule':{const s=z.object({name:z.string().min(1).max(80),goal:z.string().min(1).max(4000),mode:z.enum(['live','mock']),spendLimit:positive,intervalHours:z.number().min(1).max(8760),nextRunAt:z.iso.datetime({offset:true})}).parse(b.schedule);result=insert('schedules',{...s,enabled:true});audit('schedule.created',(result as any).id);break;}
 case 'schedule.toggle':result=update('schedules',id.parse(b.id),{enabled:z.boolean().parse(b.enabled)});break;
 default:throw new Error('지원하지 않는 명령');}
 return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(e){const error=safeError(e);return NextResponse.json({error,code:errorCode(e)},{status:error==='UNAUTHORIZED'?401:400});}}
