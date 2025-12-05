문서: Supabase refresh token 문제 및 운영 권장사항

목표
- `refresh_token`이 매우 짧게 나오는(reference token) 상황을 진단하는 방법
- 운영 환경에서 `SUPABASE_SERVICE_ROLE_KEY` 기반 fallback 사용 시 보안 권장사항

1) 문제 설명
- 현재 관찰: signIn 응답의 refresh_token 길이가 매우 짧음(예: len≈12).
- 결과: 짧은 refresh_token으로 `/auth/v1/token`에 refresh 요청을 보내면 Supabase에서 400 `bad_json` 또는 400 `invalid_credentials`를 반환하고 세션 갱신 실패.
- 근본 원인: Supabase "Reference Tokens" 모드가 활성화되어 있거나, 프로젝트/플랜/프록시 설정(또는 관리 콘솔 접근 제한)으로 인해 일반 refresh 토큰이 발행되지 않을 수 있음.

2) 진단(콘솔에서 확인)
- Supabase 대시보드 → Authentication → Settings(Advanced Auth)에서 Reference Token 관련 설정을 찾습니다. (일부 설정은 Team/Enterprise 플랜에서만 노출될 수 있습니다.)
- 시간 제한/토큰 재사용 설정(Token reuse, revoke on password change 등)도 점검하세요.
- 프로젝트에서 발급된 토큰을 직접 확인하려면 API로 `signIn`을 호출하고 응답을 확인하세요(개발환경 테스트만).

3) 완화책(이미 코드에 적용된 것)
- 서버 측에서 가능한 경우 `SUPABASE_SERVICE_ROLE_KEY`를 사용해 token refresh 및 admin-write를 수행하도록 코드 변경: 서버 전용(환경변수)으로만 존재해야 하며 클라이언트에 노출되면 안 됩니다.
- 로그를 추가해서 refresh 시도 실패의 상세 사유(bad_json, invalid_credentials 등)를 확인하도록 했습니다.
- 서비스-롤 폴백은 개발 환경에서 기본 허용, 프로덕션에서는 반드시 `ALLOW_SERVICE_ROLE_FALLBACK=true`로 명시적으로 활성화하도록 구현합니다.

4) 운영 권장사항
- 만약 reference token 모드가 의도하지 않은 설정이라면 Supabase 지원팀에 문의하거나 프로젝트 콘솔에서 토글을 변경(가능한 경우)하세요.
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출하지 말고, 동일 키가 배포 환경 변수에만 존재하는지 확인하세요.
- 프로덕션에서 서비스-롤 폴백을 켜려면 운영적 감독과 감사 로그가 필요합니다. `ALLOW_SERVICE_ROLE_FALLBACK=true`를 사용하면서 다음을 권장:
  - 폴백이 사용된 경우에만 특별한 로그/알림을 남기기
  - 폴백 허용 여부를 배포 시 검증(review) 절차에 포함

5) 다음 단계 제안
- 프로젝트에서 reference token이 의도된 설정인지 Supabase 콘솔/지원팀을 통해 확인.
- 필요하면 코드에서 reference token 형태(짧은 token)를 더 견고하게 처리하는 로직 추가(예: refresh token 포맷 검증, early fallbacks 등).
- 운영 환경용 감사 로그 및 모니터링 추가(폴백 사용 빈도/사유 추적).

---
(참고) 이 문서는 `docs/SUPABASE_REFRESH_TOKENS.md`에 추가되었습니다. 필요하면 영어 번역 또는 배포 체크리스트도 만들어 드릴게요.
