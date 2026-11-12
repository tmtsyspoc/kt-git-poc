---
name: eb6-author-pum
description: eXBuilder6 화면설계 파일(.pum.json, Pseudo UI Model)을 작성·수정할 때 사용. 요구사항을 구역(field-set/data-grid/media/compose) 구조의 설계 JSON으로 옮기는 절차이며, 스키마와 예시 파일을 동봉한다. 입력에 DB 컬럼명(물리명)이 있으면 같은 이름의 .gen.json에 manual 용어 정의를 함께 만든다. "화면 설계", "화면설계 작성", "PUM", ".pum.json", "설계 목업" 작업이면 이 스킬을 따른다.
---

# eXBuilder6 화면설계(.pum.json) 작성 SOP

pum.json은 화면설계 목업(Pseudo UI Model)이다 — CLX 같은 실제 UI 소스를 생성할 때 입력으로 쓰인다. **일반 eXBuilder6/CLX 기술과는 무관하다**: `clx_spec` 등 CLX 도구나 CLX 문법 지식을 PUM에 적용하지 말 것.

정본 우선 — MCP `get_pum_spec`(type=guide | schema)이 연결돼 있으면 그쪽이 최신 정본이다. 프로비저닝된 프로젝트에는 `.eb6/pum-schema.json`이 같은 정본에서 갓 복사돼 있고 VS Code 편집기 검증에도 연결돼 있다 — 파일 사본 중에는 이쪽을 우선한다. 이 스킬에 동봉된 `pum-schema.json`(JSON 스키마)과 `example-*.pum.json`(작성 예시)은 도구·프로비저닝 없이 쓰는 오프라인 사본이다.

## 1. 절차

1. 요구를 분석해 화면을 구역들로 나눈다.
2. 각 구역의 주제(subject)·목적(purpose)을 정한다.
3. 아래 구조 요약과 예시를 따라 작성한다.
4. 저장 후 `eb6-pum-validate <파일.pum.json>`으로 검증한다(exit 0 통과, 1 실패 — 위반마다 JSON 경로와 원인을 돌려준다). CLI가 없으면 동봉 `pum-schema.json`과 대조해 자가 검증한다. 스키마는 `additionalProperties: false`라, 스키마에 없는 속성은 전부 오류다. 스키마나 예시에 없는 속성·값을 지어내지 않는다.
5. 입력 자료에 필드의 DB 컬럼명(물리명)이 있었으면 같은 폴더에 `<화면명>.gen.json`을 만들어 `manual` 용어 정의로 기록한다(4절). 스튜디오의 "설계 생성"은 이 기록을 후처리로 자동 수행하지만, 에이전트가 pum.json을 직접 쓰면 그 후처리가 없으므로 직접 챙긴다.

## 2. 구조 요약

최상위는 화면 하나다. 속성은 이 순서대로 쓴다.

```json
{
    "title": "화면 제목",
    "subTitle": "부제목(선택)",
    "description": "사용자 표시 설명(선택)",
    "comment": "개발자용 설명(선택)",
    "contents": [ /* 구역 배열 */ ],
    "actions": [ /* 화면 수준 액션(선택) */ ]
}
```

구역(`contents` 원소)은 `type`으로 갈리며 `type`이 항상 첫 속성이다.

| type | 용도 | 필수 | 전용 속성 |
| --- | --- | --- | --- |
| `field-set` | 단일 엔티티의 열람·입력·편집 필드 묶음 | `fields` | `purpose`: search·create·read·modify |
| `data-grid` | 동일 스킴 엔티티의 반복 표시(테이블) | `fields` | `purpose`: **read·modify만** |
| `media` | 이미지·차트·비디오·텍스트 본문 영역 | `kind`: image·chart·video·text | — |
| `compose` | 두 개 이상 구역의 그룹핑 | `contents` | `layout`: vertical(기본)·horizontal·tab |

필드(`fields` 원소)는 `{ "label", "dataType", "description", "comment", "required", "visible", "fieldGroup" }` — `label`만 스키마 필수. 액션은 `{ "label", "kind", "description", "comment" }`이고 `kind`는 primary(주사용)·secondary(일반, 생략 가능)·danger(파괴적)·separator(구분자, label 불필요).

## 3. 작성 규칙 (함정 순)

- **field-set 안에 field-set 중첩 절대 금지.** 여러 구역을 묶을 땐 `compose`. `fields` 배열은 1단계 평면 구조만.
- **구역 하나를 compose로 감싸지 않는다.** compose는 둘 이상일 때만, `layout`도 사용자가 가로 배치·탭을 명시적으로 요구했을 때만 horizontal/tab을 쓴다.
- **기본값은 생략한다** — 빈 배열, 빈 문자열, `required: false`, `visible: true`, `layout: "vertical"`, `kind: "secondary"` 같은 것은 쓰지 않는다.
- `subject`·`purpose`는 스키마상 선택이지만 **field-set·data-grid에는 사실상 필수다** — 생성 품질을 좌우한다. data-grid의 purpose에 search·create를 쓰지 않는다.
- `required`는 purpose가 search·create인 구역의 필수 입력 필드에만 붙인다.
- **화면에 보이지 않아도 데이터로 필요한 필드는 빼지 않는다** — PK·코드값·내부 식별자처럼 조회·저장에는 실려야 하지만 사용자에게 보일 필요가 없는 필드는 `visible: false`로 둔다. 필드를 빼 버리면 데이터에서도 빠진다. field-set·data-grid 모두에 쓸 수 있고, 생성된 화면에서는 숨겨지되 데이터 바인딩은 그대로 만들어진다. 보이는 필드에는 `visible`을 쓰지 않는다.
- `fieldGroup`(그룹 헤더 라벨)은 **data-grid의 필드 전용**이다 — field-set의 필드에는 절대 쓰지 않는다.
- `dataType`은 자유 토큰이다: 기본형(문자열·숫자·boolean·date·int 등) 또는 도메인 명사(이름·전화번호·주소·부서명 등). 적합한 것이 없으면 label 값을 그대로 쓴다. 프로젝트에 필드 타입 카탈로그가 있으면 그 토큰을 우선한다 — 스튜디오가 CLX 생성 시 정식 토큰으로 정규화한다. 카탈로그는 `pum_list_field_types`(CLI: `.eb6/cli-tools/eb6-pum-list-field-types --project .`)로 조회할 수 있다 — 도구가 연결돼 있으면 반드시 먼저 조회해 그 어휘에서 고른다.
- 들여쓰기는 공백 4칸, 파일명은 `<화면명>.pum.json`.
- `referenceDesign`(최상위, 선택)은 참조 템플릿 이름이다 — 기존 파일에 있으면 유지하고, 임의로 만들어 넣지 않는다.
- **물리명(DB 컬럼명)은 PUM에 넣지 않는다.** `label`은 논리명(사람이 읽는 이름)이고, 물리명을 담는 속성을 지어 붙이지도 않는다. 입력에 물리명이 있으면 `<화면명>.gen.json`에 따로 기록한다 — 4절.

## 4. 물리명(컬럼명) 동반 기록 — `<화면명>.gen.json`

CLX 생성은 필드의 논리명(label)에서 데이터셋·데이터맵의 컬럼명(코드명)을 확정한다. 확정 순서는 `<화면명>.gen.json`의 `clx.termSources`(화면 오버라이드) → 프로젝트 용어 표준 `ai.gen/terms.json` → 로마자 폴백(논리명을 로마자로 옮긴 이름)이다. 입력에 이미 컬럼명이 있는데 gen.json에 적어 두지 않으면 생성기는 그것을 모른 채 폴백으로 컬럼을 만든다. 그래서 컬럼명이 보이면 설계와 함께 gen.json도 만든다.

### 4.1 판정 — 언제 만드나

설계 중인 필드의 논리명과 짝지어진 물리명(DB 컬럼명·식별자)이 입력 자료에 있을 때다. 흔한 형태:

- 요구정의서·대화에 병기된 경우: "회원번호(MBR_NO)", "회원번호 → MBR_NO", "회원번호 컬럼은 MBR_NO"
- 논리명·물리명(영문명) 열이 있는 컬럼 정의표·항목 정의표 — 테이블 정의서, 화면 설계서, 설계 DB(PMM 등)의 조회 결과
- DDL — `MBR_NO VARCHAR2(10)` 같은 컬럼 선언과 `COMMENT ON COLUMN … IS '회원번호'` 같은 컬럼 주석의 짝
- AS-IS 화면 소스(마이플랫폼 XML·기존 CLX)의 바인딩 컬럼과 그 라벨
- 사용자가 특정 필드의 물리명을 직접 지정

판정에서 제외:

- 컬럼명은 있는데 어느 필드에 대응하는지 근거가 없는 경우 — 넣지 않는다.
- eXERD 파일(`.exerd`·`.erdx`·`.xrd`)이 주어진 경우 — 컬럼을 옮겨 적지 않고 `exerd` 항목으로 파일을 가리킨다(4.3).
- 화면과 무관한 테이블 사전 전체를 옮기는 것 — gen.json은 화면 단위 오버라이드라 이 화면의 필드에 해당하는 것만 적는다. 여러 화면에 공통인 용어 표준은 `ai.gen/terms.json`이 자리이며, 그리로 올리는 것은 사용자가 명시적으로 요청할 때만 한다.

### 4.2 형식

```json
{
    "version": "1.0.0",
    "clx": {
        "termSources": [
            {
                "type": "manual",
                "data": {
                    "회원번호": "MBR_NO",
                    "회원명": "MBR_NM",
                    "가입일자": "JOIN_YMD"
                }
            }
        ]
    }
}
```

- `data`의 키는 pum.json 필드의 `label`과 **글자 그대로** 같아야 한다. 매칭은 논리명 전체 일치이고(공백을 뺀 변형과 `_`로 바꾼 변형만 함께 시도), 단어를 쪼개 조합하지 않는다. 라벨을 물리명에 맞춰 바꾸지 않는다 — 라벨은 요구가 정한다.
- 값은 자료에 적힌 표기 **그대로**, 공백 없는 한 토큰. 대소문자·스네이크 변환을 하지 않는다. 표기를 바꾸고 싶으면 값 자체를 원하는 표기로 적는다(자동 변환 설정은 없다).
- 근거 있는 필드만 적는다. 근거 없는 필드는 생략한다(생성기가 로마자 폴백으로 처리). 비슷한 이름으로 추정해 채우지 않는다.
- 같은 논리명에 자료마다 다른 물리명이 붙어 있으면 그 구역의 정보 엔티티(subject)에 해당하는 테이블 쪽을 택하고, 판단이 안 서면 넣지 않고 사용자에게 묻는다.
- 컬럼의 물리 타입(VARCHAR2·NUMBER·CHAR(8) 등)은 pum.json의 `dataType`에 쓰지 않는다. `dataType`은 3절 규칙대로 카탈로그 토큰이나 도메인 명사이며, 물리 타입은 추정의 참고 자료일 뿐이다.
- `type`은 항목의 **첫 속성**이어야 한다(파서가 첫 필드로 종류를 판정한다).
- 이 스킬이 쓰는 속성은 `version`·`clx.termSources`뿐이다. 다른 `clx` 옵션(`genSpecs`, `generateSampleDatas` 등)은 사용자가 요청하지 않는 한 적지 않고, 스키마에 없는 속성은 지어내지 않는다(추가 속성은 전부 오류).
- 들여쓰기 공백 4칸. pum.json과 같은 폴더에 `<화면명>.gen.json` — 기본 이름이 같아야 짝으로 인식된다.

### 4.3 eXERD 파일이 주어진 경우

```json
{"type": "exerd", "path": "${baseDir}/../erd/member.exerd"}
```

`${baseDir}`는 gen.json이 놓인 폴더의 절대 경로로 치환된다. 맨 상대 경로(`../erd/member.exerd`)는 해석되지 않으므로 반드시 `${baseDir}/…` 또는 절대 경로로 적는다. manual과 exerd를 함께 둘 수 있고, 배열에 적힌 순서대로 먼저 적중한 쪽이 이긴다.

### 4.4 이미 gen.json이 있을 때 — 병합

- 기존 `manual` 항목이 있으면 그 `data`에 키를 추가한다(같은 키는 새 값으로 덮어쓴다). 없으면 `termSources` 배열에 manual 항목을 추가한다.
- 다른 termSources 항목, `clx`의 다른 옵션(`genSpecs`, `generateSampleDatas` 등), `pum` 노드는 그대로 보존한다. 파일을 통째로 다시 쓰지 말고 필요한 키만 더한다.
- 요구에서 필드가 빠졌다고 gen.json의 키를 알아서 지우지 않는다. 남은 키는 해가 없고, 정리는 사용자가 요청할 때 한다.

### 4.5 예시

입력(테이블 정의서 일부):

| 컬럼명 | 논리명 | 타입 |
| --- | --- | --- |
| MBR_NO | 회원번호 | VARCHAR2(10) |
| MBR_NM | 회원명 | VARCHAR2(50) |
| JOIN_YMD | 가입일자 | CHAR(8) |

산출물은 둘이다. `member-search.pum.json`의 필드 라벨은 `회원번호`·`회원명`·`가입일자`(물리명 없음)이고, `member-search.gen.json`은 4.2의 형식 그대로다. 이후 `.eb6/cli-tools/eb6-clx-generate member-search.pum.json`이 gen.json을 읽어 `MBR_NO`·`MBR_NM`·`JOIN_YMD` 컬럼으로 데이터셋을 만든다. 동봉 `example-search-master-detail.gen.json`은 `example-search-master-detail.pum.json`과 짝을 이루는 완성 예시다 — 값은 견본이니 실제 자료의 컬럼명으로 전부 바꿔 쓴다.

### 4.6 마치기 전 점검

- pum.json의 `label`·`dataType`·`description` 어디에도 물리명·물리 타입이 섞이지 않았는가.
- 입력에 컬럼명이 있었다면 `<화면명>.gen.json`이 있고, `data`의 키가 pum.json의 `label`과 글자 그대로 같은가.
- 근거 없이 지어낸 물리명은 없는가.

## 5. 예시

- `example-search-master-detail.pum.json` — 검색 조건 + 결과 그리드 + 상세 필드셋. 가장 전형적인 구성.
- `example-tabbed-master-detail.pum.json` — `compose(layout: "tab")`으로 일반/세부 검색을 탭으로 묶은 변형.
- `example-search-master-detail.gen.json` — 첫 예시와 짝을 이루는 용어 정의(4절).

## 6. 경계

- 이 스킬의 산출물은 설계 파일(`.pum.json`)과 그에 딸린 용어 정의(`.gen.json`, 4절)까지다. pum.json → CLX 생성은 별도 단계로, `clx_generate`(CLI: `.eb6/cli-tools/eb6-clx-generate <파일.pum.json>`)를 호출하거나 스튜디오에서 수행한다 — 사용자가 생성까지 요청했을 때만 진행한다. 생성물에 이벤트 리스너와 스크립트 로직은 포함되지 않으므로, 화면을 완성하려면 생성 후 직접 구현해야 한다.
- 사용자가 명시적으로 요청하지 않는 한, PUM 작업에서 연관 CLX/JS 파일을 함께 수정하지 않는다.
- 설계가 확정되면 `pum_export_pptx`(CLI: `.eb6/cli-tools/eb6-pum-export-pptx <파일.pum.json>`)로 화면설계서 PPTX를 산출할 수 있다 — 프로젝트 ai.gen의 PPT 템플릿을 우선 사용한다.
