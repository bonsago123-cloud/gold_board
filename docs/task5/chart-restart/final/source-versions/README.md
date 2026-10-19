# C26 소스 버전 복원 증빙

기록된 시작 소스를 복원할 수 없다는 이전 안내를 정정한다. 시작 당시 저장한 SHA-256 manifest를 기준으로 모든 기록 대상 파일을 복원했다.

| 버전 | 기록 대상 파일 | 확인 |
|---|---:|---|
| 첫 실행 시작 | 98 | 모든 파일이 당시 SHA-256과 일치 |
| 첫 실행 종료 = 다음 실행 시작 | 100 | 모든 파일이 당시 SHA-256과 일치 |
| 다음 실행 종료 | 100 | 모든 파일이 당시 SHA-256과 일치 |

정확한 고정 버전 쌍은 versions.json의 pairs에 있다. source-history.bundle에는 세 버전의 Git 객체가 들어 있다. 각 ZIP은 해당 버전의 실제 소스 파일이며 해시 목록만 들어 있는 것이 아니다.

복원 커밋은 2026-10-19 복원 시점에 새로 생성했다. 과거에 커밋했다고 주장하거나 날짜를 소급하지 않았다. 과거 원본 manifest·세션·실패 및 성공 기록을 변경하지 않았다. 96개 시작 파일은 남아 있던 소스/ZIP에서 찾아 복원했고, 나머지 두 파일은 기록된 이후 변경을 역으로 적용한 뒤 시작 시점 해시와 정확히 일치하는 것을 확인했다. 출처는 start-provenance.json에 있다.

범위는 당시 sourceDigest가 기록한 public(생성된 handoff-status.json 제외), api, scripts, tests, package.json, package-lock.json, AGENTS.md다. 해시 기록 밖의 문서·배포 설정까지 복원했다고 주장하지 않는다. 고정검사·요청·상한 문서는 기존 저장소에 별도 보존되어 있다.

검증(이 폴더가 포함된 저장소 루트에서):

```bash
python3 docs/task5/chart-restart/final/source-versions/verify.py
```

Python 검증기는 ZIP 바이트, 원본 manifest, manifest 전체 digest, bundle의 Git 객체와 파일 목록을 모두 비교한다. 임시 clone은 검사 후 삭제한다.

Git 버전 비교가 필요한 경우:

```bash
git clone docs/task5/chart-restart/final/source-versions/source-history.bundle source-evidence
git -C source-evidence diff --numstat evidence-start evidence-handoff
git -C source-evidence diff --numstat evidence-handoff evidence-complete
```

clone=저장소 복제, -C=지정 디렉터리에서 실행, diff=difference(차이), --numstat=숫자 형태의 변경 통계. 위 명령은 원시 변경량 확인용이며 과제 재작업량은 제출 후 채점기가 생성 파일·lockfile 제외 규칙을 적용해 산출한다. 보고서에는 재작업량을 수기로 넣지 않는다.

새 Git 객체는 bundle 내부에 있으므로 일반 GitHub /commit/ 주소로 연결하지 않는다. 기존 업로드 커밋 e1ec0ca…와 533f7df…는 실제 저장소의 인계·완료 버전으로 별도 유지한다. 복원 증거를 채점기가 받는 형식으로 전달해야 하며, 채점 승인을 자동 보장하는 표시는 하지 않는다.
