import {z} from 'zod';
export const baseOutputSchema=z.object({summary:z.string(),evidence:z.array(z.string()),dissent:z.array(z.string()),participants:z.array(z.string()),tasks:z.array(z.object({title:z.string(),description:z.string(),agentId:z.string(),acceptanceCriteria:z.string(),dependsOn:z.array(z.string())}))});
const source=z.object({url:z.string(),title:z.string(),claim:z.string(),assessment:z.enum(['SUPPORTS','PARTIAL','UNCHECKED'])});
export const opportunitySchema=z.object({
 id:z.string(),name:z.string(),customer:z.string(),problem:z.string(),
 scores:z.object({demand:z.number(),feasibility:z.number(),profitability:z.number(),differentiation:z.number(),riskControl:z.number()}),scoreRationale:z.string(),
 demandEvidence:z.array(z.string()),revenueModel:z.string(),
 economics:z.object({currency:z.enum(['KRW','USD']),period:z.enum(['MONTH','YEAR','UNIT']),unitPrice:z.number().nullable(),units:z.number().nullable(),fixedCost:z.number().nullable(),variableCostPerUnit:z.number().nullable(),assumptions:z.array(z.string())}),
 risks:z.array(z.string()),strategy:z.array(z.string()),validationTasks:z.array(z.string())
});
export const liveOutputSchema=baseOutputSchema.extend({
 sources:z.array(source),opportunities:z.array(opportunitySchema),
 reviews:z.array(z.object({targetAgentId:z.string(),claim:z.string(),position:z.enum(['AGREE','CHALLENGE','INSUFFICIENT_EVIDENCE']),reason:z.string(),sourceUrls:z.array(z.string())})),
 recommendation:z.object({selectedOpportunityId:z.string().nullable(),rationale:z.string(),provisional:z.boolean(),missingEvidence:z.array(z.string()),nextValidation:z.array(z.string())}).nullable(),
 proposedActions:z.array(z.object({operation:z.string(),payloadJson:z.string(),purpose:z.string()}))
});
export type BaseOutput=z.infer<typeof baseOutputSchema>;
export type LiveOutput=z.infer<typeof liveOutputSchema>;
export type AgentOutput=BaseOutput&Partial<Omit<LiveOutput,keyof BaseOutput>>;
export const researchInstructions=`
실행 프로토콜: LIVE에서는 고정 예시로 대체하지 않는다. opinion 단계는 web_search로 전문 분야별 신사업 후보를 독립 조사한다.
출처는 URL·제목·뒷받침하는 주장으로 sources에 넣는다. 실제 검색에 등장하지 않은 URL을 검증했다고 주장하지 않는다. 검색/인용은 진실 보장이 아니며 사실과 가정을 구분한다.
plan은 다섯 임원을 참석자로 선택한다. opinion은 후보 1~3개와 근거/가정을 작성한다. debate는 다른 임원의 구체적 주장에 reviews로 반론/동의를 최소 1개 연결한다.
synthesis는 중복 없는 사업 후보 정확히 3개를 비교한다. 각 점수는 0~100의 판단 점수이며 scoreRationale에 근거를 설명한다. economics는 추정 기간·통화·단가·수량·고정/변동원가·가정을 명시한다. 미확인 수치는 null로 둔다.
demandEvidence는 제공된 출처 URL을 사용한다. 매출·원가·이익·총점은 서버가 계산한다. 출처가 부족하면 recommendation.provisional=true로 하고 추가 검증 과제를 작성한다.
task는 내부 문서뿐 아니라 연결된 외부 서비스 읽기 도구를 사용할 수 있다. 외부 쓰기가 필요하면 proposedActions에 허용 작업과 구체적 payload JSON을 제안한다. 실제 실행은 서버의 별도 CEO 승인 후 진행된다. 승인 ID를 만들거나 변경할 권한은 없다.
JSON 배열 중 해당 단계에서 필요 없는 항목은 빈 배열, recommendation은 null을 사용한다. 산출물 본문에 스키마를 반복하지 말고 실제 결과를 작성한다.
`;
