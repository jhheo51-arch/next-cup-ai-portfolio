# 실행과 인수인계

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

최대 3회의 실제 호출을 수행합니다. 입력은 connection-scenarios.json의 가상 문장입니다.
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

## 이번에 추가한 시험

`npm test`에는 가상 AI 출력 검사와 남은 요구의 운영 검토 분류가 포함됩니다. 분류 모듈은 검토자가 확인한 값을 입력받는 보조 규칙이며, 고객 기록을 자동 수집하지 않습니다.

시간 초과 후 직접 선택과 재시도 경로는 다음 명령으로 확인합니다. 외부 AI 호출은 없습니다.

```bash
node tests/recovery-check.cjs after
```

Playwright와 Edge가 필요합니다. 새 결과는 runtime/recovery-실행시각/에 저장합니다. evidence/의 수정 전후 기록은 보존됩니다. 수정 전 결과를 새 코드로 다시 만들 수는 없습니다.

어려운 문장의 실제 Gemini 평가는 별도 실행입니다. 비용이 발생하며, 이번 제출 근거에서는 연결 오류 때문에 완료하지 못했습니다.

```bash
node --env-file=.env tests/hard-evaluation.cjs baseline
```

한 번에 개발용 8개를 평가하고 연결 오류가 2회 연속 발생하면 중단하도록 작성했습니다. 이 중단 규칙을 넣은 뒤 실제 호출은 다시 하지 않았습니다. 새 결과는 runtime/hard-실행시각/에 저장합니다. AI 지시문을 고친 경우 revised, 수정에 쓰지 않은 분리 평가 문장을 실행할 때 heldout을 사용합니다. 이번에는 지시문을 변경하지 않았고 분리 평가도 실행하지 않았습니다.
