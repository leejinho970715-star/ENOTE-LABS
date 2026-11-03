import {noticeHTML} from '../../shared/service-notice.js';
import {accountLabel,loginAddress,normalizeUsername,OWNER_USERNAME,registerUsername} from '../../shared/identity.js';
import {createClient} from '@supabase/supabase-js';
import {escapeHTML as e} from './core.js';
import {mountCloudReports} from './cloud-reports.js';
const root=document.querySelector('#account-root'),message=document.querySelector('#account-message');
root.insertAdjacentHTML('beforebegin',noticeHTML());
const sameOriginSuite=location.pathname.startsWith('/flownote/');
let client,publicConfig,user=null,companyId=new URLSearchParams(location.search).get('company')||'',busy=false,loginMode=!new URLSearchParams(location.search).has('signup'),generation=0;
const input=(name,label,type='text',extra='')=>`<label>${label}<input name="${name}" type="${type}" required ${extra}></label>`;
const say=(text,error=false)=>{
 const local=root.querySelector('#auth-message');
 message.textContent=local?'':text;message.classList.toggle('cloud-error',error);
 if(local){local.textContent=text;local.classList.toggle('cloud-error',error);local.hidden=!text;if(error){local.focus({preventScroll:true});local.scrollIntoView({block:'nearest',behavior:'smooth'});}}
};
const readableError=error=>({email_address_not_authorized:'일반 고객용 가입 메일 서비스가 아직 연결되지 않았습니다. 현재 프로젝트 조직 구성원 주소로만 개발 검증할 수 있습니다.',over_email_send_rate_limit:'가입 메일 발송 한도에 도달했습니다. 잠시 후 다시 시도하세요.',invalid_credentials:'아이디와 비밀번호를 확인하세요.',email_not_confirmed:'메일함에서 이메일 확인을 완료한 뒤 로그인하세요.',unexpected_failure:'인증 요청을 처리하지 못했습니다. 잠시 후 다시 시도하세요.'}[error.code]||error.message||'처리하지 못했습니다.');
function authView(){root.innerHTML=`<div class="account-grid"><section class="card"><h2>${loginMode?'로그인':'회원가입'}</h2><form id="auth">${loginMode?'':input('name','이름 (닉네임 가능)','text','maxlength="80" autocomplete="name"')}${input('username','아이디','text',loginMode?'maxlength="254" autocomplete="username"':'maxlength="24" pattern="[a-zA-Z][a-zA-Z0-9_]{3,23}" autocomplete="username"')}${loginMode?'':'<small>영문 소문자로 시작하는 4~24자 · 영문·숫자·밑줄</small>'}${input('password',loginMode?'비밀번호':'비밀번호 (10자 이상)','password',`${loginMode?'':'minlength="10"'} maxlength="128" autocomplete="${loginMode?'current-password':'new-password'}"`)}${loginMode?'':'<div id="owner-signup-field" hidden><label>대표 관리자 확인 비밀번호<input name="ownerPassword" type="password" autocomplete="off" disabled maxlength="72"></label><small>대표 전용 아이디는 기존 관리자 비밀번호로 확인합니다.</small></div>'}<button class="button primary">${loginMode?'로그인':'가입하고 시작하기'}</button><p id="auth-message" role="alert" tabindex="-1" hidden></p></form><button class="quiet" data-action="switch">${loginMode?'처음이라면 회원가입':'계정이 있다면 로그인'}</button></section><aside class="card"><h2>회사별로 따로 보관합니다.</h2><p class="hint">이메일 인증 없이 사용할 수 있습니다. 비밀번호는 인증 서버가 관리하며, 회사에 속한 회원만 해당 회사 자료에 접근합니다.</p><p class="hint">기존 이메일 계정은 이메일과 비밀번호로 로그인할 수 있습니다. 비밀번호를 잊었다면 운영자에게 계정 복구를 문의하세요.</p></aside></div>`;}
async function result(query){const{data,error}=await query;if(error)throw error;return data;}
async function command(action,payload){return result(client.rpc('flownote_command',{p_action:action,p_payload:payload}));}
async function refresh(){
 const ticket=++generation;
 root.innerHTML='<section class="card"><p>로그인과 회사 자료를 확인하고 있습니다.</p><button class="button outline" data-action="reload">다시 불러오기</button></section>';
 const response=await client.auth.getUser();if(response.error&&!response.error.message.includes('Auth session missing')){user=null;companyId='';authView();throw response.error;}
 user=response.data.user;
 if(!user){companyId='';authView();return;}
 const companies=await result(client.from('companies').select('id,name').order('created_at'));
 if(ticket!==generation)return;
 if(!companies.some(c=>c.id===companyId))companyId=companies[0]?.id||'';
 const company=companies.find(c=>c.id===companyId);
 const membership=companyId?await result(client.from('company_memberships').select('role').eq('company_id',companyId).eq('user_id',user.id).eq('status','active').single()):null;
 const clients=companyId?await result(client.from('clients').select('id,company_id,name,csv_client_id').eq('company_id',companyId).order('created_at')):[];
 const projects=companyId?await result(client.from('projects').select('id,company_id,client_id,name,campaigns,starts_on,ends_on').eq('company_id',companyId).order('created_at')):[];
 if(ticket!==generation)return;
 const canWrite=membership&&['owner','editor'].includes(membership.role);
 root.innerHTML=`<div class="account-session"><a class="button outline" href="https://enote-labs.vercel.app/suite/?mode=cloud">4개 제품 연결 ↗</a><span>${e(accountLabel(user))} · ${e(membership?.role||'소속 회사 없음')}</span><button class="button outline" data-action="logout">로그아웃</button></div><div class="account-grid"><section class="card"><h2>회사 공간</h2>${companies.length?`<label>현재 회사<select id="company">${companies.map(c=>`<option value="${c.id}" ${c.id===companyId?'selected':''}>${e(c.name)}</option>`).join('')}</select></label>`:''}<form id="company-create">${input('name','새 회사 이름','text','maxlength="120"')}<button class="button primary">회사 공간 만들기</button></form><p class="hint">가입한 회사의 소유자가 회원 아이디로 팀원을 추가할 수 있습니다. 소유 회사는 계정당 최대 3곳입니다.</p></section><section class="card"><h2>${company?e(company.name):'기초자료 등록'}</h2><p class="hint">${company?'고객·프로젝트는 이 회사에만 저장됩니다.':'회사 공간을 만든 다음 고객과 프로젝트를 등록하세요.'}</p><ul class="account-list">${clients.map(c=>`<li>${e(c.name)}<small>CSV ID: ${e(c.csv_client_id)}</small></li>`).join('')||'<li>등록된 고객이 없습니다.</li>'}</ul></section></div>${canWrite?`<div class="account-grid"><section class="card"><h2>고객 등록</h2><form id="client-create">${input('name','고객사 이름','text','maxlength="200"')}${input('csv_client_id','CSV 고객 ID','text','pattern="[A-Za-z0-9_-]{1,40}" maxlength="40"')}<button class="button primary">고객 저장</button></form><p class="hint">파일럿 기본 한도는 회사당 고객 3곳입니다.</p></section><section class="card"><h2>프로젝트 등록</h2><form id="project-create"><label>고객<select name="client_id" required><option value="">고객 선택</option>${clients.map(c=>`<option value="${c.id}">${e(c.name)}</option>`).join('')}</select></label>${input('name','프로젝트 이름','text','maxlength="200"')}${input('campaigns','캠페인명 (여러 개는 | 로 구분)')}${input('starts_on','시작일','date')}${input('ends_on','종료일','date')}<button class="button primary">프로젝트 저장</button></form></section></div>`:''}${company?`<section class="card"><h2>등록된 프로젝트</h2><ul class="account-list">${projects.map(p=>`<li>${e(p.name)}<small>${e(p.campaigns.join(' · '))} / ${p.starts_on} ~ ${p.ends_on}</small></li>`).join('')||'<li>등록된 프로젝트가 없습니다.</li>'}</ul></section>`:''}${membership?.role==='owner'?`<section class="card"><h2>기존 가입 회원을 팀에 추가</h2><form id="member-add">${input('email','가입한 아이디 (기존 계정은 이메일)','text')}<label>역할<select name="role"><option value="editor">작성자</option><option value="reviewer">검수자</option><option value="viewer">조회자</option></select></label><button class="button outline">팀원 추가</button></form><p class="hint">초대 메일은 발송하지 않습니다. 등록된 회원에게 현재 회사 자료 접근 권한을 부여합니다.</p></section>`:''}`;
 if(company&&membership){const host=document.createElement('div');root.append(host);mountCloudReports(host,{client,companyId,user,role:membership.role,projects,customers:clients,active:()=>ticket===generation&&host.isConnected});}

}
async function run(fn){if(busy)return;busy=true;const controls=[...root.querySelectorAll('button')].map(el=>[el,el.disabled]);controls.forEach(([el])=>el.disabled=true);const authButton=root.querySelector('#auth>button'),buttonText=authButton?.textContent;if(authButton)authButton.textContent='처리 중…';root.setAttribute('aria-busy','true');say('');try{await fn();}catch(error){say(readableError(error),true);}finally{busy=false;root.removeAttribute('aria-busy');if(authButton?.isConnected)authButton.textContent=buttonText;controls.forEach(([el,disabled])=>{if(el.isConnected)el.disabled=disabled;});}}
root.addEventListener('submit',event=>{event.preventDefault();const form=event.target,input=Object.fromEntries(new FormData(form));run(async()=>{
 if(form.id==='auth'){
  if(loginMode){await result(client.auth.signInWithPassword({email:loginAddress(input.username),password:input.password}));await refresh();say('로그인했습니다.');}
  else{await registerUsername(client,publicConfig,input);await refresh();say('가입하고 로그인했습니다.');}
 }else if(form.id==='company-create'){const r=await command('create_company',{name:input.name});companyId=r.company_id;await refresh();say('회사 공간을 Supabase에 저장했습니다.');}
 else if(form.id==='client-create'){await command('create_client',{...input,company_id:companyId});await refresh();say('고객을 Supabase에 저장했습니다.');}
 else if(form.id==='project-create'){await command('create_project',{...input,company_id:companyId,campaigns:input.campaigns.split('|').map(s=>s.trim()).filter(Boolean)});await refresh();say('프로젝트를 Supabase에 저장했습니다.');}
 else if(form.id==='member-add'){await command('add_member',{...input,email:loginAddress(input.email),company_id:companyId});await refresh();say('등록된 회원을 팀에 추가했습니다.');}
});});
root.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||busy)return;
 if(button.dataset.action==='reload')run(refresh);
 if(button.dataset.action==='switch'){loginMode=!loginMode;say('');authView();}
 if(button.dataset.action==='logout')run(async()=>{await result(client.auth.signOut());user=null;companyId='';generation++;authView();say('로그아웃했습니다.');});
});
root.addEventListener('change',event=>{if(event.target.id==='company'&&!busy){companyId=event.target.value;run(refresh);}});
if(location.hostname.endsWith('.github.io')){
 root.innerHTML='<section class="card"><h2>회사 계정은 Vercel 운영 주소에서 사용하세요.</h2><a class="button primary" href="https://flow-note-psi.vercel.app/account.html">회원가입 · 로그인 열기</a><p class="hint">GitHub Pages는 공개 체험판입니다. 인증 반환 주소가 설정된 Vercel에서 계속하세요.</p></section>';
}else try{
 const config=publicConfig=await fetch('./supabase-public.json').then(r=>{if(!r.ok)throw new Error('클라우드 공개 연결 설정을 불러오지 못했습니다.');return r.json();});
 if(!config.publishableKey.startsWith('sb_publishable_'))throw new Error('공개 클라이언트 키 설정을 확인하세요.');
 client=createClient(config.url,config.publishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true,...(sameOriginSuite?{storageKey:'agencyflow-auth-v1'}:{})}});
 client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){user=null;companyId='';generation++;authView();}});
 await refresh();
}catch(error){say(error.message,true);root.innerHTML='<p>연결을 확인한 뒤 새로고침해 주세요.</p>';}

root.addEventListener('input',event=>{if(event.target.name==='username'){const field=root.querySelector('#owner-signup-field');if(field){field.hidden=normalizeUsername(event.target.value)!==OWNER_USERNAME;const pass=field.querySelector('input');pass.disabled=field.hidden;pass.required=!field.hidden;if(field.hidden)pass.value='';}}});
