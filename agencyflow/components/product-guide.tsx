'use client';
import {useState,useRef,useEffect,type FormEvent} from 'react';
import {guideNames,guideTopics,searchGuide,type GuideProduct,type GuideTopic} from '../lib/product-help';

export default function ProductGuide({product,onNavigate,internal=true}:{product:GuideProduct;onNavigate:(view:string)=>void;internal?:boolean}){
 const [open,setOpen]=useState(false),[question,setQuestion]=useState(''),[browse,setBrowse]=useState(false),[messages,setMessages]=useState<{question:string;topics:GuideTopic[]}[]>([]);
 const dialog=useRef<HTMLDialogElement>(null),input=useRef<HTMLInputElement>(null),thread=useRef<HTMLDivElement>(null);
 const topics=guideTopics(product,internal),name=guideNames[product],pdf=product==='projectflow'?'agencyflow':product;
 useEffect(()=>{if(!open)return;const el=dialog.current;if(!el)return;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';el.showModal();input.current?.focus();return()=>{el.close();document.body.style.overflow=overflow;};},[open]);
 useEffect(()=>{if(open&&thread.current)thread.current.scrollTop=thread.current.scrollHeight;},[messages,open]);
 function ask(value:string){const q=value.trim().slice(0,300);if(!q)return;setBrowse(false);setMessages(previous=>[...previous,{question:q,topics:searchGuide(product,q,internal)}].slice(-5));setQuestion('');input.current?.focus();}
 function submit(e:FormEvent){e.preventDefault();ask(question);}
 function article(t:GuideTopic){return <article className="pg-article" key={t.id}><h3>{t.title}</h3><ol>{t.steps.map(step=><li key={step}>{step}</li>)}</ol>{t.view&&<button onClick={()=>{onNavigate(t.view!);setOpen(false);}}>해당 메뉴 열기 →</button>}{t.href&&<a className="button" href={t.href} target="_blank" rel="noopener noreferrer">제품 연결 열기 ↗</a>}</article>}
 return <>
  <button className="pg-fab" onClick={()=>setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-controls="product-guide-dialog"><span aria-hidden="true">?</span> 사용 가이드</button>
  <dialog ref={dialog} id="product-guide-dialog" className="pg-dialog" aria-labelledby="product-guide-title" onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)}>
   <header><div><span className="eyebrow">{name.toUpperCase()} GUIDE</span><h2 id="product-guide-title">사용법 찾기</h2></div><button className="pg-close" aria-label="사용 가이드 닫기" onClick={()=>setOpen(false)}>×</button></header>
   <div className="pg-description"><b>매뉴얼에서 관련 안내를 찾아드립니다.</b><p>문서 검색 기반 · 외부 AI 사용 안 함<br/>회사 자료 조회·업무 실행은 하지 않습니다.</p></div>
   <div className="pg-thread" ref={thread}>
    {browse?topics.map(article):messages.length?messages.map((m,i)=><section key={i} className="pg-exchange"><p className="pg-question">{m.question}</p><div role="status" aria-live="polite">{m.topics.length?m.topics.map(article):<p className="pg-empty">관련 도움말을 찾지 못했습니다. 기능 이름으로 다시 검색하거나 전체 사용법·제품소개서를 확인하세요.</p>}</div></section>):<div className="pg-welcome"><span aria-hidden="true">?</span><h3>어떤 부분이 궁금하세요?</h3><p>기능 이름이나 질문을 입력해 보세요.<br/>예: “{topics[0]?.title}”</p></div>}
   </div>
   <div className="pg-suggestions" aria-label="추천 도움말">{topics.slice(0,3).map(t=><button key={t.id} onClick={()=>ask(t.title)}>{t.title}</button>)}</div>
   <form onSubmit={submit}><label className="pg-sr" htmlFor="product-guide-question">사용법 질문</label><input ref={input} id="product-guide-question" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={300} autoComplete="off" placeholder="사용 방법을 물어보세요" required/><button className="button primary" aria-label="가이드에 질문하기">↑</button></form>
   <div className="pg-links"><button onClick={()=>setBrowse(!browse)}>{browse?'질문으로 돌아가기':'전체 사용법'}</button><a className="button" href={'/manuals/'+pdf+'-guide-charts-20261101.pdf'} target="_blank" rel="noopener noreferrer">제품소개서 보기 ↗</a></div>
   <p className="pg-safety">비밀번호나 고객 자료는 입력하지 마세요.<br/>질문은 서버에 전송·저장하지 않습니다.</p>
  </dialog>
 </>;
}
