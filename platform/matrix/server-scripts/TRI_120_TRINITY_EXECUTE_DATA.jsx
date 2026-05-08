/** ************************************
 * SERVER - SCRIPT
 * TRINITY_EXECUTE_DATA (TRI_120)
 ************************************ **/
var req = Matrix.getRequest();      /* request */
var res = Matrix.getResponse();     /* response */
var session  = Matrix.getSession(); /* session */
var util = Matrix.getUtility();     /* utility */

var con = Matrix.getConnection();   /* DataBase Connector */

var sql;
var stmt;
var table;

var userCode = session.getAttribute("USER_CODE");
var deptCode = session.getAttribute("DeptCode");
var deptCodes = deptCode ? deptCode.split(",") : [];

if (deptCodes.length === 0) deptCodes = [deptCode || ""];

var deptCodePlaceholders = "";

for (var i = 0; i < deptCodes.length; i++) {
    if (i > 0) deptCodePlaceholders += ",";
    deptCodePlaceholders += "?";
}

var sql_list = {

    "get_all_flow":
        " SELECT " +
        "   T1.REPORT_CODE, " +
        "   T1.REPORT_NAME, " +
        "   T1.REPORT_DESC, " +
        "   T1.FOLDER_CODE, " +
        "   T2.FOLDER_NAME, " +
        "   T1.OWNER_CODE, " +
        "   TO_CHAR(T1.CREATE_DATE,'YYYY-MM-DD') AS CREATE_DATE, " +
        "   T1.MODIFY_CODE, " +
        "   TO_CHAR(T1.MODIFY_DATE,'YYYY-MM-DD') AS MODIFY_DATE " +
        " FROM " +
        "   MTX_REPORT T1 " +
        "   LEFT OUTER JOIN MTX_FOLDER T2 ON " +
        "       T1.FOLDER_CODE = T2.FOLDER_CODE " +
        " WHERE " +
        "   T1.MODULE_CODE = 'AF' " +
        " ORDER BY T1.MODIFY_DATE DESC ",

    "get_auth_flows":
        " SELECT  T1.REPORT_CODE " +
        " , T1.REPORT_NAME " +
        " FROM MTX_REPORT T1 " +
        " INNER JOIN ( " +
        "   SELECT AUTH.AUTH_OBJECT_CODE " +
        "   FROM ( " +
        "       SELECT AUTH_OBJECT_CODE " +
        "       FROM MTX_AUTHORITY " +
        "       WHERE SUBJECT_CODE = 'G0' " +
        "       AND AUTH_SUBJECT_CODE IN ( " +
        "           SELECT A.GROUP_CODE " +
        "           FROM MTX_GROUP A " +
        "           INNER JOIN MTX_GROUP_LINK B " +
        "               ON A.GROUP_CODE = B.GROUP_CODE " +
        "              AND B.USER_CODE = ? " +
        "       ) " +
        "       AND AUTHORITY_NO IN (1, 3, 5, 7) " +
        "       UNION ALL " +
        "       SELECT AUTH_OBJECT_CODE " +
        "       FROM MTX_AUTHORITY " +
        "       WHERE SUBJECT_CODE = 'U0' " +
        "       AND AUTHORITY_NO IN (1, 3, 5, 7) " +
        "       AND AUTH_SUBJECT_CODE = ? " +
        "       UNION ALL " +
        "       SELECT AUTH_OBJECT_CODE " +
        "       FROM MTX_AUTHORITY " +
        "       WHERE SUBJECT_CODE = 'O0' " +
        "       AND AUTH_SUBJECT_CODE IN (" + deptCodePlaceholders + ") " +
        "       AND AUTHORITY_NO IN (1, 3, 5, 7) " +
        "   ) AUTH " +
        "   GROUP BY AUTH.AUTH_OBJECT_CODE " +
        " ) V_AUTH " +
        "   ON T1.REPORT_CODE = V_AUTH.AUTH_OBJECT_CODE " +
        " WHERE T1.MODULE_CODE = 'AF' ",

    "get_portal_option":
        " SELECT OP_CODE," +
        " OP_VALUE " +
        " FROM " +
        "   MTX_PORTAL_OPTION ",

    "folder_tree":
        " SELECT * FROM (" +
        "   SELECT NULL AS PARENT_CODE, 'ROOT' AS CHILD_CODE, 'AF 리포트' AS CHILD_NAME," +
        "   'SHELL_FOLDER.png' AS IMAGE_NAME, 'SHELL_FOLDER_ON.png' AS ON_IMAGE_NAME, 'ROOT' AS NODE_TYPE" +
        "   FROM DUAL" +
        "   UNION ALL" +
        "   SELECT DISTINCT" +
        "   CASE WHEN F.PARENT_FOLDER_CODE IS NULL OR F.FOLDER_CODE = 'DEFAULT' THEN 'ROOT' ELSE F.PARENT_FOLDER_CODE END AS PARENT_CODE," +
        "   F.FOLDER_CODE AS CHILD_CODE, F.FOLDER_NAME AS CHILD_NAME," +
        "   'SHELL_FOLDER.png' AS IMAGE_NAME, 'SHELL_FOLDER_ON.png' AS ON_IMAGE_NAME, 'FOLDER' AS NODE_TYPE" +
        "   FROM MTX_FOLDER F" +
        "   WHERE F.FOLDER_CODE IN (" +
        "       SELECT DISTINCT FOLDER_CODE FROM MTX_FOLDER" +
        "       START WITH FOLDER_CODE IN (" +
        "           SELECT DISTINCT R.FOLDER_CODE FROM MTX_REPORT R WHERE R.MODULE_CODE = 'AF'" +
        "       )" +
        "       CONNECT BY PRIOR PARENT_FOLDER_CODE = FOLDER_CODE" +
        "   )" +
        " )",

    "search":
        " SELECT 'trinitylogo.png' AS IMG_NAME," +
        " REPORT_CODE, REPORT_NAME, FOLDER_CODE, MODULE_CODE," +
        " OWNER_CODE, CREATE_DATE, MODIFY_DATE, MODIFY_CODE, REPORT_DESC" +
        " FROM MTX_REPORT" +
        " WHERE MODULE_CODE = 'AF'" +
        " AND FOLDER_CODE IN (" +
        "   SELECT FOLDER_CODE FROM MTX_FOLDER" +
        "   START WITH FOLDER_CODE = ?" +
        "   CONNECT BY PRIOR FOLDER_CODE = PARENT_FOLDER_CODE" +
        " )" +
        " AND (? IS NULL OR ? = '' OR REPORT_NAME LIKE '%' || ? || '%' OR REPORT_DESC LIKE '%' || ? || '%')" +
        " ORDER BY CREATE_DATE DESC"
};

try {

    var code = req.getParam("code");

    if (!code) {
        Matrix.ThrowException("Server Script(TRINITY_EXECUTE_DATA) Error: 'code' parameter is required. Received: [" + code + "]");
    }

    con.Connect("MTXRPTY");

    sql = sql_list[code];

    if (!sql) {
        Matrix.ThrowException("Server Script(TRINITY_EXECUTE_DATA) Error: Unknown code [" + code + "]. Available: " + Object.keys(sql_list).join(", "));
    }

    stmt = con.PreparedStatement(sql);

    setQueryParameter(code, stmt);

    table = stmt.executeQuery();

    stmt.close();
    stmt = null;

    res.getDataSet().AddTable(table, "RESULT_SET");

} catch (e) {

    Matrix.ThrowException("Server Script(TRINITY_EXECUTE_DATA) Error:" + e.message);

} finally {

    if (stmt != null) {
        stmt.Close();
        stmt = null;
    }

    if (con != null) {
        con.DisConnect();
        con = null;
    }
}

function setQueryParameter(code, stmt) {

    if (code == "get_auth_flows") {

        stmt.setString(1, userCode);
        stmt.setString(2, userCode);

        for (var i = 0; i < deptCodes.length; i++) {
            stmt.setString(3 + i, deptCodes[i].trim().replace(/'/g, ""));
        }
    }

    if (code == "search") {

        var folderCode = req.getParam("FOLDER_CODE");
        var keyword = req.getParam("SEARCH_KEYWORD");

        stmt.setString(1, folderCode);
        stmt.setString(2, keyword);
        stmt.setString(3, keyword);
        stmt.setString(4, keyword);
        stmt.setString(5, keyword);
    }
}
