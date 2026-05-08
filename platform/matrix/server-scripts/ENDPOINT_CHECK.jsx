/**************************************
 * SERVER SCRIPT
 * Endpoint Name 중복 체크 (VS 파라미터 방식)
 **************************************/
var req = Matrix.getRequest();
var res = Matrix.getResponse();
var web = Matrix.getHttpConnector();
var FLOW_API_BASE_URL = "https://flow-api.example.com";

try {

    // ✅ 글로벌 파라미터로 받음
    var endpointName = req.getParam("VS_ENDPOINT_NAME");

    if (!endpointName) {
        Matrix.ThrowException("VS_ENDPOINT_NAME이 없습니다.");
    }

    // 🔹 Flow API 호출
    var url = FLOW_API_BASE_URL + "/api/v1/flows/endpoint?name="
        + encodeURIComponent(endpointName);

    var headers = [
        "Content-Type=application/json",
        "Accept=application/json"
    ];

    web.UseAudAuthority(true);

    var responseText = web.SendRequest(
        url,
        "GET",
        "",
        headers
    );

    if (!responseText) {
        Matrix.ThrowException("Endpoint 중복 체크 API 호출 실패");
    }

    var data = JSON.parse(responseText);
	
	Matrix.WriteLog("data =",data)

    // 🔹 중복 → 실패 (예외)
    if (data.result === true) {
        Matrix.ThrowException(
            "이미 사용 중인 Endpoint 이름입니다.\n(" + endpointName + ")"
        );
    }

    // 🔹 중복 아님 → 성공 JSON 반환
    res.WriteResponseText(JSON.stringify({
        success : true,
        message : "사용 가능한 Endpoint 이름입니다."
    }));
	
	Matrix.WriteLog("*****************1")

} catch (e) {
    Matrix.ThrowException(e.message || e);
}
