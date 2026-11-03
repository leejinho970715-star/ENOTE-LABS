import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {validateRegistration,usernameAddress} from '../../../shared/identity.js';
import {screenPassword} from '../../../shared/password-screening.js';
import config from '../../public-config.json' with {type:'json'};
const origins=new Set(['https://enote-labs.vercel.app','https://flownote-studio.vercel.app','https://flow-note-psi.vercel.app','https://agencyflow-studio-dun.vercel.app','http://127.0.0.1:3004','http://127.0.0.1:3005','http://127.0.0.1:3006']);
const errors:Record<string,string>={owner_password_required:'대표 관리자 확인 비밀번호가 일치하지 않습니다. 이전에 지정한 관리자용 비밀번호를 입력하세요.',username_unavailable:'이미 사용 중이거나 사용할 수 없는 아이디입니다.',rate_limited:'가입 요청이 많습니다. 15분 후 다시 시도하세요.',invalid_request:'가입 요청을 확인하지 못했습니다.'};
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';
 const headers={'Content-Type':'application/json','Cache-Control':'no-store',...(origins.has(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})};
 const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
 if(origin&&!origins.has(origin))return reply(403,{error:'허용되지 않은 접속 주소입니다.'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'apikey, content-type'}});
 if(req.method!=='POST')return reply(405,{error:'지원하지 않는 요청입니다.'});
 if(req.headers.get('apikey')!==config.publishableKey)return reply(401,{error:'가입 연결 설정을 확인하세요.'});
 if(Number(req.headers.get('content-length')||0)>4096)return reply(413,{error:'요청이 너무 큽니다.'});
 try{
  const raw=await req.text();if(new TextEncoder().encode(raw).length>4096)return reply(413,{error:'요청이 너무 큽니다.'});
  const body=JSON.parse(raw),input=validateRegistration(body);
  const ownerPassword=typeof body.ownerPassword==='string'?body.ownerPassword:'';
  if(new TextEncoder().encode(ownerPassword).length>72)return reply(400,{error:'관리자 비밀번호 입력 길이를 확인하세요.'});
  const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!key)return reply(503,{error:'가입 서버 설정이 필요합니다.'});
  const server=createClient(Deno.env.get('SUPABASE_URL')!,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown';
  const hmac=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const digest=await crypto.subtle.sign('HMAC',hmac,new TextEncoder().encode(ip));
  const ipHash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  const guard=await server.rpc('enote_username_registration',{p_action:'guard',p_username:input.username,p_ip_hash:ipHash,p_owner_password:ownerPassword});
  if(guard.error)return reply(503,{error:'가입 권한 확인에 실패했습니다. 잠시 후 다시 시도하세요.'});
  if(guard.data.error)return reply(guard.data.error==='rate_limited'?429:400,{error:errors[guard.data.error]||'아이디를 확인하세요.'});
  const passwordState=await screenPassword(input.password);
  if(passwordState==='compromised')return reply(400,{error:'유출 목록에서 발견된 비밀번호입니다. 다른 사이트에서 쓰지 않는 새 비밀번호를 정해 주세요.'});
  if(passwordState==='unavailable')return reply(503,{error:'비밀번호 안전 검사를 완료하지 못했습니다. 가입은 진행되지 않았습니다. 잠시 후 다시 시도해 주세요.'});
  const created=await server.auth.admin.createUser({email:usernameAddress(input.username),password:input.password,email_confirm:true,user_metadata:{display_name:input.name},app_metadata:{enote_login:'username',username:input.username}});
  if(created.error||!created.data.user){
   console.warn('username_create_failed',{code:created.error?.code,status:created.error?.status});
   return reply(400,{error:'가입하지 못했습니다. 아이디 중복 또는 비밀번호 조건을 확인하세요.'});
  }
  const finished=await server.rpc('enote_username_registration',{p_action:'finish',p_username:input.username,p_owner_password:ownerPassword,p_user_id:created.data.user.id});
  if(finished.error||finished.data?.error){
   await server.auth.admin.deleteUser(created.data.user.id);
   return reply(503,{error:'가입 처리를 마무리하지 못했습니다. 잠시 후 다시 시도하세요.'});
  }
  return reply(201,{ok:true,username:input.username});
 }catch(error){return reply(400,{error:error instanceof SyntaxError?'요청 형식을 확인하세요.':error instanceof Error&&/이름|아이디|비밀번호/.test(error.message)?error.message:'가입 요청을 처리하지 못했습니다.'});}
});
