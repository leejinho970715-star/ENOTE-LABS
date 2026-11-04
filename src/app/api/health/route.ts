import {NextResponse} from 'next/server';
import {seed} from '../../../agents/registry';
import {workerState} from '../../../lib/readiness';
export const runtime='nodejs';export const dynamic='force-dynamic';
export function GET(){try{seed();return NextResponse.json({ok:true,service:'ai-universe-server',worker:workerState().online?'ONLINE':'OFFLINE'},{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({ok:false,service:'ai-universe-server',error:'DATABASE_UNAVAILABLE'},{status:503});}}
