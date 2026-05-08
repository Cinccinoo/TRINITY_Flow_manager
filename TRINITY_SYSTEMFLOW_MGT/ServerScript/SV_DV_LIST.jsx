/**************************************
 * SERVER - SCRIPT
 * 개발모드 목록 조회 (DB only)
 **************************************/

var req  = Matrix.getRequest();
var res  = Matrix.getResponse();
var con  = Matrix.getConnection();
var stmt = null;

try {
    var folderCode = req.getParam("VS_FOLDER_CODE") || "";
    var keyword    = req.getParam("VS_GLO_META_FILTER") || "";
    keyword = keyword.trim();

    /**************************************
     * SQL 생성
     **************************************/
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
        "  WHERE 1 = 1 ";

    var params = [];

    // 폴더 필터
    if (folderCode !== "") {
        sql += " AND R.FOLDER_CODE = ? ";
        params.push(folderCode);
    }

    // 키워드 검색 필터
    if (keyword !== "") {
        sql += " AND ( R.REPORT_CODE LIKE ? OR R.REPORT_NAME LIKE ? ) ";
        params.push("%" + keyword + "%");
        params.push("%" + keyword + "%");
    }

    sql += " ORDER BY R.MODIFY_DATE DESC ";

    /**************************************
     * DB 실행
     **************************************/
    con.Connect("MTXRPTY");
    stmt = con.PreparedStatement(sql);

    for (var i = 0; i < params.length; i++) {
        stmt.setString(i + 1, params[i]);
    }

    var table = stmt.executeQuery();

    /**************************************
     * JSON 생성
     **************************************/
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

} catch (e) {
    Matrix.ThrowException(e.message);
} finally {
    if (stmt) stmt.close();
    if (con)  con.DisConnect();
}
