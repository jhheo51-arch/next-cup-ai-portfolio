# 실행과 인수인계 / v08

## 기본 실행

Node.js 24 이상이 필요합니다. 기본 서비스는 별도 npm 패키지 없이 실행됩니다.

```bash
npm test
npm start
```

http://127.0.0.1:4322 로 접속합니다. 다른 프로그램이 이 포트를 쓰면 먼저 해당 프로그램을 확인하세요.
현재 시작 파일은 app/public/simple.html입니다. 이전 화면은 app/legacy/에 보관했습니다.

## Gemini 설정

.env.example을 .env로 복사해 GEMINI_API_KEY에 본인 키를 넣습니다.
기본 모델은 gemini-3.1-flash-lite입니다. 실제 요청은 별도 사용량이 발생합니다.
키가 없으면 직접 선택을 사용합니다. .env/runtime은 Git 추적에서 제외됩니다.

## 화면 자동 시험

Playwright 패키지와 Microsoft Edge가 설치된 환경에서 실행합니다.

```bash
npm install --no-save playwright
node tests/simple-browser.cjs
```

가상 AI 응답만 사용합니다. 유료 호출이 아닙니다.
새 화면 검사 결과는 runtime/browser-실행시각/에 저장됩니다. 제출한 원자료는 덮어쓰지 않습니다.

## 실제 AI 연결 시험

```bash
node --env-file=.env tests/release-live.cjs
```

최대 3회의 실제 호출을 수행합니다. 입력은 release-scenarios-v08.json의 가상 문장입니다.
새 실행 결과는 runtime/release-날짜/에 저장해 제출 근거를 덮어쓰지 않습니다.
RELEASE_CASE=R03으로 특정 사례만 실행할 수 있습니다. 재실행할 때도 처음 실패한 기록을 보존하세요.

## 자료 점검

tests/catalog-snapshot.cjs는 공식 페이지의 공개 목록을 수동 확인하는 보조 스크립트입니다. 정식 외부 API 계약을 가정하지 않습니다.
현재 증거를 보존하려면 복사한 작업 폴더에서 실행합니다.
조회 실패는 메뉴 부재가 아니며 검토 없이 판매 상태를 바꾸지 않습니다.
확인일로부터 30일이 지난 후보는 서버 추천에서 제외합니다. 이후 데모에서 후보가 줄면 공식 자료를 다시 확인하고 확인일을 갱신해야 합니다. 날짜만 임의로 늘리지 않습니다.

## 저장과 제한

고객의 남은 요구는 해당 브라우저 localStorage에만 저장됩니다. 다른 기기와 공유되지 않습니다.
API 호출 상태는 로컬 SQLite 운영 기록입니다. 운영 기록에는 입력 원문을 저장하지 않습니다.
서버는 로컬 컴퓨터에서만 실행하도록 설정되어 있습니다. 공개 배포/중앙 수집은 별도 보안 검토가 필요합니다.
