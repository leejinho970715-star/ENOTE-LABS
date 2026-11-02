"use client";
import {useEffect,useState,type FormEvent,type ReactNode} from 'react';
import {db,configureDemoIdentity} from '../lib/data';
import config from '../../supabase/public-config.json';
import {accountLabel,loginAddress,normalizeUsername,OWNER_USERNAME,registerUsername} from '../../shared/identity.js';
export default function ProductAccess({name,children}:{name:string;children:ReactNode}){
 const [identity,setIdentity]=useState(''),[label,setLabel]=useState(''),[checking,setChecking]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[signup,setSignup]=useState(false),[username,setUsername]=useState('');
 useEffect(()=>{let alive=true,revision=0;const accept=(user:any)=>{if(!alive)return;configureDemoIdentity(user?.id||'');setIdentity(user?.id||'');setLabel(accountLabel(user));setChecking(false);};
  const initial=revision;db.auth.getUser().then(r=>{if(revision===initial)accept(r.data.user);}).catch(()=>{if(revision===initial)accept(null);});
  const {data}=db.auth.onAuthStateChange((event,s)=>{if(event==='SIGNED_OUT'){revision++;accept(null);return;}if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED'){revision++;accept(s?.user);}});
  const recheck=()=>{const current=++revision;db.auth.getUser().then(r=>{if(current===revision)accept(r.data.user);}).catch(()=>{if(current===revision)accept(null);});};window.addEventListener('focus',recheck);
  return()=>{alive=false;window.removeEventListener('focus',recheck);data.subscription.unsubscribe();};
 },[]);
 async function authenticate(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;setBusy(true);setError('');const f=new FormData(e.currentTarget);
  try{
   const password=String(f.get('password'));
   const response=signup?await registerUsername(db,config,{name:String(f.get('name')||''),username,password,ownerPassword:String(f.get('ownerPassword')||'')}):await db.auth.signInWithPassword({email:loginAddress(username),password});
   if(response.error)throw response.error;
   const user=await db.auth.getUser();if(user.error||!user.data.user)throw Error('로그인을 확인하지 못했습니다.');
   const session=await db.auth.getSession();if(session.data.session?.user.id!==user.data.user.id)throw Error('로그인이 취소됐습니다. 다시 로그인하세요.');
   configureDemoIdentity(user.data.user.id);setIdentity(user.data.user.id);setLabel(accountLabel(user.data.user));
  }catch(e){setError(e instanceof Error?(e.message==='Invalid login credentials'?'아이디와 비밀번호를 확인하세요.':e.message):'로그인하지 못했습니다.');}finally{setBusy(false);}
 }
 if(checking)return <main className="access-page"><h1>로그인을 확인하고 있습니다.</h1><p>인증을 확인한 뒤 제품을 엽니다.</p></main>;
 if(!identity)return <main className="access-page"><a className="af-brand" href="https://enote-labs.vercel.app/">ENOTE-LABS</a><section className="panel"><span className="eyebrow">ONE ACCOUNT · FOUR PRODUCTS</span><h1>{signup?'회원가입':name+' 로그인'}</h1><p>{signup?'이름·아이디·비밀번호로 가입하고 바로 시작하세요.':'네 가지 제품을 같은 아이디로 이용하세요.'}</p>{error&&<p role="alert" className="error-box">{error}</p>}<form onSubmit={authenticate}>
 {signup&&<label>이름<input name="name" required maxLength={80} autoComplete="name"/></label>}
 <label>아이디<input name="username" type="text" autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value)} maxLength={signup?24:254} {...(signup?{pattern:'[a-zA-Z][a-zA-Z0-9_]{3,23}'}:{})}/>{signup&&<small>영문 소문자로 시작하는 4~24자 · 영문·숫자·밑줄</small>}</label>
 <label>비밀번호{signup?' (10자 이상)':''}<input name="password" type="password" autoComplete={signup?'new-password':'current-password'} required minLength={signup?10:undefined} maxLength={128}/></label>
 {signup&&normalizeUsername(username)===OWNER_USERNAME&&<label>대표 관리자 확인 비밀번호<input name="ownerPassword" type="password" required autoComplete="off" maxLength={72}/><small>대표 전용 아이디를 보호하기 위한 기존 관리자 비밀번호입니다.</small></label>}
 <button className="button primary" disabled={busy}>{busy?'처리 중…':signup?'가입하고 시작하기':'로그인하고 계속하기'}</button></form><div className="actions"><button className="button" disabled={busy} onClick={()=>{setSignup(!signup);setError('');}}>{signup?'이미 계정이 있다면 로그인':'처음이라면 회원가입'}</button><a className="button" href="https://enote-labs.vercel.app/">제품 소개로 돌아가기</a></div><p className="muted">이메일 인증은 필요하지 않습니다. 기존 이메일 계정은 이메일과 비밀번호로 로그인할 수 있습니다. 회사 자료는 소속과 역할에 따라 표시됩니다.</p></section></main>;
 return <><div className="product-authbar"><span>로그인됨 · {label}</span><button onClick={async()=>{const r=await db.auth.signOut();if(r.error)setError(r.error.message);}}>로그아웃</button>{error&&<p role="alert">{error}</p>}</div><div key={identity}>{children}</div></>;
}
