/************************************************
 * udcCmnHtmlEditor.js
 * Created at 2023. 2. 13. 오후 2:51:17.
 *
 * @author You Minsang
 ************************************************/

var msKeyId;
var mbLoaded = false;
var moEditor;

// 수정여부 체크
var bModified = false;

var util = createCommonUtil();
var moLoader = null;
// 임시 첨부파일 배열
var vaTechUploadImgFiles = [];

var mbIsFirefoxMobile = false;

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function() {
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

/**
 * 이미지 파일 업로드 어댑터 생성
 * @param {any} editor
 */
function imageUploadAdapterPlugin(editor) {
	editor.plugins.get('FileRepository').createUploadAdapter = function(loader) {
		return new UploadAdapter(loader)
	}
}

function UploadAdapter(loader) {
	
	this.loader = loader,
		
		this.upload = function() {
			return this.loader.file.then(function(file) {
				return new Promise(function(resolve, reject) {
					this._initRequest();
					this._initListeners(resolve, reject, file);
					this._sendRequest(file);
				}.bind(this));
			}.bind(this));
		},
		
		this._initRequest = function() {
			var xhr = this.xhr = new XMLHttpRequest();
			xhr.open('POST', '../CmnFile/UploadImgTemp.do', true);
			xhr.responseType = 'json';
		},
		
		this._initListeners = function(resolve, reject, file) {
			var xhr = this.xhr;
			var loader = this.loader;
			var genericErrorText = '파일 업로드에 실패하였습니다. 관리자에게 문의하세요'
			
			xhr.addEventListener('error', function() {
				reject(genericErrorText);
			});
			xhr.addEventListener('abort', function() {
				reject();
			});
			xhr.addEventListener('load', function() {
				var response = xhr.response;
				if (!response || response.error) {
					return reject(response && response.error ? response.error.message : genericErrorText);
				}
				
				vaTechUploadImgFiles.push({
					"FILE": file,
					"SAVE_FILE_NM": response.url.replace("/ui/app/cmn/jsp/imgFreeBoard.jsp?fileNm=", "")
				});
				app.setAppProperty("techUploadImgFiles", vaTechUploadImgFiles);
				
				resolve({
					"default": response.url //업로드된 파일 주소
				});
			});
		},
		
		this._sendRequest = function(file) {
			var data = new FormData();
			data.append('upload', file);
			this.xhr.send(data)
		}
};

/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit( /* cpr.events.CEvent */ e) {
	if(util.isMobile() && /^(?=.*Firefox).*$/.test(navigator.userAgent)){
		mbIsFirefoxMobile = true;	
	}
	
	// 모바일-파이어폭스 브라우저에서 한글(조합문자)중복 오류에 따른 텍스트 에리어 사용
	if (mbIsFirefoxMobile) {
		var layout = app.getContainer().getLayout();
		layout.setRows(["1fr", "0px"]);
		layout.setRowVisible(0, true);
	}
	
	var scripts = document.head.querySelectorAll("script");
//	for (var idx = 0; idx < scripts.length; idx++) {
//		var item = scripts.item(idx);
//		
//		if (item.src.indexOf("ckeditor") != -1) {
//			mbLoaded = true;
//			break;
//		}
//	}
//	
//	if (mbLoaded) return;
	
	// ckeditor5 리소스 추가
	moLoader = new cpr.core.ResourceLoader();
	moLoader.addScript("thirdparty/ckeditor5/build/ckeditor.js");
	if(moLoader.needToLoad()) {
		moLoader.load().then(function(input){
			mbLoaded = true;
			app.lookup("shlHtmlEditor").redraw();
			
		});
	} else {
		mbLoaded = true;
	}
}

/*
 * 쉘에서 init 이벤트 발생 시 호출.
 */
function onShlHtmlEditorInit(e) {
	var shlHtmlEditor = e.control;
	// 한 화면 내에서는 한개의 에디터를 표준으로 작업하고, MDI 탭으로 화면이 구성되는 경우 구분값을 적용한다.
	msKeyId = "_"  + app.uuid;
	
	if (e.content) {
		try {
			if (e.content.firstChild) {
				if (e.content.firstChild.id == "CkEditor" + msKeyId) {
					e.preventDefault();
					
					//에디터 로드 시점에 호출할 수 있는 이벤트
					var event = new cpr.events.CUIEvent("afterLoad");
					app.dispatchEvent(event);
				}
			}
		} catch (error) {
			console.log(error);
		}
	}
	if(moEditor) {
		e.preventDefault();
	}
}

/*
 * 쉘에서 load 이벤트 발생 시 호출.
 */
async function onShlHtmlEditorLoad(e) {
	var bHideToolbar = app.getAppProperty("hideToolbar");
	var shlHtmlEditor = e.control;
	var content = e.content;
	if(moLoader && moLoader.needToLoad()) {
		
		await moLoader.load()
	}
//	moLoader.load().then(function(input){
//		
//	});
	if (!mbLoaded) return;
	var div = document.createElement("div");
	div.id = 'context-menu'+msKeyId;
	div.classList.add("cust-context");
	var btn1 = document.createElement("button");
	btn1.textContent = "Bold";
	btn1.setAttribute("data-command", "bold");
	var btn2 = document.createElement("button");
	btn2.textContent = "Underline";
	btn2.setAttribute("data-command", "underline");
	var btn3 = document.createElement("button");
	btn3.textContent = "Highlight";
	btn3.setAttribute("data-command", "highlight");
	div.appendChild(btn1);
	div.appendChild(btn2);
	div.appendChild(btn3);
	content.appendChild(div);
	
	shlHtmlEditor.registerComponent("ckeditor", content);
	var elckEditor = document.createElement("ckeditor");
	elckEditor.id = "CkEditor" + msKeyId;
	content.appendChild(elckEditor);
	
	var vaExtraPlugins = [imageUploadAdapterPlugin];
	
	// 디바이스 접속정보 추가확인이 필요함(태블릿의 경우 mediaName으로 구분)
	if (app.targetMediaName != 'default') vaExtraPlugins.push(mobileSpaceUpset);
	var editorOption = {
			language: 'ko',
			fontSize: {
				options: [
					12, 14, 18, 22, 28, 36, 48
				]
			},
			fontFamily: {
				options: [
					'default',
					'맑은 고딕',
					'바탕',
					'돋움',
					'궁서체'
				]
			},
			mediaEmbed: {
				previewsInData: true
			},
			image: {
				toolbar: [
					'imageStyle:inline',
					'imageStyle:block',
					'imageStyle:side',
					'linkImage'
				]
			},
			table: {
				contentToolbar: [
					'tableColumn',
					'tableRow',
					'mergeTableCells',
					'tableCellProperties'
				]
			},
			licenseKey: '',
			codeBlock: {
				languages: [{
						language: 'javascript',
						label: 'JavaScript',
						class: 'language-js'
					},
					{
						language: 'less',
						label: 'CSS',
						class: 'language-less'
					},
					{
						language: 'java',
						label: 'Java',
						class: 'language-java'
					},
					{
						language: 'text',
						label: 'text',
						class: 'nohighlight'
					}
				]
			},
			link: {
				addTargetToExternalLinks: true,
				decorators: [{
					mode: 'manual',
					label: 'External Link',
					attributes: {
						target: '_blank',
					}
				}]
			},
			extraPlugins: vaExtraPlugins, // 이미지 업로드 어댑터, 모바일일 경우 공백 어댑터 추가
			removePlugins: [] // 불필요 플러그인 제거
			//placeholder: "placeholder", // 필요시 사용									
		}
		if(app.getHostProperty("initValue") == "table") {
			editorOption["toolbar"]= ["insertTable"];
		}
	// CK에디터 create
	ClassicEditor.create(document.querySelector('#CkEditor' + msKeyId), editorOption
	).then(function(editor) {
		moEditor = editor;
		
		if(app.getHostProperty("initValue") == "table") {
			editor.conversion.for("downcast").add(function(dispatcher){
				dispatcher.on("insert:table",function(evt,data,conversionApi){
					var viewWriter = conversionApi.writer;
					var tableElement = conversionApi.mapper.toViewElement(data.item);
					if(!tableElement.hasAttribute("style") || !tableElement.getStyle("width")){
						viewWriter.setStyle("width","100%",tableElement);
					}
				})
			})
		}
		initContextMenu();
		// Editor 컨텐츠 영역의 height 재조정
		setAutoHeight();
		if(moSettedValue) {
			moEditor.setData(moSettedValue);
		}
		/* 내부 데이터 onChange 이벤트 필요시 활용*/
		moEditor.model.document.on('change:data', function(evt, data) {
			bModified = true;
		});
		
		// 에디터 툴바 숨김여부(default:false)
		if (bHideToolbar) {
			editor.ui.view.toolbar.element.style.display = 'none';
		} else {
			editor.ui.view.toolbar.element.style.display = 'flex';
		}
		
		//에디터 로드 시점에 호출할 수 있는 이벤트
		var event = new cpr.events.CUIEvent("afterLoad");
		app.dispatchEvent(event);
		
	}).catch(function(error) {
		console.error(error);
	});
}

function initContextMenu(){
	const menu = document.getElementById("context-menu"+msKeyId);
	const editorEditable = moEditor.ui.view.editable.element;
	
	moEditor.model.document.selection.on("change:range",function(){
		const selection = moEditor.model.document.selection;
		
		if(!selection.isCollapsed) {
			const domSelection = window.getSelection();
			const range = domSelection.getRangeAt(0);
			const rect = range.getBoundingClientRect();
			var actRect = app.getHost().getActualRect()
			menu.style.top = `${rect.top - actRect.top -40}px`;
			menu.style.left = `${rect.left - actRect.left}px`;
			menu.style.display = "block";
		} else {
			menu.style.display = "none";
		}
	});
	
	menu.addEventListener("click",function(ev){
		if(ev.target.tagName == "BUTTON") {
			const command = ev.target.getAttribute("data-command");
			
			if(command == "highlight") {
				moEditor.execute("highlight",{value:"yellowMarker"});
			} else {
				moEditor.execute(command);
			}
			
			moEditor.editing.view.focus();
			menu.style.display = "none";
 		}
	})
}

/**
 * 모바일 안드로이드 os의 경우 가상 키보드, 물리적 키보드가 모두 사용될 수 있으므로 
 * 입력 이벤트 모델이 달라 한글 입력시 버그가 있는점을 고려하여 space를 반각 특수문자로 치환함 
 * @param {any} editor
 */
function mobileSpaceUpset(editor) {
	
	editor.editing.view.document.on('beforeinput', function(evt, data) {
		if (data.inputType === 'insertText' && data.data === ' ') {
			data.data = ' ';
		}
	});
}

/**
 * Editor 컨텐츠 영역의 height를 재조정합니다.
 * 에디터 영역의 높이가 확대/축소 될 경우 크기조정, 동적으로 컨텐츠를 그리는 경우 해당 동작 수행이 필요합니다.
 */
function setAutoHeight() {
	
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
		
		if (!moEditor) return false;
		
		// 현재 테크돔 입력 에디터는 표준 크기를 사용하므로 렌더링이 완료되지 않았을 경우를 고려하여 고정크기값을 fix함	
		var vnHeight = 700;
		
		// 부모높이가 렌더링 되었을경우 툴바 height 제외한 높이를 설정함
		var vnParentHeight = app.getHost().getActualRect();
		if (vnParentHeight.height > 0) {
			var vnEditorToolbarHeight = moEditor.ui.view.toolbar.element.offsetHeight;
			vnHeight = vnParentHeight.height - vnEditorToolbarHeight;
		}
		
		moEditor.editing.view.change(function(writer) {
			writer.setStyle('height', vnHeight + 'px', moEditor.editing.view.document.getRoot());
		});
		
	});
}
exports.setAutoHeight = setAutoHeight;

/**
 * Editor Value를 반환합니다. 
 * @return {String} Value
 */
exports.getValue = function() {
	
	if (!moEditor) return false;
	
	return moEditor.getData();
	
}
var moSettedValue = null;
/**
 * Editor Value를 입력합니다.
 * @param {String} psValue 입력 값
 */
exports.setValue = function(psValue) {
	
	psValue = replaceCont(psValue);		
	if (!moEditor) { // 최초 라이브러리 렌더링시 지연될 경우를 고려하여 interval로 2초간 유예함
		moSettedValue = psValue;
//		var i = 0;
//		// pc
//		var loadInterVal = setInterval(function() {
//			i++;
//			if (moEditor) {
//				clearInterval(loadInterVal);
//				return moEditor.setData(psValue);
//			} else if (i > 20) {
//				clearInterval(loadInterVal); // 로드되지 않을시 처리
//			}
//		}, 100);
		
	} else {				
		moEditor.setData(psValue);		
	}
	
}

// 임시 첨부파일 배열 초기화
exports.clearArrImgFiles = function() {
	vaTechUploadImgFiles = [];
	app.setAppProperty("techUploadImgFiles", vaTechUploadImgFiles);
}

// 수정여부 체크
exports.isModified = function() {
	return bModified;
}

exports.setModifyState = function(bState) {
	bModified = bState;
}

exports.setFocusEditor = function() {
	if (moEditor) {
		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
			moEditor.focus();
		});
	}
}

/**
 * 에디터 라이브러리 로드 여부
 */
exports.isLoad = function() {
	if (moEditor) {
		return true;
	} else {
		return false;
	}
}

/**
 * 포커싱할 이전컨트롤을 설정합니다.
 * @param {cpr.controls.UIControl} pcControl
 */
exports.setFocusPrev = function(pcControl) {
	if (moEditor) {
		var voViewDocument = moEditor.editing.view.document;
		voViewDocument.on("keydown", function(evt, data) {
			if (data.shiftKey && data.keyCode == cpr.events.KeyCode.TAB && voViewDocument.isFocused) {
				data.preventDefault();
				data.stopPropagation();
				//				evt.stop(); // Prevent executing the default handler.
				
				pcControl.focus();
			}
		})
	}
}

/**
 * 포커싱할 다음컨트롤을 설정합니다.
 * @param {cpr.controls.UIControl} pcControl
 */
exports.setFocusNext = function(pcControl) {
	if (moEditor) {
		var voViewDocument = moEditor.editing.view.document;
		voViewDocument.on("keydown", function(evt, data) {
			if (!data.shiftKey && data.keyCode == cpr.events.KeyCode.TAB && voViewDocument.isFocused) {
				data.preventDefault();
				data.stopPropagation();
				//				evt.stop(); // Prevent executing the default handler.
				
				pcControl.focus();
			}
		})
	}
}

/**
 * 
 * @param {String} psValue
 */
function replaceCont(psValue) {
	
	// 기존 다음 에디터에서 작성된 글 판단은 table class로 판단합니다.
	if (psValue.indexOf('<table class="txc-wrapper"') === -1) return psValue;
	
	var replaceVal = psValue;
	var firstDivIdx = replaceVal.indexOf('<td bgcolor="#ffffff">') + 22;
	var lastDivIdx = replaceVal.lastIndexOf("</td>");
	replaceVal = replaceVal.substring(firstDivIdx, lastDivIdx);
	replaceVal = replaceVal.replace(/div/g, 'p');
	replaceVal = replaceVal.replace(/<br>/g, '');
	replaceVal = replaceVal.replace(/ style=/g, '><span style='); // 마지막 </span> 태그는 에디터 set으로 자동적용
	
	// padding style 처리
	while (replaceVal.indexOf('padding-bottom:20px;') != -1) {
		var stylePaddingBotmIdx = replaceVal.indexOf('padding-bottom:20px;');
		var targetTagIdx = replaceVal.indexOf("</p>", stylePaddingBotmIdx);
		replaceVal = replaceVal.substr(0, targetTagIdx) + "</p><p>" + replaceVal.substr(targetTagIdx, replaceVal.length);
		replaceVal = replaceVal.replace("padding-bottom:20px;", "");
	}
	
	return replaceVal;
}
