/* ════════════════════════════════════════════
   FlowManager – Types, Constants & Utilities
   ════════════════════════════════════════════ */

// ── Types ──

export interface DevReport {
  REPORT_CODE: string;
  REPORT_NAME: string;
  REPORT_DESC: string;
  FOLDER_NAME: string;
  OWNER_CODE: string;
  CREATE_DATE: string;
  MODIFY_CODE: string;
  MODIFY_DATE: string;
}

export interface ProdReport extends DevReport {
  ENDPOINT_NAME: string;
}

export interface SortState {
  key: string | null;
  dir: 'asc' | 'desc' | null;
}

export type ToastType = 'success' | 'warn' | 'info';

export interface ToastState {
  visible: boolean;
  msg: string;
  type: ToastType;
}

export interface ConfirmState {
  visible: boolean;
  item: ProdReport | null;
}

export interface LoadingState {
  dev: boolean;
  prod: boolean;
  transfer: boolean;
}

export interface FolderTreeRow {
  PARENT_CODE: string | null;
  CHILD_CODE: string;
  CHILD_NAME: string;
  NODE_TYPE: string;
}

export interface FolderNode {
  code: string;
  name: string;
  nodeType: string;
  children: FolderNode[];
}

// ── Constants ──

export const PAGE_SIZE = 10;

// ── Matrix Framework Bridge ──

export interface MatrixGlobal {
  RunScript: (target: string, scriptName: string, callback: (result: any) => void) => void;
  AddGlobalParams: (key: string, value: string, flag: number) => void;
  SetGlobalParams: (key: string, value: string) => void;
  Alert: (msg: string) => void;
  getObject: (id: string) => any;
  doRefresh: (id: string) => void;
}

export function getMatrix(): MatrixGlobal {
  const M = (window as any).Matrix;
  if (!M) throw new Error('Matrix global not available');
  return M as MatrixGlobal;
}

export interface ScriptResult {
  Success?: boolean;
  Message?: string;
  DataSet?: any[];
}

export function runScript(scriptName: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const M = getMatrix();
    M.RunScript('', scriptName, (p: any) => {
      if (!p) {
        reject(new Error(`${scriptName}: 응답 없음`));
        return;
      }
      const result = typeof p === 'string' ? JSON.parse(p) : p;
      resolve(result);
    });
  });
}

export function setParamAndRun(params: Record<string, string>, scriptName: string): Promise<any> {
  const M = getMatrix();
  for (const [key, value] of Object.entries(params)) {
    M.AddGlobalParams(key, value, 1);
  }
  return runScript(scriptName);
}

// ── Backend API (callServerScript.jsp 호출) ──

const SCRIPT_URL = '/matrix/extention/trinity/callServerScript.jsp';

/**
 * Matrix 서버스크립트를 호출한다.
 */
export async function executeServerScript(
  code: string,
  params: Record<string, string> = {}
): Promise<any[]> {
  // URL 쿼리스트링 + JSON body 양쪽에 모든 파라미터 전달
  const allParams: Record<string, string> = { userCode: 'matrix', code, ...params };
  const qs = new URLSearchParams(allParams).toString();
  const url = `${SCRIPT_URL}?${qs}`;
  const payload = { userCode: 'matrix', params: { code, ...params } };

  console.log('[executeServerScript] code:', code, 'url:', url);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('[executeServerScript] 에러:', res.status, errorBody);
    throw new Error(`서버 스크립트 호출 실패: ${res.status}`);
  }

  const data = await res.json();
  console.log('[executeServerScript] retCode:', data.retCode, 'retData 건수:', data.retData?.length);

  if (String(data.retCode) !== '0') {
    throw new Error(`서버 에러: retCode=${data.retCode}`);
  }

  return data.retData || [];
}

/**
 * 검색 쿼리 호출 (code: "search")
 */
export function searchFlows(folderCode: string, keyword: string): Promise<any[]> {
  return executeServerScript('search', {
    FOLDER_CODE: folderCode,
    SEARCH_KEYWORD: keyword,
  });
}

/**
 * 폴더 트리 조회 (code: "folder_tree")
 */
export function getFolderTree(): Promise<any[]> {
  return executeServerScript('folder_tree');
}

/**
 * 전체 플로우 조회 (code: "get_all_flow")
 */
export function getAllFlows(): Promise<any[]> {
  return executeServerScript('get_all_flow');
}

/**
 * 운영 플로우 목록 조회
 */
export async function getProdList(): Promise<any[]> {
  const url = '/flow-api/api/v1/flows/system_flows';

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('[getProdList] 에러 응답:', res.status, errorBody);
    throw new Error(`Flow API 호출 실패: ${res.status}`);
  }

  const data = await res.json();
  console.log('[getProdList] Flow API response:', data);
  const list = Array.isArray(data) ? data : [];

  // Flow API 필드(name, endpoint_name) → ProdReport 필드로 매핑
  return list.map((item: any) => ({
    REPORT_CODE: item.name || '',
    REPORT_NAME: item.name || '',
    ENDPOINT_NAME: item.endpoint_name || '',
    REPORT_DESC: item.description || '',
    FOLDER_NAME: item.folder_name || '',
    OWNER_CODE: item.owner_code || item.user_id || '',
    CREATE_DATE: item.create_date || '',
    MODIFY_CODE: item.modify_code || '',
    MODIFY_DATE: item.modify_date || '',
  }));
}

/**
 * 개발 → 운영 이관 (Flow API 직접 호출)
 */
export async function transferToProd(reportCode: string, endpointName: string): Promise<any> {
  const url = `/flow-api/api/v1/flows/${reportCode}/mode`;

  console.log('[transferToProd] url:', url, 'endpoint:', endpointName);

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'system', endpoint_name: endpointName }),
  });

  const body = await res.text();
  console.log('[transferToProd] status:', res.status, 'body:', body.substring(0, 200));

  // HTML 응답 감지 — Flow API에 없는 플로우면 SPA fallback
  if (body.trimStart().startsWith('<!') || body.trimStart().startsWith('<html')) {
    throw new Error('Flow API에 등록되지 않은 플로우입니다. 먼저 플로우를 등록해주세요.');
  }

  if (!res.ok) {
    try {
      const err = JSON.parse(body);
      throw new Error(err.message || `이관 실패: ${res.status}`);
    } catch (e) {
      if (e instanceof Error && e.message !== `이관 실패: ${res.status}`) throw e;
      throw new Error(`이관 실패: ${res.status}`);
    }
  }

  const result = JSON.parse(body);
  if (result.result === false) {
    throw new Error(result.message || '이관 처리 실패');
  }
  return result;
}

/**
 * 운영 → 개발 이관 (Flow API 직접 호출)
 */
export async function transferToDev(reportCode: string): Promise<any> {
  const url = `/flow-api/api/v1/flows/${reportCode}/mode`;

  console.log('[transferToDev] url:', url);

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'develop' }),
  });

  const body = await res.text();
  console.log('[transferToDev] status:', res.status, 'body:', body.substring(0, 200));

  // HTML 응답 감지 — Flow API에 없는 플로우면 SPA fallback
  if (body.trimStart().startsWith('<!') || body.trimStart().startsWith('<html')) {
    throw new Error('Flow API에 등록되지 않은 플로우입니다.');
  }

  if (!res.ok) {
    try {
      const err = JSON.parse(body);
      throw new Error(err.message || `이관 실패: ${res.status}`);
    } catch (e) {
      if (e instanceof Error && e.message !== `이관 실패: ${res.status}`) throw e;
      throw new Error(`이관 실패: ${res.status}`);
    }
  }

  const result = JSON.parse(body);
  if (result.result === false) {
    throw new Error(result.message || '이관 처리 실패');
  }
  return result;
}

/**
 * flat 폴더 데이터를 트리 구조로 변환
 */
export function buildFolderTree(rows: FolderTreeRow[]): FolderNode[] {
  const nodeMap = new Map<string, FolderNode>();

  for (const row of rows) {
    nodeMap.set(row.CHILD_CODE, {
      code: row.CHILD_CODE,
      name: row.CHILD_NAME,
      nodeType: row.NODE_TYPE,
      children: [],
    });
  }

  const roots: FolderNode[] = [];

  for (const row of rows) {
    const node = nodeMap.get(row.CHILD_CODE)!;
    if (row.PARENT_CODE && nodeMap.has(row.PARENT_CODE)) {
      nodeMap.get(row.PARENT_CODE)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// ── Utility Functions ──

export function doSort<T extends Record<string, string>>(list: T[], sort: SortState): T[] {
  if (!sort.key) return list;
  const key = sort.key;
  const sorted = [...list].sort((a, b) => {
    const va = (a[key] || '').toLowerCase();
    const vb = (b[key] || '').toLowerCase();
    if (va < vb) return -1;
    if (va > vb) return 1;
    return 0;
  });
  return sort.dir === 'desc' ? sorted.reverse() : sorted;
}

export function toastIcon(type: ToastType): string {
  if (type === 'success') return '✓';
  if (type === 'warn') return '⚠';
  return 'ℹ';
}

export function nextSortState(current: SortState, key: string): SortState {
  if (current.key === key) {
    if (current.dir === 'asc') return { key, dir: 'desc' };
    if (current.dir === 'desc') return { key: null, dir: null };
  }
  return { key, dir: 'asc' };
}

export function filterReports<T extends DevReport>(list: T[], query: string): T[] {
  if (!query) return list;
  const k = query.toLowerCase();
  return list.filter(
    r => r.REPORT_NAME.toLowerCase().includes(k) || r.REPORT_CODE.toLowerCase().includes(k)
  );
}

export function totalPages(itemCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

export function clampPage(page: number, total: number): number {
  return Math.min(page, total);
}

export function paginate<T>(list: T[], page: number, pageSize: number): T[] {
  return list.slice((page - 1) * pageSize, page * pageSize);
}

export function validateEndpoint(value: string, usedEndpoints: string[]): string | null {
  if (!value.trim()) return 'Endpoint명을 입력해주세요.';
  if (usedEndpoints.includes(value.trim())) return '이미 사용중인 Endpoint입니다.';
  return null;
}
