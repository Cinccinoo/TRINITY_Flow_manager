/**
 * Mock Matrix 객체
 * 로컬 개발환경에서 실제 Matrix 서버 없이 UI를 테스트하기 위한 모의 객체
 */

// ── Mock 데이터 ──

const MOCK_DEV = [
  { REPORT_CODE: "REPB114B1227", REPORT_NAME: "ONTOLOGY_GENERATOR 222323", REPORT_DESC: "온톨로지 생성 Flow", FOLDER_NAME: "System Template", OWNER_CODE: "matrix", CREATE_DATE: "2026-02-05", MODIFY_CODE: "matrix", MODIFY_DATE: "2026-02-10" },
  { REPORT_CODE: "REP28E23C3CD", REPORT_NAME: "ONTOLOGY_GENERATOR 222", REPORT_DESC: "온톨로지 생성 Flow v2", FOLDER_NAME: "System Template", OWNER_CODE: "matrix", CREATE_DATE: "2026-02-03", MODIFY_CODE: "matrix", MODIFY_DATE: "2026-02-08" },
  { REPORT_CODE: "REP9A0F21B88", REPORT_NAME: "ONTOLOGY_GENERATOR", REPORT_DESC: "온톨로지 생성 Flow 원본", FOLDER_NAME: "System Template", OWNER_CODE: "hanhyein", CREATE_DATE: "2025-11-01", MODIFY_CODE: "hanhyein", MODIFY_DATE: "2025-12-20" },
  { REPORT_CODE: "REPFF3201AC0", REPORT_NAME: "DATA_PIPELINE_TEST", REPORT_DESC: "데이터 파이프라인 테스트", FOLDER_NAME: "G-MATRIX", OWNER_CODE: "dev01", CREATE_DATE: "2026-01-15", MODIFY_CODE: "dev01", MODIFY_DATE: "2026-01-28" },
  { REPORT_CODE: "REP44BC87210", REPORT_NAME: "REPORT_BUILDER_V3", REPORT_DESC: "리포트 빌더 v3 개발", FOLDER_NAME: "테스트", OWNER_CODE: "matrix", CREATE_DATE: "2026-01-20", MODIFY_CODE: "matrix", MODIFY_DATE: "2026-02-01" },
  { REPORT_CODE: "REP55DD11230", REPORT_NAME: "CHATBOT_FLOW_MAIN", REPORT_DESC: "챗봇 메인 플로우", FOLDER_NAME: "G-MATRIX", OWNER_CODE: "dev02", CREATE_DATE: "2026-01-10", MODIFY_CODE: "dev02", MODIFY_DATE: "2026-01-18" },
  { REPORT_CODE: "REP66EE22341", REPORT_NAME: "DASHBOARD_KPI_V2", REPORT_DESC: "KPI 대시보드 v2", FOLDER_NAME: "System Template", OWNER_CODE: "matrix", CREATE_DATE: "2026-01-08", MODIFY_CODE: "matrix", MODIFY_DATE: "2026-01-22" },
  { REPORT_CODE: "REP77FF33452", REPORT_NAME: "USER_ANALYTICS", REPORT_DESC: "사용자 분석 리포트", FOLDER_NAME: "테스트", OWNER_CODE: "hanhyein", CREATE_DATE: "2025-12-20", MODIFY_CODE: "hanhyein", MODIFY_DATE: "2026-01-05" },
  { REPORT_CODE: "REP88AA44563", REPORT_NAME: "BATCH_SCHEDULER_V1", REPORT_DESC: "배치 스케줄러 플로우", FOLDER_NAME: "G-MATRIX", OWNER_CODE: "dev01", CREATE_DATE: "2025-12-15", MODIFY_CODE: "dev01", MODIFY_DATE: "2025-12-28" },
  { REPORT_CODE: "REP99BB55674", REPORT_NAME: "ETL_TRANSFORM_PIPE", REPORT_DESC: "ETL 변환 파이프라인", FOLDER_NAME: "System Template", OWNER_CODE: "matrix", CREATE_DATE: "2025-12-10", MODIFY_CODE: "matrix", MODIFY_DATE: "2025-12-25" },
  { REPORT_CODE: "REPAACC66785", REPORT_NAME: "ALERT_NOTIFICATION", REPORT_DESC: "알림 발송 플로우", FOLDER_NAME: "테스트", OWNER_CODE: "dev02", CREATE_DATE: "2025-12-05", MODIFY_CODE: "dev02", MODIFY_DATE: "2025-12-18" },
  { REPORT_CODE: "REPBBDD77896", REPORT_NAME: "DATA_SYNC_WORKER", REPORT_DESC: "데이터 동기화 워커", FOLDER_NAME: "G-MATRIX", OWNER_CODE: "hanhyein", CREATE_DATE: "2025-11-28", MODIFY_CODE: "hanhyein", MODIFY_DATE: "2025-12-10" },
  { REPORT_CODE: "REPCCEE88907", REPORT_NAME: "REPORT_EXPORT_PDF", REPORT_DESC: "PDF 리포트 내보내기", FOLDER_NAME: "System Template", OWNER_CODE: "matrix", CREATE_DATE: "2025-11-20", MODIFY_CODE: "matrix", MODIFY_DATE: "2025-12-01" },
];

const MOCK_PROD = [
  { REPORT_CODE: "REP28E23C3CD", REPORT_NAME: "ONTOLOGY_GENERATOR 222", REPORT_DESC: "온톨로지 생성 Flow v2", FOLDER_NAME: "System Template", OWNER_CODE: "matrix", CREATE_DATE: "2026-02-03", MODIFY_CODE: "matrix", MODIFY_DATE: "2026-02-08", ENDPOINT_NAME: "onto-gen-v2" },
  { REPORT_CODE: "REPA345C32C0", REPORT_NAME: "OUTPUT 테스트", REPORT_DESC: "출력 테스트용 플로우", FOLDER_NAME: "G-MATRIX", OWNER_CODE: "matrix", CREATE_DATE: "2026-01-15", MODIFY_CODE: "matrix", MODIFY_DATE: "2026-01-20", ENDPOINT_NAME: "output-test" },
  { REPORT_CODE: "REPB114B1227", REPORT_NAME: "ONTOLOGY_GENERATOR 222323", REPORT_DESC: "온톨로지 생성 Flow", FOLDER_NAME: "System Template", OWNER_CODE: "matrix", CREATE_DATE: "2026-02-05", MODIFY_CODE: "matrix", MODIFY_DATE: "2026-02-10", ENDPOINT_NAME: "onto-gen-full" },
  { REPORT_CODE: "REPDD1199018", REPORT_NAME: "SALES_DASHBOARD", REPORT_DESC: "매출 대시보드", FOLDER_NAME: "System Template", OWNER_CODE: "dev01", CREATE_DATE: "2025-12-01", MODIFY_CODE: "dev01", MODIFY_DATE: "2025-12-15", ENDPOINT_NAME: "sales-dash" },
  { REPORT_CODE: "REPEE22AA129", REPORT_NAME: "INVENTORY_CHECK", REPORT_DESC: "재고 확인 플로우", FOLDER_NAME: "G-MATRIX", OWNER_CODE: "dev02", CREATE_DATE: "2025-11-25", MODIFY_CODE: "dev02", MODIFY_DATE: "2025-12-05", ENDPOINT_NAME: "inv-check" },
  { REPORT_CODE: "REPFF33BB230", REPORT_NAME: "HR_ATTENDANCE", REPORT_DESC: "근태 관리 플로우", FOLDER_NAME: "테스트", OWNER_CODE: "matrix", CREATE_DATE: "2025-11-15", MODIFY_CODE: "matrix", MODIFY_DATE: "2025-11-28", ENDPOINT_NAME: "hr-attend" },
  { REPORT_CODE: "REP0044CC341", REPORT_NAME: "CUSTOMER_REPORT", REPORT_DESC: "고객 현황 리포트", FOLDER_NAME: "System Template", OWNER_CODE: "hanhyein", CREATE_DATE: "2025-11-10", MODIFY_CODE: "hanhyein", MODIFY_DATE: "2025-11-22", ENDPOINT_NAME: "cust-report" },
  { REPORT_CODE: "REP1155DD452", REPORT_NAME: "EMAIL_CAMPAIGN_V2", REPORT_DESC: "이메일 캠페인 v2", FOLDER_NAME: "G-MATRIX", OWNER_CODE: "dev01", CREATE_DATE: "2025-10-28", MODIFY_CODE: "dev01", MODIFY_DATE: "2025-11-10", ENDPOINT_NAME: "email-camp" },
  { REPORT_CODE: "REP2266EE563", REPORT_NAME: "LOG_AGGREGATOR", REPORT_DESC: "로그 수집 플로우", FOLDER_NAME: "테스트", OWNER_CODE: "dev02", CREATE_DATE: "2025-10-20", MODIFY_CODE: "dev02", MODIFY_DATE: "2025-11-01", ENDPOINT_NAME: "log-agg" },
  { REPORT_CODE: "REP3377FF674", REPORT_NAME: "PAYMENT_GATEWAY", REPORT_DESC: "결제 게이트웨이", FOLDER_NAME: "System Template", OWNER_CODE: "matrix", CREATE_DATE: "2025-10-15", MODIFY_CODE: "matrix", MODIFY_DATE: "2025-10-28", ENDPOINT_NAME: "pay-gw" },
  { REPORT_CODE: "REP4488AA785", REPORT_NAME: "NOTIFICATION_HUB", REPORT_DESC: "알림 허브 플로우", FOLDER_NAME: "G-MATRIX", OWNER_CODE: "hanhyein", CREATE_DATE: "2025-10-10", MODIFY_CODE: "hanhyein", MODIFY_DATE: "2025-10-22", ENDPOINT_NAME: "noti-hub" },
  { REPORT_CODE: "REP5599BB896", REPORT_NAME: "AUTH_SERVICE_FLOW", REPORT_DESC: "인증 서비스 플로우", FOLDER_NAME: "테스트", OWNER_CODE: "dev01", CREATE_DATE: "2025-10-05", MODIFY_CODE: "dev01", MODIFY_DATE: "2025-10-18", ENDPOINT_NAME: "auth-svc" },
];

const MOCK_FOLDER_TREE = [
  { PARENT_CODE: null, CHILD_CODE: "ROOT", CHILD_NAME: "운영 리포트", IMAGE_NAME: "SHELL_FOLDER.png", ON_IMAGE_NAME: "SHELL_FOLDER_ON.png", NODE_TYPE: "ROOT" },
  { PARENT_CODE: "ROOT", CHILD_CODE: "DEFAULT", CHILD_NAME: "System Template", IMAGE_NAME: "SHELL_FOLDER.png", ON_IMAGE_NAME: "SHELL_FOLDER_ON.png", NODE_TYPE: "FOLDER" },
  { PARENT_CODE: "ROOT", CHILD_CODE: "G_MATRIX", CHILD_NAME: "G-MATRIX", IMAGE_NAME: "SHELL_FOLDER.png", ON_IMAGE_NAME: "SHELL_FOLDER_ON.png", NODE_TYPE: "FOLDER" },
  { PARENT_CODE: "ROOT", CHILD_CODE: "TEST", CHILD_NAME: "테스트", IMAGE_NAME: "SHELL_FOLDER.png", ON_IMAGE_NAME: "SHELL_FOLDER_ON.png", NODE_TYPE: "FOLDER" },
];

// ── 내부 상태 ──
const globalParams: Record<string, string> = {};
const usedEndpoints: string[] = MOCK_PROD.map(p => p.ENDPOINT_NAME);

// ── Mock Matrix 객체 ──
export function installMockMatrix() {
  (window as any).Matrix = {
    getObject(id: string) {
      if (id === 'Tree') {
        return {
          OnDataBindEnd: null as any,
          OnNodeDbClick: null as any,
          ExpandToLevel(_level: number) { /* noop */ },
        };
      }
      return null;
    },

    AddGlobalParams(key: string, value: string, _flag: number) {
      globalParams[key] = value;
    },

    SetGlobalParams(key: string, value: string) {
      globalParams[key] = value;
    },

    Alert(msg: string) {
      alert(msg);
    },

    doRefresh(_id: string) { /* noop */ },

    RunScript(_target: string, scriptName: string, callback: (result: any) => void) {
      // 서버 응답 시뮬레이션 (300ms 딜레이)
      setTimeout(() => {
        switch (scriptName) {
          case 'SV_DV_LIST': {
            const folder = globalParams['VS_FOLDER_CODE'] || '';
            const keyword = (globalParams['VS_GLO_META_FILTER'] || '').toLowerCase();
            let result = [...MOCK_DEV];
            if (folder) {
              result = result.filter(r => r.FOLDER_NAME === folder);
            }
            if (keyword) {
              result = result.filter(r =>
                r.REPORT_NAME.toLowerCase().includes(keyword) ||
                r.REPORT_CODE.toLowerCase().includes(keyword)
              );
            }
            callback({ Success: true, DataSet: result });
            break;
          }

          case 'SV_PD_LIST': {
            callback({ Success: true, DataSet: [...MOCK_PROD] });
            break;
          }

          case 'SV_PD_SEARCH': {
            const kw = (globalParams['SEARCH_KEYWORD'] || '').toLowerCase();
            const filtered = MOCK_PROD.filter(r =>
              r.REPORT_NAME.toLowerCase().includes(kw) ||
              r.REPORT_CODE.toLowerCase().includes(kw)
            );
            callback({ Success: true, DataSet: filtered });
            break;
          }

          case 'ENDPOINT_CHECK': {
            const epName = globalParams['VS_ENDPOINT_NAME'] || '';
            if (usedEndpoints.includes(epName)) {
              callback({ Success: false, Message: '이미 사용 중인 Endpoint 이름입니다.' });
            } else {
              callback({ Success: true, Message: '사용 가능한 Endpoint 이름입니다.' });
            }
            break;
          }

          case 'SV_DV_TO_PD': {
            try {
              const list = JSON.parse(globalParams['REPORT_LIST'] || '[]');
              if (list.length > 0) {
                const item = list[0];
                const devItem = MOCK_DEV.find(d => d.REPORT_CODE === item.report_code);
                if (devItem) {
                  MOCK_PROD.push({ ...devItem, ENDPOINT_NAME: item.endpoint_name });
                  usedEndpoints.push(item.endpoint_name);
                }
              }
            } catch { /* ignore */ }
            callback({ Success: true });
            break;
          }

          case 'SV_PD_TO_DV': {
            try {
              const list = JSON.parse(globalParams['REPORT_LIST'] || '[]');
              if (list.length > 0) {
                const flowId = list[0].flow_id;
                const idx = MOCK_PROD.findIndex(p => p.REPORT_CODE === flowId);
                if (idx >= 0) {
                  const removed = MOCK_PROD.splice(idx, 1)[0];
                  const epIdx = usedEndpoints.indexOf(removed.ENDPOINT_NAME);
                  if (epIdx >= 0) usedEndpoints.splice(epIdx, 1);
                }
              }
            } catch { /* ignore */ }
            callback({ Success: true });
            break;
          }

          default:
            callback({ Success: false, Message: `Unknown script: ${scriptName}` });
        }
      }, 300);
    },
  };

  // Tree 자동 바인딩 시뮬레이션 (500ms 후)
  setTimeout(() => {
    const tree = (window as any).Matrix.getObject('Tree');
    if (tree && tree.OnDataBindEnd) {
      tree.OnDataBindEnd();
    }
  }, 500);

  // ── fetch 인터셉터: executeServerScript 호출을 로컬에서도 처리 ──
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // 서버스크립트 호출 → 실제 12.17 서버로 전달 (Vite 프록시 경유)
    // mock 비활성화: 실제 DB 쿼리 테스트를 위해 프록시로 통과시킴

    return originalFetch.call(window, input, init);
  };
}
