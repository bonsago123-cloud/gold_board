# AI Continuation Protocol

이 저장소에서 이전 작업을 이어서 수행하는 AI는 아래 순서를 따른다.

1. 루트의 `HANDOFF.json`을 먼저 읽는다.
2. `HANDOFF.json`의 `handoff_document`와 `fixed_tests_document`가 가리키는 파일을 읽는다.
3. 이전 AI와의 대화 전문을 요구하거나 사용하지 않는다.
4. 작업 전에 `npm run handoff:check`를 실행한다.
5. `fixed_test_ids`의 검사 ID, 입력, 기대값을 삭제·완화·변경하지 않는다.
6. `protected_areas`는 현재 기능을 위해 꼭 필요한 경우가 아니면 수정하지 않는다.
7. `next_action`부터 작업하고, 완료 후 같은 고정 검사를 다시 실행한다.
8. 작업 종료 시 현재 인수인계 문서와 `HANDOFF.json`의 상태를 갱신한다.

이 규칙은 구리 기능 이후에도 재사용한다. 다음 기능을 시작할 때는 `npm run handoff:new -- <feature-id> "<title>" <fixed-tests-document>`를 사용한다.
