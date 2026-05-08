/**************************************
 * SERVER - SCRIPT
 * 개발 → 운영 이관
 **************************************/
var req = Matrix.getRequest();
var res = Matrix.getResponse();
var web = Matrix.getHttpConnector();
var FLOW_API_BASE_URL = "https://flow-api.example.com";

/* 파라미터 */
var listStr = req.getParam("REPORT_LIST");
if (!listStr) Matrix.ThrowException("REPORT_LIST 없음");

var list = JSON.parse(listStr);
if (!list.length) Matrix.ThrowException("이관 대상 없음");

var flow_name = list[0].flow_name || list[0].report_code;
var endpointName = list[0].endpoint_name;

Matrix.WriteLog("endpoint_name:",endpointName)

if (!flow_name) {
    Matrix.ThrowException("flow name 없음");
}

if (!endpointName) {
    Matrix.ThrowException("endpoint_name 없음");
}

/* Flow API 호출 */
var url = FLOW_API_BASE_URL + "/api/v1/flows/"
        + flow_name
        + "/mode";

var payload = {
    mode: "system",
    endpoint_name: endpointName
};

web.UseAudAuthority(true);

var responseText = web.SendRequest(
    url,
    "POST",
    JSON.stringify(payload),
    ["Content-Type=application/json"]
);

if (!responseText) {
    Matrix.ThrowException("Flow API 응답 없음");
}


/*응답 그대로 반환 */
res.WriteResponseText(responseText);
