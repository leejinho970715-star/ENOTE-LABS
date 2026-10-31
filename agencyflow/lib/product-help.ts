export type GuideProduct = 'projectflow' | 'follonote' | 'crewmemo';
export type GuideTopic = {id:string;title:string;keywords:string[];steps:string[];view?:string;internal?:boolean;href?:string};
export const guideNames:Record<GuideProduct,string>={projectflow:'ProjectFlow',follonote:'Follonote',crewmemo:'Crewmemo'};
const topics:Record<GuideProduct,GuideTopic[]>={
 projectflow:[
  {id:'projects',title:'프로젝트 만들기',keywords:['프로젝트','생성','만들기','등록','일정'],view:'projects',internal:true,steps:['고객 · 요청 부서에서 고객을 먼저 등록하세요.','프로젝트 메뉴의 + 프로젝트를 눌러 고객·담당자·기간·단계를 입력하고 저장합니다.','보드에서 프로젝트를 선택하면 개요와 등록 작업의 진행률을 볼 수 있습니다.']},
  {id:'tasks',title:'작업과 마감 관리',keywords:['작업','태스크','담당자','기한','마감','진행률'],view:'tasks',internal:true,steps:['프로젝트를 선택하고 작업 목록에서 + 작업 추가를 누르세요.','제목·담당자·우선순위·마감일을 입력합니다.','작업 범위를 선택 프로젝트 또는 전체 프로젝트로 바꾸고, 상태를 변경해 도표를 갱신합니다.']},
  {id:'review',title:'고객 피드백과 버전 승인',keywords:['피드백','시안','이미지','핀','검토','승인','업로드','댓글'],view:'review',steps:['자료 검토 · 피드백에서 프로젝트와 자료 버전을 선택하세요.','내부 팀원이 PNG·JPEG·WebP 이미지를 등록하면 고객이 이미지 위치에 의견을 남길 수 있습니다.','승인은 선택한 버전에 기록됩니다. 업로드는 파일당 5MB이며, 새 자료는 새 버전으로 등록하세요.']},
  {id:'quotes',title:'견적 만들기와 PDF 저장',keywords:['견적','단가','금액','pdf','출력','인쇄'],view:'quotes',steps:['견적서에서 프로젝트와 견적 버전을 선택하세요.','내부 팀원은 항목·수량·단가를 입력하고 새 견적 버전을 저장합니다.','인쇄 · PDF 저장으로 출력합니다. 견적 금액은 실제 매출이나 수금과 다릅니다.']},
  {id:'team',title:'팀원·고객 접근 권한',keywords:['팀원','초대','권한','로그인','회원가입','고객계정'],view:'settings',internal:true,steps:['팀 · 이용 안내에서 기존 가입·이메일 확인 계정을 연결합니다.','고객 역할은 지정한 프로젝트만 볼 수 있습니다. 내부 작업은 고객에게 표시되지 않습니다.','초대 메일은 자동 발송하지 않습니다. 일반 고객 가입 메일 서비스는 준비 중입니다.']},
 ],
 follonote:[
  {id:'contacts',title:'고객 등록과 상담 기록',keywords:['고객','연락처','등록','상담','메모','유입'],view:'contacts',steps:['고객 관리에서 + 고객을 눌러 회사명·담당자·연락처를 등록하세요.','고객을 선택해 정보를 수정하거나 상담 기록을 추가합니다.','진행 중인 영업기회가 있는 고객은 먼저 영업기회를 정리한 뒤 보관할 수 있습니다.']},
  {id:'deals',title:'영업기회와 수주 단계 관리',keywords:['영업','기회','파이프라인','수주','단계','금액','매출'],view:'deals',steps:['영업 파이프라인에서 고객을 연결한 영업기회를 만드세요.','목표일·입력 금액·담당자를 정하고 신규·상담·제안·협상·수주·종료 단계를 변경합니다.','기회 금액과 수주 표시는 영업 기록입니다. 실제 매출·입금 확인이나 매출 예측이 아닙니다.']},
  {id:'followups',title:'후속 연락 일정과 완료 표시',keywords:['후속','연락','일정','오늘','완료','알림','마감'],view:'followups',steps:['후속 연락에서 + 연락 일정으로 고객·할 일·날짜를 등록하세요.','실제로 연락한 뒤 연락 완료를 누릅니다.','도표에서 처리 상태와 기한을 확인합니다. 이메일·문자 알림은 자동 발송하지 않습니다.']},
 ],
 crewmemo:[
  {id:'notices',title:'공지 작성과 상단 고정',keywords:['공지','소식','게시판','고정','작성'],view:'notices',steps:['공지 게시판에서 + 공지 작성으로 제목과 내용을 등록하세요.','관리자는 중요한 공지를 상단에 고정할 수 있습니다.','작성자 또는 관리자가 공지를 보관할 수 있습니다.']},
  {id:'calendar',title:'팀 일정 등록과 7일 도표',keywords:['일정','캘린더','회의','시간','7일','달력'],view:'calendar',steps:['팀 일정에서 + 일정 등록으로 제목·시작·종료 시각·장소를 입력하세요.','종료 시각은 시작 시각 이후여야 합니다.','7일 도표는 한국 시간의 시작일 기준입니다. 좁은 화면에서는 도표 내부를 좌우로 움직일 수 있습니다.']},
  {id:'approvals',title:'결재 요청과 승인·반려',keywords:['결재','승인','반려','요청','안돼','안되','결정'],view:'approvals',steps:['내부 결재에서 + 결재 요청을 누르고 다른 내부 팀원을 결재자로 지정하세요.','작성자는 자기 요청을 승인할 수 없습니다. 지정 결재자만 대기 문서를 승인·반려합니다.','처리한 문서는 다시 승인할 수 없습니다. 승인은 실제 지급이나 계약 전자서명을 실행하지 않습니다.']},
  {id:'tasks',title:'팀 업무와 담당자·마감 관리',keywords:['업무','작업','담당자','마감','기한','우선순위','완료'],view:'tasks',steps:['팀 업무에서 + 팀 업무를 눌러 담당자·마감일·우선순위를 등록하세요.','실제 진행에 맞춰 대기·진행중·완료 상태를 바꿉니다.','ProjectFlow와 연결한 작업은 회사 모드에서 상태가 양쪽에 반영됩니다. 다른 화면은 새로고침해 확인하세요.']},
 ],
};
export function guideTopics(product:GuideProduct,internal=true):GuideTopic[]{
 return [...topics[product].filter(t=>internal||!t.internal),
  {id:'charts',title:'도표와 수치표 읽기',keywords:['도표','차트','수치','통계','그래프','0건','집계'],view:product==='projectflow'?'overview':'dash',steps:['도표 제목 아래의 집계 범위와 기준을 먼저 확인하세요.','수치표 보기를 열면 정확한 숫자를 읽을 수 있습니다. 등록 자료가 없는 상태와 0을 구분합니다.','금액 도표는 입력된 금액을 집계합니다. 미입력·형식 오류 금액은 합계에서 제외합니다.']},
  {id:'connection',title:'네 제품의 데이터 연결',keywords:['연결','연계','동기화','다른제품','flownote','crm','pms'],href:'https://enote-labs.vercel.app/suite/',steps:['제품 연결에서 같은 회사의 CRM 고객·프로젝트 고객을 선택해 재사용합니다.','수주 기회를 프로젝트로, 프로젝트 작업을 Crewmemo로 연결할 수 있습니다.','Flownote 회사 연결은 양쪽 대표 관리자 권한이 필요합니다. 회사별 접근 권한은 그대로 유지됩니다.']},
  {id:'free',title:'무료 이용과 회사 모드',keywords:['무료','구독','요금','비용','체험','저장','회사모드','샘플'],steps:['구현된 기능은 월 구독료와 체험 만료 없이 이용합니다. 등록량과 저장공간의 운영 한도는 유지됩니다.','샘플은 현재 브라우저에 저장되며 실제 다른 사용자와 공유되지 않습니다. 회사 공유는 로그인과 해당 회사 권한이 필요합니다.','제공하지 않는 자동 결제·자동 메일 기능을 가이드가 대신 실행하지는 않습니다.']},
 ];
}
const normalize=(s:string)=>s.toLowerCase().replace(/[\s·?!？。.,]/g,'');
export function searchGuide(product:GuideProduct,query:string,internal=true):GuideTopic[]{
 const q=normalize(query.trim().slice(0,300));if(!q)return [];
 return guideTopics(product,internal).map((t,i)=>({t,i,score:t.keywords.reduce((n,k)=>n+(q.includes(normalize(k))?normalize(k).length:0),0)+(q.includes(normalize(t.title))?20:0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,3).map(x=>x.t);
}
