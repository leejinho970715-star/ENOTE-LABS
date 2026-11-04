import { NextResponse } from 'next/server';
import { all,config,safeError } from '../../../lib/db';
import {liveReadiness} from '../../../lib/readiness';
import { seed,instructions } from '../../../agents/registry';
import { requireCEO } from '../../../auth/session';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{await requireCEO();seed();const tables=['agents','projects','tasks','meetings','messages','approvals','documents','decisions','runs','usage','jobs','audit','executions','schedules','researchSources','researchSearches'] as const;const data=Object.fromEntries(tables.map(t=>[t,all(t)]));
 const integrations=all('integrations').map(i=>({...i,configured:i.id==='github'?!!process.env.GITHUB_TOKEN:i.id==='figma'?!!process.env.FIGMA_TOKEN:!!(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&process.env.GOOGLE_REFRESH_TOKEN)}));
 return NextResponse.json({authenticated:true,...data,integrations,settings:config(),runtime:{apiConfigured:!!process.env.OPENAI_API_KEY,modelConfigured:!!process.env.OPENAI_MODEL,mode:'server',live:liveReadiness()},roles:all('agents').map(a=>({id:a.id,content:instructions(a.id)}))},{headers:{'Cache-Control':'no-store'}});
 }catch(e){const message=safeError(e);return NextResponse.json(message==='UNAUTHORIZED'?{authenticated:false}:{error:message,code:'STATE_UNAVAILABLE'},{status:message==='UNAUTHORIZED'?401:500});}}
