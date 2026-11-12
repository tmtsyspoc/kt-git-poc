var showClearButton = false;

var CPR_DEFAULTS = {
	controls: {
		accordion: {},
		audio: {},
		button: {},
		calendar: {
			datePosition: 'topLeft'
		},
		checkbox: {},
		checkboxgroup: {
			colCount: -1,
			fixedWidth: false,
			horizontalSpacing: 16,
			verticalSpacing: 8
		},
		combobox: {
			preventInput: true
		},
		container: {
			clipContent: true
		},
		customscroll: {
			minThumbSize: 30
		},
		dateinput: {
			buttonFocusable: true,
			showClearButton: showClearButton,
			clearLabelExp: 'fieldLabel + " " + i18n("--cpr-clear")',
			buttonLabelExp: 'fieldLabel + " " + i18n("--cpr-dateinput-button")'
		},
		dialog: {
			autoFocusedTarget: 'auto',
			headerClose: true,
			headerMovable: true,
			modal: true,
			resizable: true,
			restoreFocus: true
		},
		dynamiccontrolset: {},
		embeddedapp: {},
		embeddedpage: {},
		fileinput: {
			buttonFocusable: true,
			showClearButton: showClearButton,
			clearLabelExp: 'fieldLabel + " " + i18n("--cpr-clear")'
		},
		fileupload: {
			emptyMessage: '여기를 더블 클릭 또는 파일을 드래그 하세요',
			statusMessageExp: 'sstr(totalFileCount, "point") + "개, " + sstr(totalFileSize + totalFileSizeUnit, "point") + " 추가됨(최대 " + sstr(maxFileCount, "point") + "개, " + sstr(limitFileSize, "point") + " 제한)"'
		},
		grid: {
			clickMode: 'edit',
			columnMovable: true,
			collapsible: true,
			focusCycle: true,
			noDataMessage: '표시할 데이터가 없습니다',
			resizableColumns: 'all',
			tabMode: 'focusable',
			viewingMode: 'button',
			layout: {
				controls: {
					button: {
						horizontalAlign: "center",
						verticalAlign: "center",
						width: 64,
						height: 20
					},
					combobox: {
						topSpacing: 3,
						bottomSpacing: 3,
						leftSpacing: 6,
						rightSpacing: 6
					},
					inputbox: {
						topSpacing: 3,
						bottomSpacing: 3,
						leftSpacing: 6,
						rightSpacing: 6
					},
					dateinput: {
						topSpacing: 3,
						bottomSpacing: 3,
						leftSpacing: 6,
						rightSpacing: 6
					},
					maskeditor: {
						topSpacing: 3,
						bottomSpacing: 3,
						leftSpacing: 6,
						rightSpacing: 6
					},
					numbereditor: {
						topSpacing: 3,
						bottomSpacing: 3,
						leftSpacing: 6,
						rightSpacing: 6
					},
					searchinput: {
						topSpacing: 3,
						bottomSpacing: 3,
						leftSpacing: 6,
						rightSpacing: 6
					},
					fileinput: {
						topSpacing: 3,
						bottomSpacing: 3,
						leftSpacing: 6,
						rightSpacing: 6
					},
					textarea: {
						topSpacing: 3,
						bottomSpacing: 3,
						leftSpacing: 6,
						rightSpacing: 6
					}
				}
			}
		},
		htmlobject: {},
		htmlsnippet: {},
		image: {},
		inputbox: {
			buttonFocusable: true,
			showClearButton: showClearButton,
			clearLabelExp: 'fieldLabel + " " + i18n("--cpr-clear")',
		},
		linkedcombobox: {
			space: "4px",
			preventInput: true
		},
		linkedlistbox: {
			space: "4px"
		},
		listbox: {},
		maskeditor: {
			buttonFocusable: true,
			showClearButton: showClearButton,
			clearLabelExp: 'fieldLabel + " " + i18n("--cpr-clear")',
		},
		mdifolder: {
			tabsWithAutoSelection: false
		},
		menu: {},
		navigationbar: {
			tabTraversal: true,
			expandTrigger: 'click',
			menuType: 'accessiblemegamenu',
			displayExp: 'label + sstr(" " + depth + "단계", ["cl-sound-only"])'
		},
		notifier: {},
		numbereditor: {
			buttonFocusable: true,
			spinButton: false,
			showClearButton: showClearButton,
			clearLabelExp: 'fieldLabel + " " + i18n("--cpr-clear")'
		},
		output: {
			outputType: 'normal',
			unselectable: false
		},
		pageindexer: {
			pageIndexWidth: '24px',
			textExp: 'sstr(currentPageIndex, "pagination-current") + " / " + sstr(totalRowCount, "pagination-total")'
		},
		progress: {
			showText: true,
			displayExp: 'sstr("진행상황:" + self.max + "% 중 현재", ["cl-sound-only"]) + value + sstr("% 진행 중", ["cl-sound-only"])'
		},
		radiobutton: {
			colCount: -1,
			fixedWidth: false,
			horizontalSpacing: 16,
			verticalSpacing: 8
		},
		searchinput: {
			buttonFocusable: true,
			hideClearButton: true,
			hideSearchButton: false,
			searchLabelExp: 'fieldLabel + " " + i18n("--cpr-search")',
			clearLabelExp: 'fieldLabel + " " + i18n("--cpr-clear")'
		},
		sidenavigation: {
			indent: 0,
			selectionHighlightType: 'independent'
		},
		slider: {},
		tabfolder: {
			childCombinatorClass: 'tablist',
			headerArrowPosition: 'both',
			itemSpacing: 0,
			itemSizing: 'auto'
		},
		textarea: {},
		tree: {
			indent: 20
		},
		treecell: {
			indent: 20
		},
		uicontrolshell: {},
		video: {}
	},
	layouts: {
		xylayout: {
//			scrollable: false
		},
		responsivexylayout: {
//			scrollable: false
		},
		formlayout: {
			horizontalSpacing: '4px',
			verticalSpacing: '4px',
//			scrollable: false,
		},
		verticallayout: {
			spacing: 0,
//			scrollable: false
		},
		flowlayout: {
			verticalAlign: "middle",
			horizontalSpacing: 4,
			verticalSpacing: 4,
			scrollable: false
		}
	},
	environment: {
		useCustomScrollbar: true
	}
};