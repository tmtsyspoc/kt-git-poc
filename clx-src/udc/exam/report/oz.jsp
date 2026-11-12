<%@ page language="java" contentType="text/html; charset=utf-8"
	pageEncoding="utf-8" session="false"%>
<%@ page import="com.cleopatra.json.JSONObject" %>
<%@ page import="java.util.Iterator" %>

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Oz Report</title>

<script type='text/javascript' src="/oz/ozhviewer/jquery-2.0.3.min.js"></script>
<script type='text/javascript' src="/oz/ozhviewer/jquery-ui.min.js"></script>
<script type='text/javascript' src='/oz/ozhviewer/jquery.dynatree.js'></script>
<script type='text/javascript' src='/oz/ozhviewer/OZJSViewer.js'></script>

<link rel="stylesheet" type="text/css" href="/oz/ozhviewer/jquery-ui.css">
<link rel="stylesheet" type="text/css"href="/oz/ozhviewer/ui.dynatree.css">
<style>
/* for HTML5 */
html, body {
	margin: 0px;
	padding: 0px;
	height: 100%;
	width : 99%;
}
</style>
</head>

<%
    String jsonData = request.getParameter("params");
		
    if (jsonData != null) {
     	// JSON 문자열을 Java 객체로 변환
        JSONObject jsonObject = new JSONObject(jsonData);

        Iterator<String> keys = jsonObject.keys();
                
        out.println("<script>");
        out.println("var params = {};"); // JavaScript 객체 초기화
        
        while (keys.hasNext()) {
            String key = keys.next();
            String value = jsonObject.getString(key);
            out.println("params['" + key + "'] = '" + value + "';"); // key-value를 JavaScript 객체에 추가
        }
        
        out.println("</script>");
    }
%>
<script>
	
	var ozFilePath;

	function SetOZParamters_ozreport() {
		
			var odiname = "<%= request.getParameter("odiname") %>";
			
			var oz = document.getElementById('ozreport');		
			oz.sendToActionScript("connection.servlet", "/oz/server"); // 서버URL 세팅 (web.xml)
			oz.sendToActionScript("connection.reportname", ozFilePath); // OZ Report Design 세팅
			oz.sendToActionScript("odi.odinames", odiname); // OZ Query Design 을 세팅.
			oz.sendToActionScript("information.debug", "true");

			// 파라미터 전달			
			var paramCnt = 0;
			
			Object.keys(params).forEach(
			function(each, idx) {
				paramCnt = idx + 1;
				oz.sendToActionScript("connection.args" + paramCnt,
						each + "=" + params[each]);
			});
			
			oz.sendToActionScript("connection.pcount", paramCnt);
			oz.sendToActionScript("connection.clientdmtype", "Memory");
			oz.sendToActionScript("connection.serverdmtype", "Memory");
			oz.sendToActionScript("connection.fetchtype", "Concurrent");

			/*
			 * return 값으로 넘겨받은 파라메터의 수만큼 args1~...형태로 데이터를 입력
			 * ex) oz.sendToActionScript( "odi.CMN_CODE.args1" , "CD=CMN001.0010" );
			 */
			//		var pcount = 0;
			//		Object.keys(params).forEach(
			//			function(args, index) {
			//				pcount = idx+1;
			//				oz.sendToActionScript("odi." + odiname + ".args" + pcount, args + "=" + params[args]);
			//		});
			// 파라메터의 갯수를 입력.
			//		console.log("odi." + odiname + ".pcount", pcount);
			//		oz.sendToActionScript("odi." + odiname + ".pcount", pcount);
			//		
			//		// 기타 변수.
			//		oz.sendToActionScript("odi." + odiname + ".clientdmtype", "Memory");
			//		oz.sendToActionScript("odi." + odiname + ".serverdmtype", "Memory");
			//		oz.sendToActionScript("odi." + odiname + ".fetchtype", "Concurrent");
			
			oz.sendToActionScript("viewer.zoom", "<%= request.getParameter("zoom") %>");
			
			// 기타 옵션 설정
			/* oz.sendToActionScript("viewer.bgimage", _ownerApp
					.getAppProperty('bgimage'));
			oz.sendToActionScript("viewer.movepage", _ownerApp
					.getAppProperty('movepage'));
			oz.sendToActionScript("viewer.showtree", _ownerApp
					.getAppProperty('showtree'));
			oz.sendToActionScript("viewer.usestatusbar", _ownerApp
					.getAppProperty('usestatusbar'));
			
			oz.sendToActionScript("viewer.viewmode", _ownerApp
					.getAppProperty('viewmode'));
			oz.sendToActionScript("viewer.treeviewtitle", _ownerApp
					.getAppProperty('treeviewtitle'));
			oz.sendToActionScript("viewer.treeviewsize", _ownerApp
					.getAppProperty('treeviewsize')); */
		
	}

	function startReport() {
		
		var filePath =  "<%= request.getParameter("filePath") %>";		
		ozFilePath = filePath;

		// 레포트 실행
		start_ozjs("ozreport", "/oz/ozhviewer/");
		
	}
</script>
</head>
<body onload="javascript:startReport();">
	<div id='ozreport' style="width:100%;height:100%;overflow:hidden"/>
</body>
</html>