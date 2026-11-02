const origin =
  process.env.NEXT_PUBLIC_AGENCY_URL ||
  "https://agencyflow-studio-dun.vercel.app";
export default function Home() {
  return (
    <>
      <header className="public-header">
        <a className="af-brand" href="/">
          <img src="/favicon.svg" alt="" />
          <span className="brand-copy">
            ProjectFlow<small>PMS · Project &amp; Feedback</small>
          </span>
        </a>
        <nav>
          <a href="#workflow">어떻게 쓰나요?</a>
          <a href="#pricing">무료 이용 · 맞춤 제작</a>
          <a className="button primary" href="/workspace/">
            샘플로 체험
          </a>
        </nav>
      </header>
      <main className="public-main">
        <section className="public-hero">
          <div>
            <span className="eyebrow">FOR EVERY PROJECT</span>
            <h1>
              프로젝트의 시작부터,
              <br />
              완료까지 <em>한 흐름으로.</em>
            </h1>
            <p>
              컨설팅·교육·행사·운영 개선·제작 업무까지.
              <br />
              담당자와 일정, 작업 진척을 확인하고 필요한 자료를 함께 검토하세요.
            </p>
            <div className="actions">
              <a className="button primary" href="/workspace/">
                샘플 프로젝트 열기 ↗
              </a>
              <a className="button" href="/workspace/?mode=cloud">
                회사 계정으로 시작
              </a>
        <a
          className="button"
          href="/manuals/agencyflow-guide-charts-20261101.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          제품소개서 보기 ↗
        </a>
            </div>
            <small>
              샘플은 가상 자료입니다. 회사 계정은 초기 검증 단계이며 이메일
              설정이 필요합니다.
            </small>
          </div>
          <div className="hero-window">
            <div className="window-top">
              <span>ProjectFlow · 프로젝트 운영</span>
              <b>샘플 화면</b>
            </div>
            <img src="/product-assets/projectflow-dashboard.jpg" alt="ProjectFlow 프로젝트·일정·작업 현황의 실제 가상 샘플 화면" />
            <div className="hero-comment">
              <b>담당자 · 기한 · 진행 상황</b>
              <p>다음 확인할 업무를 한눈에.</p>
              <span>접수 → 실행 → 검토 → 완료</span>
            </div>
          </div>
        </section>
        <section id="workflow" className="public-section">
          <span className="eyebrow">PLAN. DO. REVIEW.</span>
          <h2>업종이 달라도, 프로젝트의 기본은 같습니다.</h2>
          <div className="feature-grid">
            {[
              [
                "01",
                "프로젝트를 계획하세요",
                "고객 또는 요청 부서, 담당자와 시작일·마감일·현재 단계를 정합니다.",
              ],
              [
                "02",
                "작업과 기한을 관리하세요",
                "프로젝트별 작업을 배정하고 상태·우선순위를 확인합니다. 전체 작업도 모아볼 수 있습니다.",
              ],
              [
                "03",
                "진척과 결과물을 확인하세요",
                "등록 작업의 완료율과 기한 초과를 확인하고, 필요한 경우 이미지 자료를 함께 검토합니다.",
              ],
            ].map(([n, t, d]) => (
              <article key={n}>
                <span className="eyebrow">{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="public-section split-section">
          <div>
            <span className="eyebrow">BUILT FOR DIFFERENT TEAMS</span>
            <h2>
              고객과 프로젝트,
              <br />
              견적까지 한 흐름으로.
            </h2>
          </div>
          <div>
            <p>
              컨설팅·교육·행사·사내 운영·제작 팀이 함께 사용할 수 있습니다.
              프로젝트별 담당자·마감일·작업 완료율과 선택적인 자료 검토·견적을
              연결합니다.
            </p>
            <p>
              실제 사이트를 URL만으로 검수하거나 스크린샷을 자동 수집하는 기능은
              아직 제공하지 않습니다. 시안·스크린샷 검토는 프로젝트에서
              선택적으로 사용합니다.
            </p>
          </div>
        </section>
        <section id="pricing" className="public-section">
          <span className="eyebrow">FREE TO EXPLORE</span><h2>먼저 무료로, 우리 업무에 맞는지 확인하세요.</h2>
          <p>구현된 프로젝트·작업·피드백·견적 기능은 월 구독료와 체험 만료 없이 이용할 수 있습니다.</p>
          <div className="actions"><a href="/workspace/" className="button primary">무료 데모 열기</a><a href="https://enote-labs.vercel.app/#pricing" className="button">맞춤 제작 KRW 200,000~500,000 ↗</a></div>
          <p className="muted">회사 공유는 로그인·팀 권한이 필요합니다. 활성 프로젝트 100개·내부 10명·시안 총 1GB, 파일당 5MB의 운영 한도가 있습니다. 맞춤 제작비는 부가세 별도이며 호스팅·외부 서비스 사용료는 별도입니다.</p>
        </section>
        <section className="public-section public-faq">
          <h2>도입 전에 확인하세요.</h2>
          <details>
            <summary>고객은 어떻게 참여하나요?</summary>
            <p>
              고객은 지정된 프로젝트의 Client 권한으로 무료 참여합니다. 현재는 가입한 고객의 아이디를
              관리자가 프로젝트에 연결하는 방식입니다. 비회원 공유 링크는
              제공하지 않습니다.
            </p>
          </details>
          <details>
            <summary>웹사이트를 URL만 넣어 검수할 수 있나요?</summary>
            <p>
              현재는 이미지·스크린샷 업로드 방식입니다. 실제 사이트 자동 검수는
              설치 스크립트·확장 기능 또는 별도 수집 서버가 필요하며 제공하지
              않습니다.
            </p>
          </details>
          <details>
            <summary>온라인 승인은 전자서명인가요?</summary>
            <p>
              시안·견적의 버전별 확인 기록입니다. 계약 전자서명 서비스 연동이나
              법률 검토를 완료한 계약서 기능이 아닙니다.
            </p>
          </details>
          <details>
            <summary>지금 실제 고객 자료를 넣어도 되나요?</summary>
            <p>
              회사별 권한 분리와 비공개 시안 저장을 구현한 초기 검증판입니다.
              결제·운영 복구 검증과 국외 개인정보 처리 조건의 운영 확인이 남아
              있습니다. 우선 익명화한 자료로 검증하세요.
            </p>
          </details>
        </section>
      </main>
      <footer className="public-footer">
        <a className="af-brand" href="/">
          ProjectFlow
        </a>
        <p>프로젝트의 다음 일이 명확하게.</p>
        <a href="https://t.me/evanlee97">도입 문의 ↗</a>
        <a href="https://flow-note-psi.vercel.app/workspace/">
          Flownote 보고 자동화 ↗
        </a>
      </footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                name: "ProjectFlow",
                url: origin,
                inLanguage: "ko-KR",
              },
              {
                "@type": "SoftwareApplication",
                name: "ProjectFlow",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                url: origin,
                description:
                  "다양한 업종의 프로젝트·일정·작업 진척과 자료 피드백을 관리하는 PMS. 초기 검증판이며 결제·자동 웹 검수는 준비 중.",
              },
            ],
          }).replaceAll("<", "\\u003c"),
        }}
      />
    </>
  );
}
