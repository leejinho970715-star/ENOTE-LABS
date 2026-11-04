'use client';
export function ExecutionStatus({runtime,jobs,meetings}:{runtime:any;jobs:any[];meetings:any[]}){
 const live=runtime?.live;if(!live)return null;
 const errors=jobs.filter(j=>j.status==='FAILED').slice(-3).reverse();
 return <section className="panel padded" aria-label="실제 실행 준비 상태"><h2>운영 서버 · LIVE 실행 상태</h2><p><b>{live.ready?'LIVE 준비 조건 충족 · API 실호출 검증은 별도':'LIVE 준비 미완료'}</b> · worker {live.worker.online?'온라인':'오프라인'}{live.worker.heartbeatAt?' · 마지막 응답 '+new Date(live.worker.heartbeatAt).toLocaleTimeString('ko-KR'):''}</p>
 {!live.worker.online&&<p className="error">작업 실행 프로세스가 꺼져 있습니다. npm run worker 또는 시작 파일을 실행하세요.</p>}
 {(live.missing.length>0||live.missingModels.length>0)&&<p className="error">설정 필요: {[...live.missing,...live.missingModels].join(', ')}</p>}
 <p className="muted">LIVE는 실제 OpenAI/조사 도구를 호출하며 MOCK 결과로 대체하지 않습니다. MOCK는 별도 고정 데이터 검증입니다.</p>
 {meetings.filter(m=>m.status==='RUNNING').map(m=><p key={m.id}>실행 중: {m.agenda} · {m.stage||'시작'} · {m.activeAgent||'비서실장'}</p>)}
 {errors.map(j=><p className="error" key={j.id}>{j.payload?.mode?.toUpperCase()} · {j.failureCode||'EXECUTION_FAILED'}: {j.error}</p>)}
 </section>;
}
export function DecisionReport({report,sources}:{report:any;sources:any[]}){if(!report)return null;return <section className="panel padded"><h2>CEO 의사결정 보고 · 사업 추천 TOP 3</h2><p><b>{report.status==='PROVISIONAL'?'잠정 결론 · 추가 검증 필요':'복수 출처 기반 권고 · CEO 검증 필요'}</b></p><p>{report.recommendation.rationale}</p><p className="muted">권고 후보: {report.recommendation.selectedOpportunityId||'보류'} · 점수는 AI 판단, 금액은 가정에 따른 추정입니다.</p>
 {report.opportunities.map((o:any)=><details key={o.id} open><summary><b>{o.rank}. {o.name} · {o.totalScore}/100</b></summary><p>고객: {o.customer} · 문제: {o.problem}</p><p>{o.scoreRationale}</p><p>수익모델: {o.revenueModel}</p><p>매출 {o.economics.revenue??'미확인'} / 원가 {o.economics.cost??'미확인'} / 이익 {o.economics.profit??'미확인'} ({o.economics.currency} / {o.economics.period}, 추정)</p><p className="muted">가정: {o.economics.assumptions.join(' · ')}</p><p>위험: {o.risks.join(' · ')}</p><p>실행 전략: {o.strategy.join(' → ')}</p><p>수요 근거: {o.sourceUrls.length?o.sourceUrls.map((url:string)=><a key={url} href={url} target="_blank" rel="noreferrer">{new URL(url).hostname} ↗ </a>):'확인된 출처 부족'}</p></details>)}
 <h3>추가 검증 과제</h3>{[...report.recommendation.missingEvidence,...report.recommendation.nextValidation].map((s:string,i:number)=><p key={i}>• {s}</p>)}
 <details><summary>출처·검증 상태 {sources.length}건</summary>{sources.map(s=><p key={s.id}><a href={/^https?:\/\//.test(s.url)?s.url:undefined} target="_blank" rel="noreferrer">{s.title||s.url}</a> · {s.agentId} · {s.verification==='RETRIEVED'?'도구 수집 확인':'미검증 주장'} · 사실성 별도 검증 필요<br/>{s.claim}</p>)}</details><p className="muted">{report.notice}</p></section>;}
