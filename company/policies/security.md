# security

비밀정보는 서버 환경변수에 보관한다. OAuth refresh token은 환경변수, 단기 access token은 서버 메모리에만 둔다. API 응답과 모델 출력은 불신 데이터로 취급한다. 모델에는 셸·임의 HTTP·자격증명 도구를 부여하지 않는다. 모든 외부 요청은 고정 서비스 호스트와 허용된 작업만 사용한다. CEO 로그인·HttpOnly SameSite cookie·Origin 검사·로그인 속도 제한을 적용한다. 로컬 전용 실행이며 인터넷 공개 전 TLS, 접근 통제, 비밀관리 인프라 검토가 필요하다.
