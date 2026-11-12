<!-- eb6:provision:begin — 이 구간은 provision 도구가 관리합니다. 직접 수정하지 마십시오 -->

## eXBuilder6 작업 지침

이 프로젝트는 eXBuilder6(cleopatra) 앱 프로젝트입니다. 화면은 `.clx`(XML)로, 로직은 같은 이름의 짝 `.js`로 구성됩니다.

### 도구

- **CLI가 첫 번째 선택지입니다** — 프로비저닝이 이 프로젝트의 `.eb6/cli-tools/`에 `eb6` CLI와 명령별 링크를 설치합니다. 프로젝트 루트에서 상대 경로로 실행합니다(예: `.eb6/cli-tools/eb6-clx-validate …` — bash 계열은 이 형태 그대로, Windows cmd/PowerShell은 `.eb6\cli-tools\eb6-<명령>`). exit 0=통과, 1=검증 실패, 2=인자 오류, 3=호스트 미가동:
  ```
  eb6-clx-spec --type spec --query <요소명>       컨트롤의 속성·이벤트·자식 요소 규격
  eb6-clx-spec --type example --query <컨트롤명>  마크업 예제
  eb6-clx-spec --type list-nodes                 조회할 이름을 모를 때 — 노드 목록(list-types·list-examples도 있음)
  eb6-api-search --type class --query <이름>      cpr.* API 질의와 사용 예제
  eb6-pum-spec --type schema                     PUM(.pum.json) 스키마
  eb6-pum-validate <파일.pum.json>               PUM 설계 검증 — 미지 속성(오타·지어낸 속성)·enum·필수 누락을 JSON 경로로 보고. clx-generate 전에 반드시
  eb6-pum-list-field-types --project <경로>       프로젝트 필드 타입 카탈로그 — pum dataType은 이 어휘에서
  eb6-pum-export-pptx <파일.pum.json>            화면설계서 PPTX 생성(프로젝트 ai.gen 템플릿 우선)
  eb6-clx-generate <파일.pum.json>               PUM 설계로 화면 생성(.clx+짝 .js) — 젠스펙 적용, 리스너·로직 미포함
  eb6-clx-get-overview <파일.clx>                구조 개요(트리·ID·바인딩·줄 범위) — 큰 화면은 통독 대신 이것부터
  eb6-clx-validate <파일.clx>                    편집 후 검증 (좌표와 스펙 발췌를 돌려줍니다)
  eb6-js-validate <파일.js>
  eb6-clx-render-design <파일.clx>               화면을 PNG로 렌더(기본 .eb6/render/) — 저장된 이미지를 읽어 눈으로 확인
  eb6-clx-rename-id·rename-columns·add-listeners  ID·컬럼 개명과 리스너 배선 — 참조까지 일괄 갱신(인자는 --help)
  eb6-js-upsert-function <파일.js> <함수명> --functionFile <함수.js>  최상위 함수 하나를 교체·추가(파일 없으면 생성) — 파서 경계 기준 결정적 병합, js_validate 보고 동봉
  eb6-support "<질문 원문>"                      기술지원 FAQ·QnA 사례 검색 — 증상·오류 해결용(API 규격은 clx-spec·api-search). 키워드로 가공하지 말고 질문 원문 그대로. exit 1=근거 없음
  eb6-support --show <ID> [--source true]       사례 상세(ID는 검색 결과 줄의 것, --source true 로 원문 전문까지)
  eb6-manual toc [ID]                            공식 도움말 목차([ID] 제목 트리, ID를 주면 그 아래만) — 공식 도움말 검색은 목차를 보고 고른 뒤 읽는 순서
  eb6-manual read <ID>                           도움말 페이지를 마크다운으로(ID는 목차에서, 설치본마다 다름)
  eb6 help                                       전체 명령 목록
  ```
  인자는 `--<이름> <값>` 형식이고, 필수 인자는 순서대로 위치 인자로도 줄 수 있습니다. 각 명령의 인자는 `<명령> --help`로 확인합니다.
- MCP 클라이언트가 있으면 로컬 eb6 서버를 등록해도 됩니다. 접속 정보(url)는 홈 디렉토리의 `.eb6/agent-host.json`에 있습니다 (macOS/Linux: `~/.eb6/agent-host.json`, Windows: `%USERPROFILE%\.eb6\agent-host.json`). 같은 능력이 도구로도 올라오며(`clx_spec`·`api_search`·`get_pum_spec`·`clx_validate`·`js_validate` 등), 어느 쪽을 써도 결과는 같습니다
- 타입 선언: `.eb6/types/`에 프레임워크(cpr.*)와 프로젝트(모듈·UDC) d.ts가 있습니다 — 파일 검색 도구로 상시 참조합니다
- 공리 문서는 필요한 **능력**만 말하고 도구 이름을 지정하지 않습니다. 위 목록에서 설명이 맞는 것을 골라 쓰고(예: **공식 도움말 검색** = `eb6-manual toc` → `eb6-manual read`), 목록에 없는 능력은 이 표면에 없는 것이니 이름을 지어내지 말고 파일을 직접 읽어 확인하십시오

### 필수 절차

1. `.clx`/`.js` 편집 전 `clx_spec`·`api_search`로 규격을 확인합니다. API를 기억에 의존해 쓰지 않습니다.
2. 편집 후 `clx_validate`(clx)·`js_validate`(js)를 반드시 호출합니다. 파일은 디스크 기준으로 검증되므로 저장 후 호출합니다. `js_upsert_function`으로 넣은 함수는 결과에 검증 보고가 이미 있으므로 다시 부르지 않습니다.
3. 검증이 잡지 못하는 갭: CLX의 `<cl:listener handler="...">` 핸들러명과 JS 함수명의 일치는 직접 대조합니다.
4. 프로젝트 공통 유틸이 있으면(모듈 디렉토리, `var util = createCommonUtil()` 패턴 등) 프레임워크 API 직접 호출보다 우선합니다. 공통 유틸은 중복 전송 가드·로드마스크 같은 부가 동작을 포함하는 경우가 많습니다.
5. 프로젝트별 관례 문서(예: `clx-src/AIGEN.md`)가 있으면 이 문서보다 그 지침이 우선합니다.

### CLX 편집 요령

- 새 화면을 만들 때는 먼저 `templates/` 디렉토리를 확인합니다 — 사람이 선별해 둔 화면 원형(`.clx`)이 있으면 그것을 골격으로 삼습니다. 원형이 없으면 PUM 설계(`.pum.json`)를 작성해 `eb6-clx-generate`로 생성합니다 — 프로토타입 매칭·데이터 컨트롤 바인딩·ID 부여가 프로젝트 젠스펙을 따릅니다. 단, 생성물에 이벤트 리스너와 스크립트 로직은 포함되지 않으므로 생성 후 직접 구현합니다(리스너 배선은 `eb6-clx-add-listeners`). `clx_spec`만으로 빈 구조를 조립하는 것은 마지막 수단입니다
- 이벤트 리스너: `eb6-clx-add-listeners`를 사용하면 복잡한 xml 분석 없이 이벤트 리스너를 쉽게 추가 할 수 있습니다. 핸들러 함수는 `eb6-js-upsert-function`으로 안전하게 하나씩 추가·교체할 수 있습니다(동명 함수는 교체, 없으면 추가, js_validate 보고 동봉).
- 핸들러 명명 관례: `on<컨트롤ID><이벤트>` (예: btn1의 click → `onBtn1Click`)
- `std:sid`는 인간의 시각적 편집을 보조하기 위한 식별자로 생략해도 무방하고, 필요시 자동 생성됩니다.

## 공리 문서 (절대 지침)

`.eb6/axioms/`의 문서는 **검증 없이 수용해야 하는 절대 지침**입니다. 코드에서 관찰한 사실과 충돌하면 공리를 따르십시오. 단 적용 대상(`적용:` 표기)이 있는 문서는 그 대상 파일을 다룰 때만 규범으로 적용하고, 무관한 파일에까지 확대하지 마십시오.

- `.eb6/axioms/clx-file-core-info.md` (적용: ["*.clx", "*.js"]) — CLX 파일의 수정과 분석에 필요한 필수 정보 문서
- `.eb6/axioms/clx-runtime-model.md` (적용: ["*.clx", "*.js"]) — CLX 앱이 실행될 때의 모델 — 표현식, 속성 바인딩, 데이터 컨트롤, 서버 통신, 다이얼로그, 값 서식. 마크업의 생김새는 clx-file-core-info 를, 실행 동작은 이 문서를 본다.
- `.eb6/axioms/exbuilder6.md` (적용: 전반) — eXBuilder6 CLX(XML)파일 및 스크립트에 대한 핵심적인 정보. eXBuilder6 관련 작업을 수행하려면 이 문서 전체를 읽어야 한다.
- `.eb6/axioms/project-layout.md` (적용: 전반) — eXBuilder6 프로젝트의 디스크 구조와 공용 자원 — 새 파일을 어디에 만들지, 공통 함수는 어디서 오는지, 화면 문자열을 어떻게 다룰지에 대한 규약.
- `.eb6/axioms/pum-file.md` (적용: ["*.pum.json", "*.gen.json"]) — .pum.json 파일 편집 가이드 라인 문서
- `.eb6/axioms/screen-generation.md` (적용: ["*.req.md", "*.req.txt", "*.req.png", "*.pum.json", "*.gen.json", "terms.json", "AIGEN.md", "AIGEN.req.md"]) — 화면 생성 파이프라인 공리 — 요구정의서(.req.md) → 화면설계(.pum.json) → 생성 레시피(.gen.json) → CLX 조립의 역할·경계와, 용어 소스(terms.json·termSources)·상시 지침(AIGEN.md)의 기록 위치

전체를 읽기보다 목차(`grep -n '^#' .eb6/axioms/<문서>`)로 훑고 필요한 섹션만 읽으십시오.



<!-- eb6:provision:end -->
