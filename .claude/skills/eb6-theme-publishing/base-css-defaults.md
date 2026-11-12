# 기본 CSS(cleopatra.css)가 깔아두는 값 — 테마 템플릿이 덮지 않는 것들

런타임 내장 `cleopatra.css`(런타임 소스 `resources/css/*.less` 합본)는 프로젝트 테마보다 먼저 로드된다. 아래는 그 기본 css의 색·배경·보더·그림자·아웃라인 선언 가운데 **스튜디오가 생성하는 테마 템플릿(`clx-src/theme/**/*.part.less`)이 같은 셀렉터·같은 속성으로 덮지 않는 것**을 컨트롤별로 추린 표다. 테마 파일을 아무리 고쳐도 여기 적힌 값은 화면에 그대로 남는다. 덮으려면 적힌 셀렉터를 그대로 테마 파트에 옮겨 적고 새 값을 준다.

- 기준: 런타임 1.0.6184(2026-09-08 빌드), 기본 css 850개 셀렉터·색 관련 선언 1,307건 중 템플릿이 덮는 285건을 뺀 나머지에서 색이 들어간 362건.
- 프로젝트가 템플릿 위에 이미 손을 댔다면 그 부분은 이 표와 다를 수 있다. 표는 "기본값이 이렇다"는 기준이지 현재 프로젝트 상태가 아니다.
- 갱신 방법: 런타임 `resources-gen/css/cleopatra.css`(스튜디오 assets 번들의 `runtime/latest/css/cleopatra.css`와 동일)와 새 프로젝트의 `clx-build/theme/cleopatra-theme.css`를 셀렉터+속성 단위로 비교해 다시 뽑는다.

## 0. 기본 css가 쓰는 변수(테마 settings와 별개)

기본 css는 아래 값으로 이미 컴파일돼 있다. 테마 `settings.part.less`를 바꿔도 이 값은 안 바뀐다.

| 변수 | 값 | 어디에 박히나 |
|---|---|---|
| 주조 tint | `#1F8BF0`(hover) / `#1369C5`(active·포커스 보더) | numbereditor·dateinput 증감 버튼, 메뉴·내비 스크롤 화살표 hover, 이미지 영역 stroke, 파일업로드 버튼 포커스 |
| selection 배경 | `rgba(32,138,237,.5)` (반투명 — 템플릿의 `#208AED`와 다름) | 그리드 행·셀 선택, 달력 선택일 |
| selection 전경 | `#FFFFFF` | 위와 같음 |
| hover 배경/전경 | `#DAEFFC` / `#333435` | 메뉴 아이템, 페이지인덱서, 달력 범위 선택 |
| disabled 배경 | `rgba(119,119,119,.5)` | 그리드·비디오·오디오 disabled 오버레이 |
| disabled 텍스트 / 보더 / 선택 배경·전경 | `#666` / `#ddd` / `#ccc`·`#777` | 체크박스·라디오·리스트박스·트리셀 disabled |
| 기본 텍스트 / 보더 | `#333` / `#bbb` | 그리드 셀 보더, 틀고정 경계, 드롭 인디케이터 |

## 1. 공통 (모든 화면)

| 셀렉터 | 속성: 값 | 비고 |
|---|---|---|
| `::placeholder` 계열, `.cl-placeholder` | `color: #757575` (`!important` 포함) | 입력기 플레이스홀더. 다크 배경이면 대비 확인 |
| `.cl-unavailable` / `.cl-unavailable .cl-text` | `border: 1px solid red` / `color: red` | 렌더 오류 표시. 시맨틱, 의미 유지 |
| `.cl-vscrollbar`, `.cl-hscrollbar` 및 `.cl-arrow-*` | `background-color: #f0f0f0` | 커스텀 스크롤바 트랙·화살표. **테마 파트 없음** |
| `.cl-vscrollbar .cl-thumb`, `.cl-hscrollbar .cl-thumb` | `background-color: #cdcdcd` | 스크롤바 썸 |
| `.cl-formlayout-row-shade`, `.cl-formlayout-column-shade` | `background-color: #eeeeee` | 폼레이아웃 셰이드 |
| `.cl-formlayout-vertical-separator`, `.cl-formlayout-horizontal-separator` | `background-color: #cccccc` | 폼레이아웃 구분선 |
| `.cl-formlayout-*-lightweight-resizer` | `background-color: #ff3b30` | 디자인 리사이저 피드백 |

## 2. 컨트롤별

### 버튼 `.cl-button`
| 셀렉터 | 속성: 값 | 비고 |
|---|---|---|
| `.cl-button` | `background-color: #E0E1E2` | 템플릿은 `background-image` 그래디언트만 선언. 플랫 처리 시 이 회색이 드러남 |

### 입력기 계열 — 상단 인셋 그래디언트
템플릿은 `background-color: #fff`만 선언하고, 기본 css는 그 위에 밝은 띠를 얹는다.

| 셀렉터 | 속성: 값 |
|---|---|
| `.cl-inputbox`, `.cl-searchinput`, `.cl-textarea`, `.cl-maskeditor`, `.cl-numbereditor`, `.cl-treecell` | `background-image: linear-gradient(#eee, white 3px)` |
| `.cl-searchinput`, `.cl-numbereditor`, `.cl-dateinput`, `.cl-textarea`, `.cl-fileinput`, `.cl-treecell` | `background-color: #fff` (템플릿에 선언 없음) |
| 위 컨트롤들의 `.cl-text` | `background-color: transparent` (유지해도 무방) |

### 숫자·날짜 입력기 스피너
| 셀렉터 | 속성: 값 |
|---|---|
| `.cl-numbereditor:not(.cl-disabled) .cl-numbereditor-increase:hover` / `-decrease:hover` | `background-color: #1F8BF0` |
| 같은 셀렉터의 `:active` | `background-color: #1369C5` |
| `.cl-dateinput:not(.cl-disabled) .cl-dateinput-increase:hover` / `-decrease:hover` | `background-color: #1F8BF0` |
| 같은 셀렉터의 `:active` | `background-color: #1369C5` |
| `.cl-dateinput.cl-focus` | `border: #1369C5 solid 1px` |
| `.cl-grid-cell .cl-control.cl-border-none.cl-focus .cl-numbereditor-buttons` | `border-left-color: #C8C9CA` |

### 그리드 `.cl-grid` (기본 css 잔존이 가장 많은 컨트롤, 73건)
| 셀렉터 | 속성: 값 | 비고 |
|---|---|---|
| `.cl-grid .cl-grid-header` | `background-image: linear-gradient(#FCFEFF, #E0E1E2)` | 템플릿의 헤더 블록은 비어 있음 |
| `.cl-grid.cl-leftsplit .cl-grid-centersplit` / `.cl-rightsplit …` | `border-left/right: 1px solid #bbb` | 틀고정 경계 |
| `.cl-grid.cl-disabled` | `background-color: rgba(119,119,119,.5)`, `color: #333` | |
| `.cl-grid-row.cl-inserted` | `background-color: rgba(225,242,253,.5)`, `color: #444444` | 행 상태 |
| `.cl-grid-row.cl-modified` | `background-color: rgba(250,247,249,.5)`, `color: #444444` | |
| `.cl-grid-row.cl-editing` | `background-color: rgba(247,219,188,.5)`, `color: #444444` | |
| `.cl-grid-row.cl-deleted`, `.cl-grid-row.cl-nullified` | `background-color: #F2F0F0`, `color: #C2C0C0` | |
| `.cl-grid-row.cl-selected`, `.cl-grid-cell.cl-selected` | `background-color: rgba(32,138,237,.5)`, `color: #FFFFFF` | 템플릿은 주석 처리 |
| `.cl-grid-row.cl-selected .cl-merged` | `color: #333` | |
| 행 상태 × 내부 컨트롤 12종 (`.cl-grid-row.cl-inserted .cl-inputbox` 등: default-cell·inputbox·output·maskeditor·numbereditor·dateinput·button·textarea·combobox·treecell·fileinput·searchinput) | inserted/modified: `color: #444444` / deleted/nullified: `color: #C2C0C0` | **특이도가 높아 테마의 `.cl-inputbox { color }`를 이긴다** |
| `.cl-grid-cell.cl-dropleft` / `.cl-dropright` | `border-left/right: 2px dashed #757575` | 컬럼 이동 가이드 |
| `.cl-default-cell.cl-disabled` | `border-color: #ddd`, `background-color: #ccc`, `color: #333` | |

### 그리드 필터 다이얼로그 `.cl-gridfilter`
| 셀렉터 | 속성: 값 |
|---|---|
| `.cl-gridfilter.cl-overlay` | `background-color: rgba(0,0,0,.1)` |
| `.cl-gridfilter .cl-filterdlg` | `background-color: #ffffff`, `border: 1px solid gray` |
| `.cl-gridfilter .cl-filterdlg .cl-filterdlg-header` | `background-image: linear-gradient(#FCFEFF, #E0E1E2)` |
| `… .cl-checkbox .cl-checkbox-icon:focus`, `… .cl-checkbox.cl-focus .cl-checkbox-icon` | `outline: 1px dotted black` |

### 달력 `.cl-calendar` (77건)
| 셀렉터 | 속성: 값 |
|---|---|
| `.cl-calendar .cl-calendar-header`, `… .cl-calendar-content-week`, `… .cl-calendar-content-header` | `background-color: #f5f5f5` |
| `.cl-calendar:not(.cl-disabled) .cl-calendar-content-day:not(.cl-disabled):hover` (month·year·other-month 동일) | `background-color: #656565`, `color: white` |
| `… .cl-calendar-content-day`, `-month`, `-year`, `.cl-other-month` | `border-color: #fff` |
| `… .cl-other-month` | `color: #a7a6a6` |
| `… .cl-*.cl-disabled` (day·month·year·other-month), `… .cl-calendar-footer.cl-disabled .cl-calendar-footer-text` | `background-color: #f2f2f2`, `color: #a7a6a6` |
| `… .cl-*.cl-selected` | `background-color: rgba(32,138,237,.5)`, `color: #FFFFFF` |
| `… .cl-*.cl-range-selected` | `background-color: #DAEFFC`, `color: #333435` |
| `… .cl-*.cl-calendar-defaultdate` | `color: rgba(32,138,237,.5)` |
| `… .cl-*.cl-calendar-anniversary` | `color: red`, `box-shadow: inset 0 -0.25rem 0 red` (시맨틱) |
| `.cl-calendar .cl-calendar-item`, `.cl-calendar .cl-anniversary` | `background-color: #f6bf26` |
| 위 둘의 `.cl-selected` | `box-shadow: inset 0 0 0 1px #656565` |
| `.cl-calendar .cl-calendar-more:hover` | `background-color: #f1f3f4` |
| `.cl-calendar.cl-anniversaries .cl-calendar-content-day` 및 요일별 other-month | `border-bottom/right: 1px solid #bbb` |
| `.cl-calendar.cl-focus … .cl-calendar-current`, `.cl-calendar.cl-popup .cl-*.cl-calendar-current` | `box-shadow: inset 0 0 0 0.125rem #656565` |
| `.cl-calendar.cl-popup` | `box-shadow: 0 2px 2px 0 rgba(0,0,0,.3)` |

### 콤보박스 / 연결 콤보
| 셀렉터 | 속성: 값 |
|---|---|
| `.cl-combobox-list` | `background-color: white` |
| `.cl-combobox-list.cl-popup`, `.cl-linkedcombobox-list.cl-popup` | `box-shadow: 0 2px 2px 0 rgba(0,0,0,.3)` |
| `.cl-combobox-list.cl-multi-select .cl-combobox-item:not(.cl-disabled).cl-selected` | `background-color: inherit`, `color: inherit` (다중선택은 선택 배경 없음 — 의도된 동작) |

### 리스트박스 / 연결 리스트박스 / 트리
| 셀렉터 | 속성: 값 |
|---|---|
| `.cl-listbox … .cl-listbox-item.cl-droptop` / `.cl-dropbottom` (linkedlistbox·tree 동일) | `box-shadow: inset 0 ±2px 0 #bbb` |
| `.cl-tree:not(.cl-disabled) .cl-tree-item:not(.cl-disabled).cl-dropmiddle` | `background-color: #bbb` |
| `.cl-listbox … .cl-listbox-item.cl-disabled` | `color: #666` |
| `… .cl-listbox-item.cl-disabled.cl-selected` | `color: #777`, `background-color: #ccc` |
| `.cl-linkedlistbox … .cl-linkedlistbox-header` | `background-image: linear-gradient(to bottom, #FEFFFF, #EFF0F1)` |

### 메뉴 `.cl-menu`
| 셀렉터 | 속성: 값 | 비고 |
|---|---|---|
| `.cl-menu .cl-menu-list` | `background-color: white` | |
| `.cl-menu .cl-menu-list .cl-arrow-up:hover` / `.cl-arrow-down:hover` | `background-color: #1F8BF0` | |
| `.cl-menu:not(.cl-disabled) .cl-menu-list .cl-menu-item:not(.cl-disabled):not(.cl-selected):hover` | `background-color: #DAEFFC`, `color: #333435` | **템플릿 셀렉터에 `.cl-menu-list`가 빠져 있어 이 기본값이 이긴다** |
| `.cl-menu:not(.cl-disabled) .cl-menu-list .cl-menu-item:not(.cl-disabled).cl-hover` | 위와 같음 | 위와 같음 |

### 내비게이션 바 / 사이드 내비게이션
| 셀렉터 | 속성: 값 |
|---|---|
| `.cl-navigationbar`, `.cl-navigationbar-list`, `.cl-sidenavigation` | `background-color: #fff`/`white` |
| `.cl-navigationbar .cl-navigationbar-prev` / `-next` | `background-color: #eee` |
| `.cl-navigationbar-list .cl-arrow-up:hover` / `.cl-arrow-down:hover` | `background-color: #1F8BF0` |
| `.cl-navigationbar-accessiblemegamenu`·`-megamenu`·`-fullmenu`의 `.cl-navigationbar-listitem`(및 `.cl-level-1` 하위) | `background-color: #E6EDF0` |
| `.cl-sidenavigation.cl-disabled .cl-sidenavigation-item` | `color: #666` |

### 탭폴더 `.cl-tabfolder`
| 셀렉터 | 속성: 값 |
|---|---|
| `.cl-tabfolder .cl-tabfolder-header .cl-tabfolder-prev` / `-next` | `background-color: #eee` |
| `… .cl-tabfolder-item.cl-disabled` | `background: #eee`, `color: #999`, `text-shadow: 0 1px 0 white` |
| `… .cl-insertion-feedback` | `background-color: #ff3b30` |

### 아코디언 `.cl-accordion`
| 셀렉터 | 속성: 값 |
|---|---|
| `.cl-accordion` | `background-color: #fff` |
| `.cl-accordion .cl-accordion-header` | `background-color: #F2F4F5`, `border: solid 1px #B7B8BA` |
| `.cl-accordion .cl-accordion-header:hover` | `background-color: #D7D7D9` |
| `.cl-accordion.cl-disabled .cl-accordion-header:hover` | `background-color: #F2F4F5` |

### 페이지인덱서 `.cl-pageindexer` (31건)
| 셀렉터 | 속성: 값 |
|---|---|
| `.cl-pageindexer .cl-pageindexer-first`/`-last`/`-prev`/`-next`/`-index` | `background-color: white` |
| 위 요소들의 `:focus` | `outline: 1px solid #4d90fe` |
| `.cl-pageindexer:not(.cl-disabled) …:hover`, `….cl-hover` (index는 `:not(.cl-selected)`) | `background-color: #DAEFFC` |
| `.cl-pageindexer.cl-disabled …` 5종 | `background-color: #e7e7e7`, `text-shadow: 0 1px 0 white` |
| `.cl-pageindexer.cl-disabled .cl-pageindexer-index.cl-selected` | `border-color: #888` |

### 노티파이어 `.cl-notifier-item` (시맨틱 5종)
| 셀렉터 | color / background-color / border-color |
|---|---|
| `.cl-notifier-item.cl-notifier-default` | `#000` / `#EEE` / `#AAA` |
| `….cl-notifier-success` | `#3c763d` / `#dff0d8` / `#d6e9c6` |
| `….cl-notifier-info` | `#31708f` / `#d9edf7` / `#bce8f1` |
| `….cl-notifier-warning` | `#8a6d3b` / `#fcf8e3` / `#faebcc` |
| `….cl-notifier-danger` | `#a94442` / `#f2dede` / `#ebccd1` |

### 프로그레스바 `.cl-progress`
| 셀렉터 | 속성: 값 |
|---|---|
| `.cl-progress` | `background-image: linear-gradient(#aaa, #E6E7E9 4px)`, `text-shadow: 0 1px 0 white` |
| `.cl-progress .cl-progress-bar` | `background-image: linear-gradient(#99D1F1, #1C6DA0, #3397D4)` |
| `.cl-progress.cl-disabled` / `… .cl-progress-bar` | `linear-gradient(#ccc, #eee 4px)` / `linear-gradient(#eee, #aaa, #ddd)` |

### 슬라이더 `.cl-slider`
| 셀렉터 | 속성: 값 |
|---|---|
| `.cl-slider .cl-slider-bar` | `background-color: #fff` |
| `… .cl-slider-bar.cl-horizontal` / `.cl-vertical` | `linear-gradient(#ddd, white 3px)` / `linear-gradient(to right, #ddd, white 3px)` |
| `… .cl-slider-handle .cl-slider-label` | `background-color: #666`, `border: 1px solid #666`, `color: #eee` |

### 파일 업로드 `.cl-fileupload`
| 셀렉터 | 속성: 값 |
|---|---|
| `.cl-fileupload .cl-fileupload-header` | `background-image: linear-gradient(to bottom, #FFFFFF, #F3F3F3)` |
| `… .cl-fileupload-footer .cl-fileupload-buttons .cl-fileupload-button` | `background-image: linear-gradient(#fefefe, #e6e6e6)`, `color: #333`, `border: 1px solid #b7b7b7` |
| 위 버튼 `:focus` | `border: solid 1px #1369C5` |
| `.cl-fileupload:not(.cl-disabled) .cl-fileupload-button:hover` | `background-color: #686868`, `background-image: linear-gradient(to bottom, #686868, #505050)`, `border: 1px solid #404040`, `color: #fff` |
| `.cl-fileupload:not(.cl-disabled) .cl-fileupload-file:hover` / `-uploadedfile:hover` | `background-color: #a8e4ff` |

### 체크박스 / 라디오 / 체크박스그룹
| 셀렉터 | 속성: 값 |
|---|---|
| `.cl-checkbox.cl-disabled`, `.cl-checkboxgroup.cl-disabled`, `.cl-checkboxgroup .cl-checkbox.cl-disabled`, `.cl-radiobutton.cl-disabled`, `.cl-radiobutton .cl-radiobutton-item.cl-disabled` | `color: #666` |
| `.cl-checkboxgroup`, `.cl-radiobutton` | `color: #333` |
| `.cl-checkbox.cl-focus .cl-checkbox-icon`, `.cl-checkbox.cl-focus.cl-iconalign-none .cl-text`, `.cl-checkboxgroup.cl-focus .cl-checkbox .cl-checkbox-icon:focus`(및 `.cl-text:focus`), `.cl-radiobutton.cl-focus/:focus … .cl-radiobutton-icon:focus/.cl-focus`(및 `.cl-text`) | `outline: 1px dotted black` |

### 다이얼로그 / 툴팁 / 트리셀 / 상태셀 / 미디어
| 셀렉터 | 속성: 값 |
|---|---|
| `.cl-dialog` | `background-color: white` (헤더 `#1D7FDC`는 템플릿에도 있음) |
| `.cl-tooltip` | `background-color: #fff`, `box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12)` |
| `.cl-treecell` | `background-color: #fff`, `color: #333`, `background-image: linear-gradient(#eee, white 3px)` |
| `.cl-treecell.cl-focus` / `.cl-treecell.cl-disabled` | `border-color: #1369C5` / `border-color: #ddd`, `background-color: #ccc`, `color: #666` |
| `.cl-treecell .cl-treecell-item.cl-disabled` | `color: #666` |
| `.cl-statecell` | `color: #333` |
| `.cl-image-area-item` | `stroke: #1F8BF0` |
| `.cl-video.cl-disabled .cl-overlay`, `.cl-audio.cl-disabled .cl-overlay` | `background-color: rgba(119,119,119,.5)` |

## 3. 특이도 함정 — 테마가 뒤에 와도 지는 곳

| 테마 템플릿 셀렉터 | 이기는 기본 css 셀렉터 | 결과 |
|---|---|---|
| `.cl-inputbox { color }` (output·textarea·maskeditor·numbereditor·dateinput·combobox·button·searchinput·fileinput 동일) | `.cl-grid-row.cl-inserted .cl-inputbox` 등 행 상태 4종 | 그리드 안 입력기 텍스트색은 행 상태색이 우선 |
| `.cl-menu:not(.cl-disabled) .cl-menu-item:not(.cl-disabled):not(.cl-selected):hover` (및 `.cl-hover`) | `.cl-menu:not(.cl-disabled) .cl-menu-list .cl-menu-item:not(.cl-disabled)…` | 메뉴 hover는 테마 `@hover-background`가 적용되지 않음. 테마 셀렉터에 `.cl-menu-list`를 넣어야 함 |
| `.cl-numbereditor.cl-focus .cl-numbereditor-buttons { border-left-color }` | `.cl-grid-cell .cl-control.cl-border-none.cl-focus .cl-numbereditor-buttons` | 그리드 셀 안에서는 `#C8C9CA` |
| `.cl-combobox-list .cl-combobox-item.cl-selected` | `.cl-combobox-list.cl-multi-select …:not(.cl-disabled).cl-selected { inherit }` | 다중선택 콤보는 선택 배경 없음(의도) |
| `.cl-tabfolder … .cl-tabfolder-item:not(.cl-selected):hover` | `.cl-tabfolder.cl-disabled … { background-color: inherit }` | disabled 탭폴더는 hover 없음(의도) |
| `.cl-pageindexer .cl-pageindexer-index.cl-selected { border-color }` | `.cl-pageindexer.cl-disabled … { #888 }` | disabled 상태 우선(의도) |

## 4. 아이콘 — 전부 PNG, css로 색 변경 불가

기본 css의 `url(icons/*.png)` 선언 310건, 파일 100장. 컨트롤별 건수: 파일업로드 51, 트리 29, 트리셀 21, 체크박스 17, 콤보박스 17, 라디오 16, 달력 16, 체크박스그룹 15, 내비게이션 14, 메뉴 10, 그리드 9, 날짜입력 9, 검색입력 8, 다이얼로그 8, 페이지인덱서 8, 숫자입력 7, 그리드 필터 6, 탭폴더 6, 노티파이어 6, 사이드내비 6, 상태셀 5, 연결리스트 4, 입력기(클리어 버튼) 4, 슬라이더 4, 파일입력 4, 연결콤보 3, 아코디언 2, 스크롤바 화살표 4, 마스크에디터 1.

- 템플릿의 `url(icons/…)`는 테마 css 위치 기준 상대 경로라, 주석을 풀려면 `clx-src/theme/icons/`에 같은 이름의 파일이 있어야 한다.
- 다크 테마 응급 처치: `.cl-checkbox-icon`, `.cl-radiobutton-icon`, `.cl-combobox-button`, `.cl-sort`, `.cl-expander`, `.cl-treeicon`, `.cl-dialog-close` 등 아이콘 전용 요소에 `filter: invert(1)` 계열을 얹고 렌더로 확인. 텍스트가 함께 있는 요소에는 쓰지 않는다.

## 5. 템플릿 주석과 실제 기본값이 어긋난 사례

| 템플릿 주석 | 실제 기본 css |
|---|---|
| `grid.part.less` `.cl-filterdlg` `// width: 300px;` | `width: 350px` |
| `settings.part.less` `@selection-background: #208AED` (템플릿 값) | 기본 css는 `rgba(32,138,237,.5)` — 그리드·달력 선택색은 반투명 |

주석은 힌트로만 쓰고, 값은 이 문서의 표 또는 실제 렌더로 확인한다.
