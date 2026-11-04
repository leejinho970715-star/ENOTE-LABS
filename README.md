# ENOTE-LABS CEO ERP

CEO 로그인형 AI UNIVERSE ERP의 별도 호스팅용 소스입니다.

- Node 24 Docker, 단일 인스턴스, HTTPS 도메인, 영구 디스크가 필요합니다.
- 시작 명령은 `node scripts/start-hosted.mjs`입니다. 웹과 백그라운드 워커가 하나의 SQLite 파일을 공유합니다.
- `APP_ORIGIN`은 최종 HTTPS 주소, `AI_UNIVERSE_DB`는 영구 디스크의 절대 파일 경로입니다.
- 새 환경의 `CEO_PASSWORD_HASH`와 `SESSION_SECRET`은 호스트의 비밀 설정에 직접 넣습니다. `.env` 파일은 Git에 올리지 않습니다.
- 시작하기 전에 SQLite 온라인 백업으로 만든 일관된 스냅샷을 호스트의 비공개 전송 경로로 복원합니다. 호스팅 검증은 새 테스트용 DB로 먼저 진행합니다.
- 배포 후 `/api/health`에서 워커 상태를 확인하고, 미인증 접근 차단, CEO 로그인, 저장·재시작 후 데이터 유지, 백업 복원을 검증합니다.
- 유료 AI 실행에는 별도의 키·모델·단가 설정과 CEO 승인 절차가 적용됩니다.

저장소에는 소스와 가상 프로필만 포함합니다. 내부 기록, 로컬 데이터베이스, 로그인 안내 및 비밀 값은 호스트에서 별도로 관리합니다.
