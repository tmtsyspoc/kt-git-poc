/************************************************
 * screenLayout.js
 * Created at 2023. 2. 27. 오전 9:26:47.
 *
 * @author tomatosystem
 ************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
	
	// 임시파일 생성
	app.lookup("fid1").addUploadedFile(new cpr.controls.UploadedFile({
		name: "file.xlsx",
		size: 25
	}));
	
	app.lookup("fid1").addUploadedFile(new cpr.controls.UploadedFile({
		name: "file.pdf",
		size: 10
	}));	
}



/*
 * 임베디드 페이지에서 load 이벤트 발생 시 호출.
 * 페이지의 Load가 완료되었을 때 호출되는 Event.
 */
function onEmbpage1Load(e){
	var embpage1 = e.control;
//	var embeddedPage = new cpr.controls.Embeddedpage("embpage1");
//	embeddedPage.src="app/src/A-2/A26_sample.html";
}
