# search-github

|검색 필터| 검색 결과 | 재요청 | 무한 스크롤 |
|-|-|-|-|
|<img width="832" height="563" alt="image" src="https://github.com/user-attachments/assets/48ad7688-27e0-4da3-b95f-528f834b5cc7" />|<img width="841" height="610" alt="image" src="https://github.com/user-attachments/assets/2baef44f-cbbf-48c6-836a-a6945969f2af" />|<img width="916" height="233" alt="image" src="https://github.com/user-attachments/assets/42002c1e-3c39-4491-98bc-4f8798a3e10a" />|![infinite-scroll](https://github.com/user-attachments/assets/906b114c-72cf-4691-b491-dac9bb3de0ce)|

# 실행 방법

- `pnpm start` 를 입력하면 설치 -> 빌드 -> 실행 순서로 진행됩니다. ([http://localhost:3000](http://localhost:3000))
  - .env > `GITHUB_TOKEN=github_pat_xxxx` 토큰을 설정해주세요
  - `Fine-grained personal access tokens` 를 사용했습니다.
- `pnpm test:e2e` 를 입력하면 e2e 테스트를 시작합니다.

# TODO

- [x] 사용자 또는 조직만 검색
- [x] 계정 이름, 성명 또는 메일로 검색
- [x] 사용자가 소유한 리포지토리 수로 검색
- [x] 위치별 검색
- [x] 사용 언어로 검색
- [x] 개인 계정을 만든 시점별 검색
- [x] 팔로워 수로 검색
- [x] 후원 가능 여부를 기준으로 검색

# Dev Condition

- [x] 스크린: SM / MD / LG / XL 지원
- [x] UI 컴포넌트는 MUI 사용, UI 컴포넌트 레이아웃은 Tailwind CSS 사용
- [x] 페이징 처리: SSR 로 첫페이지 선 랜더링, 이후 CSR 로 무한 스크롤
- [x] 사용자 아바타 이미지 처리: HTML5 Canvas + WebAssembly 를 통해 랜더링
- [x] 모든 GitHub 호출은 서버 라우트에서 Authorization: token 사용
- [x] 레이트리밋 초과 시 재시도, 남은 쿼터 노출
- [x] 머터리얼 디자인 칼라 팔레트 지원
- [x] 시스템 연동 다크 모드 지원
- [x] 폰트 폴백: 애플 기본 > Noto
- [x] 정렬 조건: 기본, followers, repositories, joined 지원 + DESC
- [x] Cypress 를 통한 E2E 테스트 지원
- [] Jest 를 통한 유닛 테스트 지원

# Test Condition

- [] 필수 테스트 대상
  - [x] e2e 검색 쿼리
  - [x] e2e 정렬
  - [] 페이징 로직
  - [] 데이터 매핑, 표시 안전성
  - [] SSR, CSR 경계 로직

# Submission

- [x] 전체 소스코드
- [x] README.md
  - [] 실행 및 테스트 방법
  - [x] 구현 스펙 명세
  - [x] MUI 와 Tailwind CSS 같이 사용할 때 주의할 점
- [x] 사용한 프롬프트
  - [x] 모든 프롬프트는 prompts/used_prompts.md 에 정리
- [x] 테스트코드 (필수)
  - [x] E2E 테스트 일부 지원 (테스트 코드가 제일 중요해보이는데 많이 미흡합니다. 🙇‍♂️)
  - [] 단위 테스트

# Skill

- [x] Clean Architecture + Modularity
- [x] pnpm + turbo
- [x] ESLint + Prettier
- [x] ES2023 + Next.js + TypeScript (Next.js App Router)
- [x] MUI + Tailwind CSS
- [x] Cypress(Playwright cypress 를 깜박하고 Playwright 으로 진행해버렸습니다...)
- [] Jest
- [] Redux Toolkit (미사용)

# 작업순서 기록

- `pnpm create next-app@latest my-app --yes` 프로젝트 설정
- `https://api.github.com/search/users` 연결 테스트
- Clean Architecture + Modularity
- Clean Architecture 스캐폴딩 시작
- prettier, import ordering 셋팅
- server 레벨에서만 Authorization 호출하는 방식 -> next.js route 사용
- search api 를 서버 레벨에서만 호출되도록 구성
- search api filter 기본 설정 (ui 에서 sort 설정 옵션 지원 해야함)
- update params hook 생성
- update mui, tailwind css 적용
- ThemeProvider hydration missmatch 발생 -> next.js 전용 `AppRouterCacheProvider` 을 설정하여 해결
  - useMediaQuery 내부에서 window 를 찾지 못하는 이슈
- search api filter
  - https://docs.github.com/ko/search-github/searching-on-github/searching-users (필터 타입)
  - https://docs.github.com/ko/rest/search/search?apiVersion=2022-11-28#constructing-a-search-query (검색 쿼리 생성 규칙)
- 사용자 또는 조직만 검색 → type:user / type:org
- 계정 이름, 성명 또는 메일로 검색 → in:login / in:name / in:email
- uncontrolled form 변경
- input 공백 입력 금지 패턴 추가
- 레포지토리 수 필터 추가 -> repos:0..1000 형태로 지원
- 국가 필터 추가 -> suggest ui 지원
- 사용 언어 필터 추가 -> suggest ui 지원
- 개인 계정 생성일 필터 추가 -> suggest ui 지원
- 팔로워 수 필터 추가
- 후원 가능 여부 필터 추가
- github filter 와 유사하게 필터 정리
- 불필요한 filter 코드 정리, 필터 코드 통합
- canvas 를 이용하여 아바타 이미지 처리
- 무한 스크롤 적용
  - 최초에 SSR 호출한 데이터 노출
  - 이후 클라이언트 검색 데이터 노출
  - 다른 유저 검색시 클라이언트 검색 데이터 노출
  - 모든 데이터 호출했을때 데이터 호출 방지
- retry 로직 적용
- retry, search github hook 분리
- observer api -> scroll + throttle 조합으로 변경
  - 최초 진입하거나, 데이터량이 적을때 자동 호출되는 이슈 해결
  - scroll 상태를 state -> useRef 로 변경하여 상태 의존성 낮춤
- 422 에러 헨들링
  - url 에서 page query 제거 -> SSR 에서 올바른 요청이 아닌경우 에러 발생
- 요청 값이 없을때 SSR 요청하지 않도록 수정
- scroll event 에서 조회 되지 않는 이슈 수정
  - 검색값 없이 최초 진입 후, 검색하여 스크롤 요청시 호출되지 않는 현상 -> q 를 읽지 못하는 이슈 (useRef 로 수정)
- MUI + Tailwind 를 같이 사용할때, MUI > emotion 이 스타일이 늦게 주입되면서 스타일이 적용 안되는 현상 확인
  - MUI 는 컴포넌트 담당으로 분리
  - Tailwind 는 layout 담당 전용으로 Box 로 처리
- willReadFrequently 처리 -> 브라우저가 적합한 메모리를 사용할 수 있도록 canvas 에 willReadFrequently 옵션 추가
- sort(follower, join, repository) + decs 필터로직 추가
- prompt 이용하여 e2e 코드 추가
