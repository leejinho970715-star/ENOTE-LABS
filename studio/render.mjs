import { legalFooter, legalDialogs } from "./legal.mjs";
const origin = "https://enote-labs.vercel.app";
const metaTitle = "ENOTE-LABS | ERP·PMS·CRM·그룹웨어와 맞춤 업무 시스템";
const metaDescription =
  "작은 팀의 ERP·PMS·CRM·그룹웨어 맞춤 구축부터 전자 카탈로그 구축·E-book 제작까지. ENOTE-LABS에서 업무와 고객에게 전할 자료를 함께 정리하세요.";
const shareTitle = "ENOTE-LABS | 우리 회사에 맞는 업무 시스템";
const shareDescription =
  "우리 회사에 맞는 업무 시스템과 고객에게 전할 디지털 자료. 무료 제품 체험부터 맞춤 개발·전자 카탈로그·E-book 제작까지 ENOTE-LABS에 상담하세요.";
export const products = [
  {
    id: "flownote",
    screen: "flownote-screen-charts-20261101.jpg",
    name: "Flownote",
    category: "ERP",
    ko: "플로노트",
    tag: "보고 · 프로젝트 운영",
    color: "#c65a22",
    bg: "#fff0e2",
    title: "아침마다 모으던 자료,<br>보고할 내용만 남기세요.",
    desc: "고객과 프로젝트의 진행 상황을 정리하고, 보고할 내용을 한곳에서 확인하세요. 작은 대행사의 반복 보고 업무부터 시작합니다.",
    items: [
      "고객·프로젝트 현황 정리",
      "CSV 검사·서버 합계 재계산·버전 저장",
      "독립 검수·승인본 HTML·CSV 내보내기",
    ],
    note: "체험판 · 외부 광고 계정 자동 수집은 별도 연동 범위",
    url: "https://flow-note-psi.vercel.app/workspace/",
    icon: "report",
    tile: "아침마다 반복되는<br>자료 취합과 보고 준비.",
    chip: "반복 정리는 줄이고",
    sub: "확인해야 할 일은 더 선명하게.",
  },
  {
    id: "agencyflow",
    screen: "agencyflow-screen-charts-20261101.jpg",
    name: "ProjectFlow",
    category: "PMS",
    ko: "ProjectFlow",
    tag: "프로젝트 · 작업 · 피드백",
    color: "#c65a22",
    bg: "#fff0e2",
    title: "업종은 달라도,<br>프로젝트의 흐름은 명확하게.",
    desc: "컨설팅, 교육, 행사, 운영 개선과 제작 프로젝트까지. 담당자·일정·단계·작업 진행률을 관리하고, 필요한 프로젝트에서는 자료 검토와 고객 피드백을 이어가세요.",
    items: [
      "프로젝트 검색·단계별 보드·진척 확인",
      "버전별 수정 이력과 고객 승인",
      "운영 플래너·월간 일정·CSV·캘린더 파일",
    ],
    note: "초기 검증판 · 결제·전자서명·웹 자동 검수는 준비 중",
    url: "https://agencyflow-studio-dun.vercel.app/",
    icon: "feedback",
    tile: "어느 부분을 고칠지,<br>같은 화면을 보며 정확하게.",
    chip: "이 버튼의 색상을 바꿔주세요.",
    sub: "위치와 맥락이 남는 고객 피드백.",
  },
  {
    id: "follonote",
    screen: "follonote-screen-charts-20261101.jpg",
    name: "Follonote",
    category: "CRM",
    ko: "Follonote",
    tag: "영업 · 고객 관리",
    color: "#c65a22",
    bg: "#fff0e2",
    title: "좋은 상담이,<br>다음 연락으로 이어지게.",
    desc: "영업 담당자가 바뀌어도 고객의 맥락이 남도록. 상담 기록과 진행 단계, 다음 연락 날짜를 연결하는 간결한 영업 CRM입니다.",
    items: [
      "고객별 연락처와 상담 기록",
      "영업 파이프라인·고객 활동 타임라인",
      "후속 연락 기한 점검·조회 범위 내보내기",
    ],
    note: "초기 검증판 · 기회 금액은 입력값이며 매출 예측이 아닙니다.",
    url: "https://flownote-studio.vercel.app/follonote/",
    icon: "crm",
    tile: "고객과 나눈 이야기,<br>다음 연락까지 놓치지 않게.",
    chip: "다음 행동이 있는 고객 관리",
    sub: "누구에게, 언제, 무엇을 연락할지.",
  },
  {
    id: "crewmemo",
    screen: "crewmemo-screen-charts-20261101.jpg",
    name: "Crewmemo",
    category: "Groupware",
    ko: "Crewmemo",
    tag: "그룹웨어 · 팀 협업",
    color: "#c65a22",
    bg: "#fff0e2",
    title: "흩어진 팀 소식,<br>함께 움직이는 하루로.",
    desc: "메신저 위로 밀려난 공지와 구두로 끝난 결정을 기록으로 남기세요. 공지, 팀 일정, 내부 결재와 담당 업무를 모았습니다.",
    items: [
      "팀 공지·월간 일정·캘린더 파일",
      "결재 요청 양식·지정 결재자의 승인·반려 기록",
      "담당자·마감일이 있는 팀 업무",
    ],
    note: "초기 검증판 · 급여·근태·회계·전자서명은 제공하지 않습니다.",
    url: "https://flownote-studio.vercel.app/crewmemo/",
    icon: "team",
    tile: "공지와 일정, 결재와 업무를<br>우리 팀의 한 공간에.",
    chip: "결정은 기록으로 남겨두세요.",
    sub: "작성자와 결재자가 구분되는 승인 흐름.",
  },
];
const btn = (label, url, cls = "dark") =>
  `<a class="btn ${cls}" href="${url}" ${url.endsWith(".pdf") ? 'target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`;
const browser = (p) =>
  `<div class="browser mac-browser mock-motion"><div class="mac-toolbar"><div class="mac-controls" aria-hidden="true"><i></i><i></i><i></i></div><div class="mac-address"><span aria-hidden="true">⌑</span>${p.name} · 실제 제품 화면</div><span class="mac-menu" aria-hidden="true">⋯</span></div><a class="screen-preview" data-screen-preview href="/assets/${p.screen}" aria-label="${p.name} 화면 확대"><img src="/assets/${p.screen}" alt="${p.ko} 실제 제품의 가상 샘플 화면 캡처" width="1280" height="720" loading="lazy"></a></div>`;
const heading = (tag, title, desc = "") =>
  `<div class="section-title reveal"><span class="eyebrow">${tag}</span><h2>${title.replaceAll("<em>", "<em data-typewriter>")}</h2>${desc ? `<p>${desc}</p>` : ""}</div>`;
const clay = (name) =>
  `<img class="clay-icon" src="/assets/clay/${name}.webp" alt="" width="64" height="64" decoding="async">`;
const productShowcase = `<section class="section wrap product-section" id="products">${heading("FIND YOUR WORKFLOW", "우리 팀에 맞는 제품,<br><em>탭으로 살펴보세요.</em>", "보고·프로젝트 관리부터 영업과 팀 협업까지.<br>실제 제품의 가상 샘플 화면으로 확인하세요.")}<div class="product-tabs" role="tablist" aria-label="제품 종류" aria-orientation="horizontal">${products.map((p, i) => `<button type="button" role="tab" id="tab-${p.id}" aria-controls="${p.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-product="${p.id}"><span class="tab-symbol" aria-hidden="true">${clay(p.icon)}</span><span><b>${p.name}</b><small><strong>${p.category}</strong><br>${p.tag}</small></span></button>`).join("")}</div><div class="product-panels">${products.map((p, i) => `<article class="feature-card product-panel" id="${p.id}" role="tabpanel" aria-labelledby="tab-${p.id}" tabindex="0" data-product-panel><div class="feature-copy"><span class="product-label">0${i + 1} / ${p.name.toUpperCase()} · ${p.category}</span><h2>${p.title}</h2><p>${p.desc}</p><ul>${p.items.map((s) => `<li>${s}</li>`).join("")}</ul><div class="actions">${btn(p.name + " 로그인하고 시작 ↗", p.id === "flownote" ? "/flownote/account.html" : (p.id === "agencyflow" ? "/projectflow/workspace/?mode=cloud" : "https://enote-labs.vercel.app/" + p.id + "/workspace/?mode=cloud"))}${btn("제품소개서 보기 ↗", "/manuals/" + p.id + "-guide-charts-20261101.pdf", "white")}</div><small>${p.note}</small></div><div class="feature-visual">${browser(p)}<div class="visual-note"><span aria-hidden="true">${clay(p.icon)}</span><div><b>${p.chip}</b><p>${p.sub}</p></div></div><a class="screen-original" href="/assets/${p.screen}" target="_blank" rel="noopener noreferrer">실제 캡처 크게 보기 ↗</a></div></article>`).join("")}</div><p class="caption">실제 제품을 캡처한 가상 자료 화면입니다. 제품 화면의 고유 색상은 유지했습니다.<br>제품별 기능과 제공 범위는 소개서에서 확인하세요.</p><p class="sr-only" id="product-tab-status" aria-live="polite"></p></section>`;
const digitalServices = [
  {name:"전자 카탈로그 구축",tag:"DIGITAL CATALOG",icon:"catalog-20261102",amount:300000,price:"KRW 300,000부터",desc:"보유한 카탈로그를 웹에서 열고, 링크로 공유하고, 문의로 이어가세요.",items:["기본형: 제공 PDF 최대 20페이지 · 웹 열람 페이지","다운로드·문의 링크·QR 이미지 1개 · 수정 1회","상품 소개 웹 1페이지 신규 구축은 KRW 500,000부터"],use:"추천: 제조·유통사, 전문 서비스 회사의 영업 자료"},
  {name:"E-book 제작",tag:"BUSINESS E-BOOK",icon:"ebook-20261102",amount:200000,price:"KRW 200,000부터",desc:"제품 사용법과 교육 내용을 목차가 있는 한 권의 PDF로.",items:["기본형: 표지 포함 최대 12페이지 · PDF 1종","템플릿 표지·내지 편집 · 클릭형 목차·링크 · 수정 1회","제공 원고 기준 · 집필·번역·EPUB 변환 별도"],use:"추천: 제품 매뉴얼, 고객 교육, 팀 온보딩 안내서"},
];
const digitalSection = `<section class="section digital-section wrap" id="digital">${heading("DIGITAL SALES & KNOWLEDGE", "잘 만든 자료도,<br><em>일을 이어주는 도구입니다.</em>", "업무 시스템에서 고객에게 전할 자료까지.<br>영업에 쓰는 전자 카탈로그와 교육에 쓰는 E-book을 제작합니다.")}<div class="digital-grid">${digitalServices.map(p=>`<article class="digital-card reveal"><span class="digital-symbol" aria-hidden="true">${clay(p.icon)}</span><span class="eyebrow">${p.tag}</span><h3>${p.name}</h3><p>${p.desc}</p><strong class="digital-price">${p.price}</strong><ul>${p.items.map(t=>`<li>${t}</li>`).join("")}</ul><p class="digital-use">${p.use}</p>${btn("제작 범위 상담 ↗","#contact","white")}</article>`).join("")}</div><p class="caption">1회 제작비 · 부가세 별도. 호스팅·도메인·유료 이미지·추가 수정은 별도 협의합니다.<br>열람 통계, CRM 연결, 정기 업데이트는 필요한 경우 별도 범위로 상담합니다.</p></section>`;
const faq = [
  ["전자 카탈로그와 E-book은 무엇을 제공하나요?", "전자 카탈로그는 보유 PDF의 웹 열람 페이지 또는 상품·서비스 소개용 반응형 웹 페이지, E-book은 제품 매뉴얼·고객 교육 자료를 담은 PDF입니다. 제공 원고와 이미지를 바탕으로 제작하며 집필·출판 유통·관리자·결제 기능은 기본 범위에 포함되지 않습니다."],
  [
    "PMS, ERP, GW(그룹웨어), CRM은 어떻게 다른가요?",
    "<strong>PMS · 프로젝트 관리</strong><br>누가, 언제까지, 어떤 일을 할지 관리합니다. 일정·담당자·진행률을 보는 ProjectFlow가 해당합니다.<br><br><strong>ERP · 전사 자원 관리</strong><br>회사의 회계·구매·재고 등 여러 업무와 자원을 통합 관리합니다. Flownote는 고객·프로젝트·보고에 집중한 ERP형 도구이며 회계·급여는 별도 범위입니다.<br><br><strong>GW · 그룹웨어</strong><br>공지·공유 일정·전자결재처럼 팀 내부의 소통과 협업을 돕습니다. Crewmemo가 해당합니다.<br><br><strong>CRM · 고객 관계 관리</strong><br>고객 정보·상담 내용·영업 단계·다음 연락을 관리합니다. Follonote가 해당합니다.",
  ],
  [
    "어떤 회사에 잘 맞나요?",
    "엑셀과 메신저로 고객·프로젝트·보고를 관리하는 작은 대행사, 디자인·제작 스튜디오, 컨설팅팀에 권합니다. 복잡한 회계·급여 전체 교체가 목적이라면 먼저 필요한 범위를 확인합니다.",
  ],
  [
    "네 제품의 데이터가 자동으로 연결되나요?",
    "공통 회사 공간에서 고객·프로젝트·팀 업무를 연결하고, 인수인계 점검에서 미연결·미배정·미검수 항목을 확인합니다. Flownote 회사 연결은 양쪽 관리자 권한을 확인한 뒤 설정하며, 연결할 항목을 선택해 재사용합니다.",
  ],
  [
    "설치해서 쓰나요, 웹에서 쓰나요?",
    "기본은 웹 접속 방식입니다. 소스 인수, 회사 서버 설치, 별도 도메인이나 독립 운영 환경은 도입 범위에 따라 협의합니다. 체험 화면과 실제 회사 데이터 공간은 구분됩니다.",
  ],
  [
    "지금 바로 결제하고 사용할 수 있나요?",
    "제품과 샘플의 구현된 기능은 로그인 후 무료로 사용할 수 있습니다. 이름·아이디·비밀번호로 가입하면 바로 제품에 로그인할 수 있습니다. 회사 공유나 맞춤 제작은 상담해 주세요.",
  ],
  [
    "기존 엑셀이나 사용 중인 서비스를 연결할 수 있나요?",
    "가능 여부는 실제 양식과 해당 서비스의 API 제공 범위를 확인한 뒤 결정합니다. 개인정보를 가린 예시로 먼저 상담하세요. 자동 수집이나 데이터 이전은 기본 포함으로 약속하지 않습니다.",
  ],
];
const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "ENOTE-LABS",
      url: origin + "/",
      publisher: { "@id": origin + "/#organization" },
    },
    {
      "@type": "Organization",
      "@id": origin + "/#organization",
      name: "ENOTE-LABS",
      alternateName: "이노트랩스",
      url: origin,
      logo: origin + "/assets/enote-labs-logo-20261031.png",
      email: "leejinho970715@gmail.com",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "도입 상담",
        email: "leejinho970715@gmail.com",
        url: "https://t.me/evanlee97",
      },
    },
    {
      "@type": "Service",
      name: "기업 맞춤 업무 시스템 구축",
      provider: { "@id": origin + "/#organization" },
      serviceType: "ERP·PMS·CRM 및 업무 자동화 시스템 개발",
      description:
        "업무 진단, 작은 범위 견적, 구축·교육·인수 확인, 유지관리 및 확장",
    },
    ...digitalServices.map(service=>({"@type":"Service",name:service.name,url:origin+"/#digital",description:service.desc,provider:{"@id":origin+"/#organization"},offers:{"@type":"Offer",priceCurrency:"KRW",price:service.amount,description:service.items.join(" · ")+" · 부가세 별도 · 추가 범위 별도 견적"}})),
    {
      "@type": "ItemList",
      name: "ENOTE-LABS 제품",
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
        url: new URL(p.url, origin).href,
      })),
    },
  ],
};
export const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${metaTitle}</title><meta name="description" content="${metaDescription}"><link rel="canonical" href="${origin}/"><meta name="robots" content="index,follow,max-image-preview:large"><meta property="og:type" content="website"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="ENOTE-LABS"><meta property="og:title" content="${shareTitle}"><meta property="og:description" content="${shareDescription}"><meta property="og:url" content="${origin}/"><meta property="og:image" content="${origin}/assets/og-enote-labs-20261031.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png"><meta property="og:image:alt" content="ENOTE-LABS 로고와 오렌지 업무 대시보드 샘플"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${shareTitle}"><meta name="twitter:description" content="${shareDescription}"><meta name="twitter:image:alt" content="ENOTE-LABS 로고와 오렌지 업무 대시보드 샘플"><meta name="twitter:image" content="${origin}/assets/og-enote-labs-20261031.png"><meta name="theme-color" content="#f57832"><link rel="icon" href="/assets/enote-labs-icon-32-20261031.png" type="image/png"><link rel="apple-touch-icon" href="/assets/enote-labs-icon-180-20261031.png"><link rel="preload" href="/assets/PretendardVariable.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/style.css?v=enote-20261103-username"><script type="module" src="/main.js?v=enote-20261103-username"></script><script type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script></head><body><a class="skip" href="#main">본문 바로가기</a><header class="header"><a class="brand" href="/" aria-label="ENOTE-LABS 홈"><img src="/assets/enote-labs-logo-20261031.png" alt="" width="32" height="32">ENOTE-LABS<span>이노트랩스</span></a><nav aria-label="주 메뉴"><a href="#products">제품</a><a href="#custom">맞춤 구축</a><a href="#digital">디지털 자료</a><a href="#pricing">도입 비용</a>${btn("업무 상담 ↗", "#contact", "small dark")}</nav></header><nav class="mobile-section-nav" aria-label="모바일 바로가기"><a href="#products">제품</a><a href="#custom">맞춤 구축</a><a href="#digital">자료 제작</a><a href="#pricing">도입 비용</a></nav><main id="main">
<section class="hero"><div class="wrap hero-inner"><div class="hero-copy reveal"><span class="eyebrow pill">LESS BUSYWORK. MORE FLOW.</span><h1>흩어진 일을 모아,<br><em data-typewriter>일이 흐르게.</em></h1><p>작은 팀의 보고·프로젝트·고객·협업 업무를<br class="desktop"> 필요한 제품과 맞춤 구축으로 정리합니다.</p><div class="actions">${btn("우리 팀에 맞는 제품 찾기 ↗", "#products", "orange")}${btn("맞춤 구축 상담", "#contact", "white")}</div><small>로그인 후 샘플을 확인하고, 작은 파일럿 범위를 상담하세요.</small></div><div class="hero-stage"><div class="glow peach"></div><div class="glow yellow"></div><div class="floating-chip chip-left"><span class="chip-icon" aria-hidden="true">${clay("report")}</span><div><b>보고 준비는 가볍게</b><span>모으고, 확인하고, 공유하세요.</span></div></div><div class="laptop mock-motion"><div class="laptop-display"><div class="mac-toolbar"><div class="mac-controls" aria-hidden="true"><i></i><i></i><i></i></div><div class="mac-address">Flownote · 실제 제품 화면</div><span class="mac-menu" aria-hidden="true">⋯</span></div><a class="screen-preview" data-screen-preview href="/assets/flownote-erp-orange-20261031.jpg" aria-label="Flownote 메인 화면 확대"><img src="/assets/flownote-erp-orange-20261031.jpg" alt="Flownote 보고서와 프로젝트 현황을 확인하는 실제 샘플 대시보드" width="1280" height="720" fetchpriority="high"></a></div><div class="laptop-base"></div></div><div class="floating-chip chip-right"><span class="check" aria-hidden="true">${clay("check")}</span><div><b>다음 할 일이 명확하게</b><span>기록에서 실행까지, 한 화면에.</span></div></div></div></div></section><section class="capabilities" aria-label="ENOTE-LABS 업무 솔루션"><div class="wrap capability-grid reveal">${[
  ["report", "보고 자동화"],
  ["feedback", "고객 피드백"],
  ["crm", "영업 CRM"],
  ["team", "팀 그룹웨어"],
  ["custom", "맞춤 ERP · PMS"],
]
  .map(
    ([icon, label]) =>
      `<article class="capability-item">${clay(icon)}<h2>${label}</h2></article>`,
  )
  .join("")}</div></section>
${productShowcase}
<section class="section custom-section" id="custom"><div class="wrap custom-grid"><div class="reveal"><span class="eyebrow">BUILT AROUND YOUR BUSINESS</span><h2>프로그램에 회사를 맞추지 말고,<br><em>회사에 맞게 만드세요.</em></h2><p>대행사는 자료 취합과 보고를,<br>제작사는 수정 요청과 납품을,<br>컨설팅사는 계약부터 결과물 승인을.</p><p>실제로 쓰는 엑셀과 업무 과정을 보고,<br>가장 먼저 줄일 반복 업무 하나를 정합니다.</p>${btn("우리 업무로 상담하기 ↗", "#contact", "orange")}</div><ol class="steps reveal">${[
  ["업무 진단", "현재 엑셀·처리 과정·반복 작업을 확인합니다."],
  ["작은 범위 견적", "우선 해결할 업무 하나와 완료 기준을 합의합니다."],
  ["구축 · 교육 · 인수 확인", "실제 사용 흐름을 함께 확인하고 전달합니다."],
  ["유지관리와 추가 확장", "운영하면서 필요한 업무를 순서대로 넓힙니다."],
]
  .map(
    ([t, d], i) =>
      `<li><span>0${i + 1}</span><div><h3>${t}</h3><p>${d}</p></div></li>`,
  )
  .join("")}</ol></div></section>
${digitalSection}
<section class="section wrap" id="pricing">${heading("CUSTOM DEVELOPMENT", "필요한 업무만,<br>우리 회사에 맞게.", "네 가지 데모를 바탕으로 화면과 업무 흐름을 맞춤 제작합니다. 아래 금액은 월 구독료가 아닌 1회 제작비입니다.")}<div class="pricing-grid">${[
 {tag:'START',title:'화면·양식 맞춤',price:'KRW 200,000',desc:'데모 화면 한 곳을 우리 업무에 맞게 바꿉니다.',items:['필드·문구·컬러 조정','목록 또는 입력 양식 1개','수정 1회 · 사용 안내']},
 {tag:'WORKFLOW',title:'작은 업무 흐름 구축',price:'KRW 350,000',desc:'고객 등록부터 업무 확인까지 짧은 흐름을 만듭니다.',items:['기존 데모 기반 화면 최대 2개','기존 기능의 입력·조회 흐름 조정','수정 2회 · 사용 안내']},
 {tag:'CONNECT',title:'업무 연결 맞춤',price:'KRW 500,000',desc:'데모의 연관 기능을 회사 방식에 맞춰 연결합니다.',items:['기존 데모 기반 화면 최대 3개','기존 데이터 연결 1개 흐름','검수 기준·인수 범위 사전 합의']}
].map((p,i)=>`<article class="price-card ${i===1?'featured':''} reveal"><span class="eyebrow">${p.tag}</span><h3>${p.title}</h3><div class="price text-price">${p.price}</div><p>${p.desc}</p><ul>${p.items.map(t=>`<li>${t}</li>`).join('')}</ul>${btn('맞춤 제작 상담','#contact',i===1?'orange':'white')}</article>`).join('')}</div><p class="caption">부가세 별도 · 계약 전 범위와 총액을 확정합니다. 신규 대규모 ERP, 외부 API·AI 사용료, 호스팅·도메인·유지관리는 위 제작비에 포함되지 않습니다.</p><div class="subscription-note reveal"><b>로그인 후 4개 제품의 구현된 기능을 무료로 체험하세요.</b><p>월 구독료와 체험 만료 없이 살펴볼 수 있습니다. 회사 공유는 로그인과 팀 권한이 필요하며 저장공간·등록량에는 운영 한도가 있습니다.</p>${btn('로그인 후 인수인계 점검','/suite/','white small')}</div></section>
<section class="section faq wrap" id="faq">${heading("QUESTIONS, ANSWERED", "자주 묻는 질문")}<div class="faq-list reveal">${faq.map(([t, d]) => `<details><summary>${t}</summary><p>${d}</p></details>`).join("")}</div></section>
<section class="contact-section wrap reveal" id="contact"><div><span class="eyebrow">LET'S MAKE WORK FLOW</span><h2>필요한 업무나 자료,<br>하나만 알려주세요.</h2><p>“고객에게 보여줄 상품 소개 자료가 필요해요.”<br>이 정도의 설명이면 시작하기 충분합니다.</p><a class="btn orange" href="https://t.me/evanlee97" target="_blank" rel="noopener noreferrer">텔레그램으로 문의 ↗</a><a class="btn white contact-email" href="mailto:leejinho970715@gmail.com?subject=ENOTE-LABS%20%EB%8F%84%EC%9E%85%20%EC%83%81%EB%8B%B4">이메일로 문의 ↗</a><small>이메일 또는 텔레그램으로 직접 상담합니다.</small></div><form id="inquiry"><label>관심 있는 제품 또는 업무<select name="product"><option>어떤 제품이 맞을지 상담</option><option>Flownote · 보고 자동화</option><option>ProjectFlow · 프로젝트 관리</option><option>Follonote · 영업 CRM</option><option>Crewmemo · 그룹웨어</option><option>ERP·PMS·CRM 맞춤 구축</option><option>전자 카탈로그 구축</option><option>E-book 제작 · 매뉴얼·교육 자료</option></select></label><label>현재 가장 불편한 일<textarea name="problem" rows="4" placeholder="지금 쓰는 도구와 반복되는 일을 적어주세요." required maxlength="2000"></textarea></label><button class="btn dark" type="submit">문의 내용 복사하기 ⧉</button><p id="form-status" role="status">내용은 서버로 전송되지 않습니다. 복사한 뒤 이메일 또는 텔레그램에 직접 보내주세요.</p></form></section>
<section class="bottom-cta"><div class="glow"></div><span class="eyebrow">YOUR TEAM, IN FLOW.</span><h2>일이 쌓이는 곳에서,<br><em>일이 흐르는 곳으로.</em></h2>${btn("우리 팀의 첫 제품 찾기 ↗", "#products", "orange")}<div class="bottom-objects" aria-hidden="true"><span>${clay("report")}</span><span>${clay("crm")}</span><span>${clay("check")}</span></div></section></main><footer class="footer wrap"><a class="brand" href="/"><img src="/assets/enote-labs-logo-20261031.webp" alt="" width="44" height="44">ENOTE-LABS<span>이노트랩스</span></a><p>팀의 업무를 이해하고, 쓰이는 시스템을 만듭니다.</p><div>${products.map((p) => `<a href="${p.url}">${p.name} ↗</a>`).join("")}<a href="https://t.me/evanlee97">문의 ↗</a></div><address class="footer-contact">대표자 : 이은규<br>문의 : <a href="mailto:leejinho970715@gmail.com">leejinho970715@gmail.com</a> / telegram : <a href="https://t.me/evanlee97" target="_blank" rel="noopener noreferrer">@evanlee97</a></address><a class="admin-entry" href="/admin/">관리자 입장 ↗</a>${legalFooter}<small>2026.10 ENOTE-LABS ALL RIGHTS RESERVED</small></footer>${legalDialogs}<dialog id="screen-dialog" class="screen-dialog" aria-labelledby="screen-dialog-title" aria-describedby="screen-dialog-hint"><header><h2 id="screen-dialog-title">제품 화면</h2><button type="button" data-screen-close aria-label="제품 화면 닫기">닫기 ×</button></header><div class="screen-dialog-body"><button type="button" class="screen-image-close" data-screen-close aria-label="이미지를 클릭하여 닫기"><img alt="제품 가상 샘플 화면"></button><p data-screen-error hidden>이미지를 불러오지 못했습니다. 닫은 뒤 다시 시도해 주세요.</p></div><p id="screen-dialog-hint">이미지 또는 바깥 배경을 클릭하거나 Escape 키를 누르면 닫힙니다.</p></dialog></body></html>`;
