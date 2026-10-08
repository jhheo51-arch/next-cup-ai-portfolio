# 증거 읽는 순서

| 구분 | 파일 | 의미 |
|---|---|---|
| 현재 가상 입력 | evidence/connection-scenarios.json | 사전에 정한 3개 연결 사례 |
| 현재 실제 호출 | evidence/connection-results.json | 최초 3회, R03 검사 절차 실패 포함 |
| 재실행 | evidence/connection-retry.json | R03 1회, 최종 흐름 완료 |
| 무료 자동 검사 | evidence/unit-tests.tap | 당시 103개 통과 |
| 화면 검사 | evidence/simple-results.json | 가상 응답, 14개 통과 |
| CRM 가상 사례 | evidence/crm-scenarios.json | 가상 고객 9건의 후속 접점 조건 |
| CRM 화면 검사 | evidence/crm-results.json | 동의/시험 알림/중복 차단/해지 9개 통과 |
| 출처 확인 | evidence/catalog-snapshot.json | 공식 메뉴 페이지의 2종 설명/확인 시각 |
| 과거 AI 평가 | evidence/taste-evaluation.json | 메뉴 3종 시험에서 22/24 조건 일치 |
| 과거 코드 비교 | evidence/decision-check.json | 3종 당시 12조건의 전후 비교 |
| 메뉴 이력과 출처 | app/evidence.json | 사례 6종, 추천 5종과 범위 다름 |
| 예약 점검 첫 회차 | evidence/menu-review-2026-10-08-v01.json | 고정한 공식 출처 9개 확인. 7개 기존 근거 유지, 2개 본문 확인 보류 |

과거 결과를 새 프롬프트의 성능으로 바꾸지 않습니다.
새 Gemini 시험의 시간은 페이지 진입~응답까지이고, 과거 시험은 서버 측정입니다.
실제 요청/구매/매출은 기록하지 않았습니다. 외부 이용자 검증은 0명입니다.
정기 점검 예정일과 실행 증거는 별도입니다. 2026년 10월 8일 첫 예약 점검 1회를 기록했습니다. S08과 S09는 페이지 본문을 확인하지 못해 사람 검토 대기 상태로 남겼습니다. 이를 판매 종료로 판단하거나 추천 목록에 자동 반영하지 않았습니다. 이 회차는 미리 고정한 S01부터 S09까지를 대상으로 했으며 S13은 범위 밖입니다.
추가 시험과 설계 판단은 [DECISIONS.md](DECISIONS.md), evidence/diagnostic-tests.txt, evidence/recovery-after.json에서 확인합니다.
새 PDF와 Excel에 같은 시험 범위, 첫 회차 결과와 미검증 항목을 적었습니다.

2026-10-08 제출 전 재확인: [파일/화면 확인 결과](../evidence/submission-check.json), 자동 검사 125개, 기존 화면 검사 14개, CRM 화면 검사 9개를 확인했습니다. [입력 비교](../evidence/input-comparison.json)의 값 변경 횟수와 [503 진단](../evidence/connection-diagnostic.json), CRM 후속 접점 시험을 PDF와 Excel에도 반영했습니다. 과거 원자료는 당시 결과 그대로 보존합니다.
