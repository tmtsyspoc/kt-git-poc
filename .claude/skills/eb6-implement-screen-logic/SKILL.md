---
name: eb6-implement-screen-logic
description: eXBuilder6 프로젝트의 화면(.clx)과 짝 스크립트(.js)에 이벤트 리스너·핸들러 등 로직을 구현하거나 수정할 때 사용. 스펙 확인→관례 확인→API 확인→편집→검증의 검증된 절차를 담고 있다. ".clx", "eXBuilder", "cleopatra", "화면 로직", "이벤트 리스너", "핸들러 구현" 작업이면 이 스킬을 따른다.
---

# eXBuilder6 화면 로직 구현 SOP

eb6 도구를 전제로 한다 — 프로젝트 `.eb6/cli-tools/`의 `eb6-*` CLI가 첫 번째 선택지이고(사용법은 eb6-cli 스킬), MCP 등록 시 서버 url은 홈 디렉토리의 `.eb6/agent-host.json`에 있다(macOS/Linux: `~/.eb6/…`, Windows: `%USERPROFILE%\.eb6\…`). 도구: 조회 clx_get_overview·clx_spec·api_search, 수정 clx_add_listeners·clx_rename_id·clx_rename_columns·js_upsert_function, 검증 clx_validate·js_validate·clx_render_design. AGENTS.md의 "eXBuilder6 작업 지침"이 기본 규칙이고, 이 스킬은 그 실행 순서다.

## 1. 구조·규격 확인 (편집 전)

- 화면 구조는 `clx_get_overview`로 먼저 뜬다 — 계층 트리·컨트롤 ID·바인딩·줄 범위가 한 장에 온다. 긴 CLX를 통독하지 말고 개요에서 잡은 줄 범위만 읽는다.
- 대상 컨트롤의 이벤트·자식 요소 규격: `clx_spec` (type=spec, query=요소명). 조회할 이름을 모르면 type=list-nodes로 목록부터.
- 화면의 데이터 모델 파악: 개요의 바인딩 정보와 `.clx`의 `<cl:model>`(dataset/datamap/submission의 id, requestdata/responsedata 연결)을 읽는다. 핸들러 로직은 대부분 이 모델을 조작하는 것이다.

## 2. 관례 확인

- 핸들러 명명: `on<컨트롤ID><이벤트>` (예: onBtn1Click). 기존 파일의 실례를 우선한다.
- 프로젝트 공통 유틸 실사: 모듈 디렉토리(예: `clx-src/module/`)와 `createCommonUtil()` 패턴을 파일 검색으로 확인한다. **공통 유틸이 있으면 프레임워크 API 직접 호출보다 우선한다** — 단순 래퍼가 아니라 중복 전송 가드·로드마스크 등을 포함한다. 쓰려는 유틸 메서드가 실재하는지 반드시 파일 검색으로 확인한다(없는 메서드는 js_validate가 잡아주지만, 열등한 우회 구현은 못 잡는다).
- 프로젝트 관례 문서(`clx-src/AIGEN.md` 등)가 있으면 그 지침이 우선.

## 3. API 확인

- 쓰려는 클래스·메서드는 `api_search`로 호출 전에 확정한다 (type=class는 사용 예제 동봉). `.eb6/types/`의 d.ts를 검색해도 된다.
- 기억에 의존한 API 호출 금지 — 비슷한 이름의 함정(예: DataSet의 revert/revertRow, commit/clear)이 많다.
- 동작이 이상하거나 오류 메시지가 있으면 규격보다 먼저 기술지원 사례를 본다: `.eb6/cli-tools/eb6-support "<오류 메시지나 증상 원문>"`. 스튜디오 기능·설정 사용법은 `.eb6/cli-tools/eb6-manual toc` → `read <ID>`. 두 명령의 용법은 eb6-lookup 스킬.

## 4. 편집

- **리스너 연결은 `clx_add_listeners`가 기본이다** — 이벤트 유효성 검증, 기존 핸들러 충돌 검사, 관례 자동 명명, 마크업 규격(위치·sid)까지 도구가 처리하고, 미구현 핸들러 목록을 결과로 돌려준다. 수동 `<cl:listener>` 마크업 편집은 도구가 못 다루는 경우에만 쓰고, 그때는 `std:sid`를 기존 패턴(요소 접두 + 16진수 8자리)으로 새로 발급한다.
- **ID·컬럼 개명은 `clx_rename_id`·`clx_rename_columns`로 한다** — 문서 안 참조를 일괄 갱신하고(all-or-nothing), 짝 .js의 문자열 리터럴 잔존 건수를 보고한다. 텍스트 치환으로 개명하면 참조가 어긋난다.
- 함수 하나를 추가·교체할 때는 `js_upsert_function`을 쓰면 안전하다 — 완결된 `function <핸들러명>(e) {...}` 선언 하나를 주면 파서 함수 경계 기준으로 동명 함수는 교체, 없으면 끝에 추가한다(파일이 없으면 생성). 선언 밖 텍스트(JSDoc 등 앞선 주석)는 버려지니 설명은 함수 본문 안에 둔다. 결과에 js_validate 보고가 동봉된다. 직접 편집한 뒤 js_validate를 부르는 것도 같은 결과다.
- CLI에서는 함수 본문을 파일로 저장해 `.eb6/cli-tools/eb6-js-upsert-function <파일.js> <함수명> --functionFile <함수.js>`로 준다 — 인라인 `--functionText`는 셸 인용·인코딩 함정이 있다.
- 핸들러는 파일 스코프의 평범한 `function <핸들러명>(e) {...}`. 이벤트 객체에서 `e.control`로 발화 컨트롤을 얻는다.
- **구현 방법이 명백하지 않으면 지어내지 말고 TODO 마커를 남긴다** — 지침(AGENTS.md·AIGEN.md·스펙)에도, 공통 유틸·`api_search` 결과에도 딱 맞는 방법이 없는 로직(예: 확인되지 않은 서버 API 호출, 규격에 없는 컨트롤 동작, 사업 규칙이 불명한 계산)은 그럴듯한 우회 코드로 채우지 않는다. 대신 핸들러 본문에 `// TODO: <해야 할 일> — <막힌 이유: 어디를 찾아봤고 무엇이 없었는지>` 한 줄을 두고, 그 자리는 함수가 유효하게 유지되는 최소 골격(빈 본문이나 `return;`)으로 남긴다. 확인 가능한 부분(리스너 연결·데이터 조회·화면 갱신 등)은 정상 구현하고 불명한 부분만 마커로 격리한다. 검증은 통과하되 사람이 이어받아야 할 지점을 드러내는 것이 목적이다.

## 5. 검증 (편집 후 필수)

- `clx_validate`(.clx)·`js_validate`(.js)를 파일 저장 후 호출. 실패 시 좌표(줄:칸)와 스펙 발췌가 오므로 그 기준으로 수정 후 재검증. `js_upsert_function`을 썼다면 그 결과에 js_validate 보고가 이미 있다 — 오류가 있으면 고친 함수로 같은 도구를 다시 호출하면 전체가 교체된다.
- **handler명 ↔ JS 함수명 갭**: `clx_add_listeners`를 썼다면 결과의 미구현 핸들러 목록이 정답이다 — 그 함수들을 작성하면 끝. 수동 편집했다면 CLX의 `handler="…"` 속성값 목록과 JS의 `function on…` 선언 목록을 뽑아 직접 대조한다.
- js_validate의 WARN도 무시하지 않는다 — 미지 컨트롤 ID·미지 멤버는 WARN 등급이다.
- TODO 마커를 남겼다면 최종 보고에 파일·함수·내용을 목록으로 적는다 — 검증 통과 보고만으로 완료로 읽히면 안 된다.
- **레이아웃을 바꿨다면 `clx_render_design`으로 눈으로 확인한다** — 화면을 PNG로 렌더해 경로를 돌려주므로(기본 `.eb6/render/`), 그 이미지를 읽어 배치·겹침·누락을 검토한다. 검증 통과가 곧 의도한 화면이라는 뜻은 아니다.
