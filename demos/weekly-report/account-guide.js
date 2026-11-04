const topics = [
  ['회사 공간', '새 회사 이름을 입력하고 ‘회사 공간 만들기’를 누르세요. 여러 회사에 속해 있다면 현재 회사를 먼저 확인하세요.'],
  ['고객과 프로젝트', '고객을 먼저 등록한 뒤, 그 고객에 연결할 프로젝트를 만드세요.'],
  ['보고서 검수', '보고서에서 대상 프로젝트와 기간을 확인하고 자료를 검수하세요. 작성자와 검수자의 권한은 다를 수 있습니다.'],
  ['팀원과 권한', '회사 소유자는 가입한 팀원의 아이디를 입력해 권한을 부여할 수 있습니다.'],
];

export function mountAccountGuide(host) {
  const guide = document.createElement('div');
  guide.innerHTML = `<button type="button" class="account-guide-toggle" aria-haspopup="dialog" aria-controls="account-guide"><span aria-hidden="true">?</span> 사용 가이드</button>
  <dialog id="account-guide" class="account-guide-dialog" aria-labelledby="account-guide-title">
  <header><h2 id="account-guide-title">Flownote 사용 가이드</h2><form method="dialog"><button aria-label="사용 가이드 닫기">닫기</button></form></header>
  ${topics.map(([title,body])=>`<details><summary>${title}</summary><p>${body}</p></details>`).join('')}
  <a class="button outline" href="https://enote-labs.vercel.app/manuals/flownote-guide-current-20261103b.pdf" target="_blank" rel="noopener noreferrer">제품소개서 보기 ↗</a>
  </dialog>`;
  const button=guide.querySelector('.account-guide-toggle'),dialog=guide.querySelector('dialog');
  button.addEventListener('click',()=>dialog.showModal());
  host.append(guide);
}
