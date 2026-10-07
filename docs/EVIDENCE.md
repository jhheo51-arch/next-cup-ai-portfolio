# 증거 읽는 순서 / v08

| 구분 | 파일 | 의미 |
|---|---|---|
| 현재 가상 입력 | evidence/release-scenarios-v08.json | 사전에 정한 3개 연결 사례 |
| 최신 실제 호출 | evidence/release-live-v08.json | 최초 3회, R03 검사 절차 실패 포함 |
| 재실행 | evidence/release-live-v08-retry.json | R03 1회, 최종 흐름 완료 |
| 무료 자동 검사 | evidence/tests-v08.tap | 103개 통과 |
| 화면 검사 | evidence/simple-results.json | 가상 응답, 14개 통과 |
| 출처 확인 | evidence/catalog-snapshot-v08.json | 공식 메뉴 페이지의 2종 설명/확인 시각 |
| 과거 AI 평가 | evidence/heldout-result-v1.json | v2/3종 당시 22/24 조건 일치 |
| 과거 코드 비교 | evidence/decision-check.json | 3종 당시 12조건의 전후 비교 |
| 메뉴 이력과 출처 | app/evidence.json | 사례 6종, 추천 5종과 범위 다름 |

과거 결과를 새 프롬프트의 성능으로 바꾸지 않습니다.
새 Gemini 시험의 시간은 페이지 진입~응답까지이고, 과거 시험은 서버 측정입니다.
실제 요청/구매/매출은 기록하지 않았습니다. 외부 이용자 검증은 0명입니다.
정기 점검 예정일과 실행 증거는 별도입니다. 이번 수동 확인을 예약 실행으로 세지 않습니다.
PDF 8쪽과 Excel 9개 시트에 같은 구현 범위와 시험 결과를 적었습니다.
