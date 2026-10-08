# NEXT CUP

좋아했던 음료의 특징으로 다음 잔을 찾고, 남은 요구를 동의 기반 알림으로 연결하는 시제품입니다.

[소개 PDF](submission/NEXT-CUP-Portfolio.pdf) | [검증 Excel](submission/NEXT-CUP-Evidence.xlsx) | [화면 설명](docs/DEMO.md)

스타벅스 AI 기획/개발 지원용 개인 프로젝트이며 공식 서비스는 아닙니다.

## 핵심 설계

**취향 입력 → 조건 확인 → 후보 비교 또는 추천 보류 → 남은 요구와 알림 동의**

- Gemini가 정리한 취향을 사용자가 수정합니다. AI 없이 직접 선택할 수도 있습니다.
- 최종 후보는 코드가 필수 조건을 검사해 고릅니다. 등록한 5종에 없는 쌀 풍미가 필수이면 추천을 보류합니다.
- 남은 요구는 브라우저에 보관하고, 알림 동의와 해제, 조건 일치, 시험 발송을 구분합니다.

## 검증 범위

코드 검사 125개, 기본 화면 검사 14개, 후속 알림 화면 검사 9개를 통과했습니다. 실제 AI 연결 시험 4회와 가상 고객 사례 9건은 별도 근거로 관리합니다.

어려운 표현의 해석 평가와 외부 이용자 효과는 미완료입니다. 실제 원격 알림 운영, 매장 재고 조회와 주문은 지원하지 않습니다.

## 자료 안내

| 보고 싶은 내용 | 문서 |
|---|---|
| 기획과 역할 | [기획서](docs/PRD.md) / [직무 관련 설명](docs/CONTENT.md) |
| AI 도입과 개선 판단 | [AI 선택 근거](docs/AI-CHOICE.md) / [설계와 오류 분석](docs/DECISIONS.md) |
| 확인한 결과와 다음 시험 | [검증 기록](docs/VALIDATION.md) / [사용자 시험 계획](docs/PROTOCOL.md) / [제출 파일 확인값](submission/RELEASE.json) |

<details>
<summary>화면 미리보기</summary>

![NEXT CUP 시작 화면](evidence/readme-preview.png)

</details>

<details>
<summary>직접 실행하기와 자동 검사</summary>

Node.js 24 이상에서 저장소 폴더의 터미널에 입력합니다. 기본 실행은 별도 패키지 설치가 필요하지 않습니다.

```sh
npm start
```

http://127.0.0.1:4322 에서 ‘AI 없이 직접 선택할래요’를 사용할 수 있습니다. Gemini 연결은 [실행 안내](docs/HANDOFF.md)를 참고하세요.

**코드와 화면 자동 검사**

```sh
npm ci
npx playwright install chromium
npm test
npm run test:browser
```

화면 검사는 가상 AI 응답과 임시 저장소를 사용합니다. 실제 AI 요청은 보내지 않습니다. GitHub에서도 코드 검사와 기본 화면 14개, 알림 화면 9개 검사를 실행합니다.

</details>

제작자가 문제와 기능 범위를 정하고 결과를 검토했습니다. Codex는 조사와 구현을 보조하며, Gemini는 취향 해석에 사용합니다. 공개 게시, 이메일과 문자 발송은 포함하지 않습니다.
