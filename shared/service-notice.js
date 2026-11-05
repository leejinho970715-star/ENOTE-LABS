export const demoOffer='4개 제품의 데모 체험은 무료입니다. 비용은 별도로 합의한 제작 의뢰에만 발생합니다.';
export const demoPrivacy='가상의 고객·직원·연락처·문서로 체험해 주세요. 실제 개인정보, 급여·계좌 정보, 민감한 계약서는 입력하거나 올리지 마세요.';
export const cloudNotice='회사 모드에 입력한 자료는 해외 서버(현재 호주 시드니)에 저장됩니다. 실제 업무 도입은 저장 위치·권한·보관·삭제·복구 조건을 확인한 뒤 상담해 주세요.';
export const noticeHTML=({workspace=false}={})=>`<aside class="service-notice${workspace?' workspace-notice':''}" aria-label="무료 데모와 자료 안내"><strong>${demoOffer}</strong><p>${demoPrivacy}</p><p>${cloudNotice}</p><a href="https://enote-labs.vercel.app/legal/privacy/" target="_blank" rel="noopener noreferrer">자료 처리·삭제 요청 안내 ↗</a></aside>`;
