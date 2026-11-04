import {liveOutputSchema,type AgentOutput} from '../agents/contracts';
import type {Row} from '../lib/db';
export function buildDecisionReport(raw:AgentOutput,sources:Row[]){
 const out=liveOutputSchema.parse(raw);if(out.opportunities.length!==3)throw new Error('최종 사업 추천은 정확히 TOP 3이어야 합니다');
 if(new Set(out.opportunities.map(o=>o.id)).size!==3)throw new Error('사업 후보 ID가 중복되었습니다');
 const retrieved=new Set(sources.filter(s=>s.verification==='RETRIEVED').map(s=>s.url));
 const opportunities=out.opportunities.map(o=>{
  const sc=o.scores;for(const value of Object.values(sc))if(!Number.isFinite(value)||value<0||value>100)throw new Error('평가 점수는 0~100이어야 합니다');
  if(!o.scoreRationale||!o.risks.length||!o.strategy.length)throw new Error('사업 평가 근거·위험·실행 전략이 필요합니다');
  const e=o.economics;for(const v of [e.unitPrice,e.units,e.fixedCost,e.variableCostPerUnit])if(v!==null&&(!Number.isFinite(v)||v<0))throw new Error('원가/단가/수량은 0 이상의 유한 수치 또는 null이어야 합니다');
  if([e.unitPrice,e.units,e.fixedCost,e.variableCostPerUnit].some(v=>v!==null)&&!e.assumptions.length)throw new Error('재무 추정치에는 가정이 필요합니다');
  const revenue=e.unitPrice!==null&&e.units!==null?e.unitPrice*e.units:null;
  const cost=e.fixedCost!==null&&e.variableCostPerUnit!==null&&e.units!==null?e.fixedCost+e.variableCostPerUnit*e.units:null;
  const sourceUrls=[...new Set(o.demandEvidence.filter(url=>retrieved.has(url)))];
  const domains=new Set(sourceUrls.map(url=>new URL(url).hostname.replace(/^www\./,'')));
  return {...o,totalScore:Math.round(sc.demand*.3+sc.profitability*.25+sc.feasibility*.2+sc.differentiation*.15+sc.riskControl*.1),scoreType:'ANALYST_JUDGMENT',economics:{...e,revenue,cost,profit:revenue!==null&&cost!==null?revenue-cost:null,isEstimate:true},sourceUrls,evidenceStatus:domains.size>=2?'MULTIPLE_SOURCES':'INSUFFICIENT',truthVerified:false};
 }).sort((a,b)=>b.totalScore-a.totalScore).map((o,i)=>({...o,rank:i+1}));
 const rec=out.recommendation;if(!rec||!rec.rationale.trim())throw new Error('비서실장의 명확한 권고안이 필요합니다');
 if(rec.selectedOpportunityId&&!opportunities.some(o=>o.id===rec.selectedOpportunityId))throw new Error('권고한 사업 후보가 TOP 3에 없습니다');
 const gaps=opportunities.flatMap(o=>[...(o.evidenceStatus==='INSUFFICIENT'?[`${o.name}: 서로 다른 출처의 수요 근거 추가 검증 필요`]:[]),...(o.economics.profit===null?[`${o.name}: 원가/이익 가정 검증 필요`]:[])]);
 const provisional=rec.provisional||gaps.length>0||!rec.selectedOpportunityId;
 return {schemaVersion:1,mode:'live',status:provisional?'PROVISIONAL':'EVIDENCE_BACKED',opportunities,recommendation:{...rec,provisional,missingEvidence:[...new Set([...rec.missingEvidence,...gaps])]},unresolvedDissent:out.dissent,generatedAt:new Date().toISOString(),notice:'검색 출처 확보는 사실의 진실성 보증이 아닙니다. 점수는 판단이며 재무 수치는 가정에 따른 추정입니다.'};
}
export function reportMarkdown(r:ReturnType<typeof buildDecisionReport>){return `# CEO 의사결정 보고서\n\n상태: ${r.status}\n\n## 최종 권고\n${r.recommendation.rationale}\n추천 후보: ${r.recommendation.selectedOpportunityId||'보류'}\n\n${r.opportunities.map(o=>`## ${o.rank}. ${o.name} · ${o.totalScore}/100 (판단 점수)\n고객: ${o.customer}\n문제: ${o.problem}\n수익모델: ${o.revenueModel}\n수요 근거: ${o.sourceUrls.join(', ')||'추가 검증 필요'}\n경제성 (${o.economics.currency}/${o.economics.period}, 추정): 매출 ${o.economics.revenue??'미확인'}, 원가 ${o.economics.cost??'미확인'}, 이익 ${o.economics.profit??'미확인'}\n가정: ${o.economics.assumptions.join('; ')}\n위험: ${o.risks.join('; ')}\n실행 전략: ${o.strategy.join('; ')}`).join('\n\n')}\n\n## 추가 검증\n${[...r.recommendation.missingEvidence,...r.recommendation.nextValidation].map(x=>'- '+x).join('\n')}\n\n${r.notice}`;}
