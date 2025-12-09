# search-github

# TODO

- [] 사용자 또는 조직만 검색
- [] 계정 이름, 성명 또는 메일로 검색
- [] 사용자가 소유한 리포지토리 수로 검색
- [] 위치별 검색
- [] 사용 언어로 검색
- [] 개인 계정을 만든 시점별 검색
- [] 팔로워 수로 검색
- [] 후원 가능 여부를 기준으로 검색

# Dev Condition

- [] 시스템 연동 다크 모드 지원
- [] 스크린: SM / MD / LG / XL 지원
- [] 머터리얼 디자인 칼라 팔레트 지원
- [] 폰트 폴백: 애플 기본 > Noto
- [] UI 컴포넌트는 MUI 사용, UI 컴포넌트 레이아웃은 Tailwind CSS 사용
- [] 정렬 조건: 기본, followers, repositories, joined 지원 + DESC
- [] 페이징 처리: SSR 로 첫페이지 선 랜더링, 이후 CSR 로 무한 스크롤
- [] 사용자 아바타 이미지 처리: HTML5 Canvas + WebAssembly 를 통해 랜더링
- [] Jest 를 통한 유닛 테스트 지원
- [] Cypress 를 통한 E2E 테스트 지원
- [] 모든 GitHub 호출은 서버 라우트에서 Authorization: token 사용
- [] 레이트리밋 초과 시 재시도, 남은 쿼터 노출

# Test Condition

- [] 필수 테스트 대상
  - [] 검색 쿼리, 정렬, 페이징 로직
  - [] 데이터 매핑, 표시 안전성
  - [] SSR, CSR 경계 로직
- [] (옵션, 추가점수) 위 내용 외에 추가 테스트 건당 추가 점수를 부여합니다.

# Submission

- [] 전체 소스코드
- [] README.md
  - [] 실행 및 테스트 방법
  - [] 구현 스펙 명세
  - [] MUI 와 Tailwind CSS 같이 사용할 때 주의할 점
- [] 사용한 프롬프트
  - [] 모든 프롬프트는 prompts/used_prompts.md 에 정리
- [] 테스트코드 (필수)
  - [] 단위 테스트 또는 통합테스트, E2E 테스트 지원

# Skill

- [x] Clean Architecture + Modularity
- [x] pnpm + turbo
- [x] ESLint + Prettier
- [x] ES2023 + Next.js + TypeScript (Next.js App Router)
- [] MUI + Tailwind CSS
- [] Redux Toolkit
- [] Cypress + Jest

# 작업순서 기록

- `pnpm create next-app@latest my-app --yes` 프로젝트 설정
- `https://api.github.com/search/users` 연결 테스트
- prompt: Clean Architecture + Modularity
- Clean Architecture 스캐폴딩 시작
- prettier, import ordering 셋팅
- prompt: server 레벨에서만 Authorization 호출하는 방식 -> next.js route 사용
