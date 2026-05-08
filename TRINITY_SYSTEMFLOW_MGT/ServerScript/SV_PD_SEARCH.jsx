/**************************************
 * SERVER - SCRIPT
 * 운영모드 검색 조회
 **************************************/

var req = Matrix.getRequest();
var res = Matrix.getResponse();

var keyword = req.getParam("SEARCH_KEYWORD") || "";
	keyword = keyword.trim();

var web  = Matrix.getHttpConnector();
var con  = Matrix.getConnection();
var stmt = null;
var FLOW_API_BASE_URL = "https://flow-api.example.com";

try {

    /**************************************
     * 운영 플로우 API 호출
     **************************************/
    web.UseAudAuthority(true);

    var url = FLOW_API_BASE_URL + "/api/v1/flows/system_flows";
    var headers = [
        "Content-Type=application/json",
        "Accept=application/json"
    ];

    var responseText = web.SendRequest(url, "GET", "", headers);
    if (!responseText) {
        Matrix.ThrowException("Flow API 응답 없음");
    }

    var apiList = JSON.parse(responseText);

    /**************************************
     * REPORT_CODE 목록 생성
     **************************************/
    var reportCodes = [];
    for (var i = 0; i < apiList.length; i++) {
        if (apiList[i].name) {
            reportCodes.push(apiList[i].name);
        }
    }

    /**************************************
     * 운영 플로우 없을 경우
     **************************************/
    if (reportCodes.length === 0) {
        res.getDataSet([]);
    } else {

        /**************************************
         * SQL 생성
         **************************************/
        var placeholders = [];
        for (var i = 0; i < reportCodes.length; i++) {
            placeholders.push("?");
        }

        var sql =
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
            "  WHERE R.REPORT_CODE IN (" + placeholders.join(",") + ") ";

        if (keyword !== "") {
            sql += " AND ( R.REPORT_CODE LIKE ? OR R.REPORT_NAME LIKE ? ) ";
        }

        con.Connect("MTXRPTY");
        stmt = con.PreparedStatement(sql);

        var idx = 1;

        for (var i = 0; i < reportCodes.length; i++) {
            stmt.setString(idx++, reportCodes[i]);
        }

        if (keyword !== "") {
            stmt.setString(idx++, "%" + keyword + "%");
            stmt.setString(idx++, "%" + keyword + "%");
        }

        var table = stmt.executeQuery();

        var rows = [];
        for (var i = 0; i < table.getRowCount(); i++) {
            var row = table.getRow(i);
            rows.push({
                REPORT_CODE : row.getString("REPORT_CODE"),
                REPORT_NAME : row.getString("REPORT_NAME"),
                REPORT_DESC : row.getString("REPORT_DESC"),
                OWNER_CODE  : row.getString("OWNER_CODE"),
                CREATE_DATE : row.getString("CREATE_DATE"),
                MODIFY_DATE : row.getString("MODIFY_DATE"),
                MODIFY_CODE : row.getString("MODIFY_CODE"),
                FOLDER_NAME : row.getString("FOLDER_NAME")
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
