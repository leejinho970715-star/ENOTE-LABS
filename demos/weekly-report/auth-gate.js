import {loginAddress} from '../../shared/identity.js';
import {createClient} from '@supabase/supabase-js';
export async function requireProductLogin(base='/'){
 document.body.classList.add('auth-pending');
 const host=document.createElement('main');host.id='product-access';host.className='account-page';document.body.append(host);
 const origin='https://flow-note-psi.vercel.app';
 if(location.hostname.endsWith('.github.io')){const target=location.pathname.endsWith('/csv.html')?'/csv.html':'/workspace/';host.innerHTML=`<section class="card"><h1>로그인 후 제품을 사용하세요.</h1><p>운영 주소에서 로그인한 뒤 Flownote를 이용할 수 있습니다.</p><a class="button primary" href="${origin}${target}">Flownote 로그인</a></section>`;return false;}
 try{
  const response=await fetch(base+'supabase-public.json');if(!response.ok)throw Error('인증 연결 설정을 불러오지 못했습니다.');const config=await response.json(),client=createClient(config.url,config.publishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true,...(location.pathname.startsWith('/flownote/')?{storageKey:'agencyflow-auth-v1'}:{})}});
  const {data}=await client.auth.getUser();
  if(data.user){host.remove();document.body.classList.remove('auth-pending');client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')location.reload();});return true;}
  host.innerHTML=`<section class="card"><span class="eyebrow">FLOWNOTE · MEMBER ACCESS</span><h1>로그인하고 계속하세요.</h1><p>샘플 대시보드와 CSV 체험도 로그인 후 사용할 수 있습니다.</p><p id="product-auth-error" role="alert"></p><form id="product-login"><label>아이디<input name="username" type="text" autocomplete="username" required></label><label>비밀번호<input name="password" type="password" autocomplete="current-password" required></label><button class="button primary">로그인하고 계속하기</button></form><div class="actions"><a class="button outline" href="${base}account.html">회원가입·회사 계정</a><a class="button outline" href="https://enote-labs.vercel.app/">제품 소개로 돌아가기</a></div><p class="hint">이름·아이디·비밀번호로 가입할 수 있습니다. 기존 이메일 계정은 이메일과 비밀번호로 로그인하세요.</p></section>`;
  host.querySelector('form').addEventListener('submit',async event=>{event.preventDefault();const button=host.querySelector('button');button.disabled=true;try{const f=new FormData(event.target);const r=await client.auth.signInWithPassword({email:loginAddress(f.get('username')),password:String(f.get('password'))});if(r.error)throw r.error;location.reload();}catch(error){host.querySelector('#product-auth-error').textContent=error.message||'로그인하지 못했습니다.';button.disabled=false;}});
 }catch(error){host.textContent=error.message||'로그인을 확인하지 못했습니다. 새로고침해 주세요.';}
 return false;
}
