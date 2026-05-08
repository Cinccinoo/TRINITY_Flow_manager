/**************************************
 * SERVER - SCRIPT
 * 운영모드 목록 조회 (API + DB 매핑)
 **************************************/

var req = Matrix.getRequest();
var keyword = req.getParam("SEARCH_KEYWORD") || "";
var res = Matrix.getResponse();

var web  = Matrix.getHttpConnector();
var con  = Matrix.getConnection();
var stmt = null;
var FLOW_API_BASE_URL = "https://flow-api.example.com";

try {
	 
    /**************************************
     *  운영 플로우 API 호출
     **************************************/
    web.UseAudAuthority(true);

    var url = FLOW_API_BASE_URL + "/api/v1/flows/system_flows";
    var headers = [
        "Content-Type=application/json",
        "Accept=application/json"
    ];

    var responseText = web.SendRequest(url, "GET", "", headers);
    var apiList = JSON.parse(responseText);
	var endpointMap = {};

	for (var i = 0; i < apiList.length; i++) {
		endpointMap[apiList[i].name] = apiList[i].endpoint_name || "";
	}


    /**************************************
     *  REPORT_CODE 목록 생성
     **************************************/
    var reportCodes = [];

    for (var i = 0; i < apiList.length; i++) {
        reportCodes.push(apiList[i].name);
    }


    /**************************************
     * reportCodes 0건 / 1건 / 여러 건 분기
     **************************************/
    if (reportCodes.length === 0) {

        // ✅ 운영 플로우가 없으면 빈 배열 반환
        res.WriteResponseText("[]");

    } else {

        var sql = "";
        var isSingle = (reportCodes.length === 1);

        if (isSingle) {

            // 👉 REPORT_CODE 1건
            sql =
                " SELECT R.REPORT_CODE, " +
                "        R.REPORT_NAME, " +
                "        R.REPORT_DESC, " +
                "        R.OWNER_CODE, " +
                "        R.CREATE_DATE, " +
                "        R.MODIFY_DATE, " +
                "        R.MODIFY_CODE, " +
                "        F.FOLDER_NAME " +
                "   FROM MTX_REPORT R " +
                "   LEFT JOIN MTX_FOLDER F " +
                "     ON R.FOLDER_CODE = F.FOLDER_CODE " +
                "  WHERE R.REPORT_CODE = ?";

        } else {

            // 👉 REPORT_CODE 여러 건
            var placeholders = [];
            for (var i = 0; i < reportCodes.length; i++) {
                placeholders.push("?");
            }

            sql =
                " SELECT R.REPORT_CODE, " +
                "        R.REPORT_NAME, " +
                "        R.REPORT_DESC, " +
                "        R.OWNER_CODE, " +
                "        R.CREATE_DATE, " +
                "        R.MODIFY_DATE, " +
                "        R.MODIFY_CODE, " +
                "        F.FOLDER_NAME " +
                "   FROM MTX_REPORT R " +
                "   LEFT JOIN MTX_FOLDER F " +
                "     ON R.FOLDER_CODE = F.FOLDER_CODE " +
                "  WHERE R.REPORT_CODE IN (" + placeholders.join(",") + ")";
        }

        /**************************************
         *  DB 실행
         **************************************/
        con.Connect("MTXRPTY");
        stmt = con.PreparedStatement(sql);

        if (isSingle) {
            stmt.setString(1, reportCodes[0]);
        } else {
            for (var i = 0; i < reportCodes.length; i++) {
                stmt.setString(i + 1, reportCodes[i]);
            }
        }


        var table = stmt.executeQuery();
        Matrix.WriteLog("***** DB row count = " + table.getRowCount());

        /**************************************
         * 테스트용 JSON 생성
         **************************************/
        var rows = [];

        for (var i = 0; i < table.getRowCount(); i++) {

		var row = table.getRow(i);
	
		rows.push({
			REPORT_NAME  : row.getString("REPORT_NAME"),
			REPORT_CODE  : row.getString("REPORT_CODE"),
			REPORT_DESC  : row.getString("REPORT_DESC"),
			OWNER_CODE   : row.getString("OWNER_CODE"),
			CREATE_DATE  : row.getString("CREATE_DATE"),
			MODIFY_DATE  : row.getString("MODIFY_DATE"),
			MODIFY_CODE  : row.getString("MODIFY_CODE"),
			FOLDER_NAME  : row.getString("FOLDER_NAME"),
			ENDPOINT_NAME: endpointMap[row.getString("REPORT_CODE")] || ""
		});
	}

        res.WriteResponseText(JSON.stringify(rows));
    }

} catch (e) {
    Matrix.ThrowException(e.message);
} finally {
    if (stmt) stmt.close();
    if (con) con.DisConnect();
}
