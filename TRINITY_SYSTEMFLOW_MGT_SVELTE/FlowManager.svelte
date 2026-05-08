<script lang="ts">
  import { onMount, tick } from 'svelte';
  import SortTh from './SortTh.svelte';
  import FolderTreeNode from './FolderTreeNode.svelte';
  import {
    type DevReport, type ProdReport, type SortState, type ToastState, type ConfirmState,
    type LoadingState, type FolderNode, type FolderTreeRow,
    PAGE_SIZE,
    doSort, toastIcon, nextSortState,
    totalPages, clampPage, paginate,
    buildFolderTree,
    getMatrix,
    searchFlows, getFolderTree, getAllFlows, getProdList,
    transferToProd, transferToDev
  } from './FlowManager';

  /* ── State ── */
  let devQ = '';
  let prodQ = '';
  let devSel = -1;
  let prodSel = -1;
  let dev: DevReport[] = [];
  let prod: ProdReport[] = [];
  let modalVisible = false;
  let toast: ToastState = { visible: false, msg: '', type: 'success' };
  let transferAnim: string | null = null;
  let devPage = 1;
  let prodPage = 1;
  let devSort: SortState = { key: null, dir: null };
  let prodSort: SortState = { key: null, dir: null };
  let confirmState: ConfirmState = { visible: false, item: null };
  let loading: LoadingState = { dev: false, prod: false, transfer: false };

  /* 현재 폴더 필터 */
  let currentFolderCode = '';
  let currentFolderPath = '';

  /* 폴더 트리 */
  let folderTree: FolderNode[] = [];
  let activeFolderCode = '';
  let sidebarOpen = true;

  /* ── Modal state ── */
  let ep = '';
  let epErr = '';
  let epInput: HTMLInputElement;

  /* ── Folder Tree ── */
  async function loadFolderTree() {
    try {
      const rows = await getFolderTree() as FolderTreeRow[];
      folderTree = buildFolderTree(rows);
    } catch (e: any) {
      console.warn('폴더 트리 로드 실패:', e.message);
      folderTree = [];
    }
  }

  function selectFolder(code: string, name: string) {
    activeFolderCode = code;
    currentFolderCode = code === 'ROOT' ? '' : code;
    currentFolderPath = code && code !== 'ROOT' ? '/ ' + name : '';
    devQ = '';
    devSel = -1;
    loadDev();
  }

  /* ── Toast ── */
  function flash(msg: string, type: 'success' | 'warn' | 'info' = 'success') {
    toast = { visible: true, msg, type };
    setTimeout(() => { toast = { ...toast, visible: false }; }, 2400);
  }

  /* ── Sort ── */
  function toggleDevSort(key: string) { devSort = nextSortState(devSort, key); }
  function toggleProdSort(key: string) { prodSort = nextSortState(prodSort, key); }

  /* ── Reactive: sort + paginate (서버에서 필터링됨) ── */
  $: fDev = doSort(dev, devSort);
  $: fProd = doSort(prod, prodSort);
  $: devTotal = totalPages(fDev.length, PAGE_SIZE);
  $: prodTotal = totalPages(fProd.length, PAGE_SIZE);
  $: clampDev = clampPage(devPage, devTotal);
  $: clampProd = clampPage(prodPage, prodTotal);
  $: devSlice = paginate(fDev, clampDev, PAGE_SIZE);
  $: prodSlice = paginate(fProd, clampProd, PAGE_SIZE);
  $: selItem = devSel >= 0 ? devSlice[devSel] : null;

  /* ══════════════════════════════════
     Data Loading (Matrix API)
     ══════════════════════════════════ */

  async function loadDev() {
    loading = { ...loading, dev: true };
    devSel = -1;
    try {
      let rows: any[];
      if (currentFolderCode || devQ) {
        rows = await searchFlows(currentFolderCode, devQ);
      } else {
        rows = await getAllFlows();
      }
      dev = rows as DevReport[];
    } catch (e: any) {
      flash(e.message || '개발 목록 조회 오류', 'warn');
      dev = [];
    } finally {
      loading = { ...loading, dev: false };
    }
    devPage = 1;
  }

  /* 매칭용 전체 개발 목록 (폴더 필터 무관) */
  let devAllForMatch: DevReport[] = [];

  /* 운영 전체 목록 (원본 보관용, 검색 시 필터 소스) */
  let prodAll: ProdReport[] = [];

  async function loadProd() {
    loading = { ...loading, prod: true };
    prodSel = -1;
    try {
      // 매칭용 전체 dev 목록 갱신 (폴더 필터와 무관하게 전체)
      try { devAllForMatch = await getAllFlows() as DevReport[]; } catch { /* keep old */ }

      const list = await getProdList() as ProdReport[];

      // Flow API는 name + endpoint_name만 줌 → dev에서 나머지 보충
      function findDev(prodCode: string): DevReport | undefined {
        return devAllForMatch.find(d =>
          d.REPORT_CODE === prodCode ||
          d.REPORT_NAME === prodCode ||
          prodCode.startsWith(d.REPORT_CODE) ||
          d.REPORT_CODE.startsWith(prodCode)
        );
      }
      for (const p of list) {
        const d = findDev(p.REPORT_CODE);
        if (d) {
          p.REPORT_CODE = d.REPORT_CODE || p.REPORT_CODE;
          p.REPORT_NAME = d.REPORT_NAME || p.REPORT_NAME;
          p.REPORT_DESC = d.REPORT_DESC || '';
          p.FOLDER_NAME = d.FOLDER_NAME || '';
          p.OWNER_CODE = d.OWNER_CODE || '';
          p.CREATE_DATE = d.CREATE_DATE || '';
          p.MODIFY_CODE = d.MODIFY_CODE || '';
          p.MODIFY_DATE = d.MODIFY_DATE || '';
        }
      }

      prodAll = list;
      prod = [...prodAll];
    } catch (e: any) {
      console.warn('[loadProd]', e.message);
      prodAll = [];
      prod = [];
    } finally {
      loading = { ...loading, prod: false };
    }
    prodPage = 1;
  }

  async function searchProd() {
    loading = { ...loading, prod: true };
    prodSel = -1;
    try {
      if (!prodQ.trim()) {
        prod = [...prodAll];
      } else {
        const kw = prodQ.toLowerCase();
        prod = prodAll.filter(r =>
          r.REPORT_NAME.toLowerCase().includes(kw) ||
          r.REPORT_CODE.toLowerCase().includes(kw) ||
          (r.ENDPOINT_NAME && r.ENDPOINT_NAME.toLowerCase().includes(kw))
        );
      }
    } catch (e: any) {
      flash(e.message || '운영 검색 오류', 'warn');
    } finally {
      loading = { ...loading, prod: false };
    }
    prodPage = 1;
  }

  /* ── Search handlers ── */
  let devSearchTimer: any = null;
  let prodSearchTimer: any = null;

  function handleDevSearch(e: Event) {
    devQ = (e.target as HTMLInputElement).value;
    clearTimeout(devSearchTimer);
    devSearchTimer = setTimeout(() => loadDev(), 400);
  }

  function handleDevSearchEnter(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      clearTimeout(devSearchTimer);
      loadDev();
    }
  }

  function handleProdSearch(e: Event) {
    prodQ = (e.target as HTMLInputElement).value;
    clearTimeout(prodSearchTimer);
    prodSearchTimer = setTimeout(() => searchProd(), 400);
  }

  function handleProdSearchEnter(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      clearTimeout(prodSearchTimer);
      searchProd();
    }
  }

  /* ── Transfer ── */
  function toProd() {
    if (devSel < 0 || !devSlice[devSel]) {
      flash('이관할 개발 리포트를 먼저 선택하세요.', 'info');
      return;
    }
    const item = devSlice[devSel];
    if (prod.some(p => p.REPORT_CODE === item.REPORT_CODE)) {
      flash('이미 운영중인 리포트입니다.', 'warn');
      return;
    }
    openModal();
  }

  function toDev() {
    if (prodSel < 0 || !prodSlice[prodSel]) {
      flash('이관할 운영 리포트를 먼저 선택하세요.', 'info');
      return;
    }
    confirmState = { visible: true, item: prodSlice[prodSel] };
  }

  async function confirmToDev() {
    const item = confirmState.item!;
    confirmState = { visible: false, item: null };

    loading = { ...loading, transfer: true };
    transferAnim = 'toDev';

    try {
      /* Flow API 직접 호출 */
      await transferToDev(item.REPORT_CODE);

      setTimeout(async () => {
        transferAnim = null;
        prodSel = -1;
        flash('개발모드로 이관되었습니다.');
        await Promise.all([loadDev(), loadProd()]);
        dev = [...dev]; // prodAll 갱신 후 isInProd 반영
      }, 400);

    } catch (e: any) {
      transferAnim = null;
      flash(e.message || '이관 처리 중 오류', 'warn');
    } finally {
      loading = { ...loading, transfer: false };
    }
  }

  /* ── Modal ── */
  async function openModal() {
    ep = '';
    epErr = '';
    modalVisible = true;
    await tick();
    setTimeout(() => epInput?.focus(), 120);
  }

  function closeModal() {
    modalVisible = false;
  }

  async function saveEp() {
    if (!ep.trim()) {
      epErr = 'Endpoint명을 입력해주세요.';
      return;
    }

    /* 1. Endpoint 중복 체크 (클라이언트 사이드 — 운영 목록 기준) */
    const epName = ep.trim();
    if (prodAll.some(p => p.ENDPOINT_NAME === epName)) {
      epErr = '이미 사용중인 Endpoint 명입니다.';
      return;
    }

    loading = { ...loading, transfer: true };

    try {
      /* 2. 이관 실행 (Flow API 직접 호출) */
      const item = devSlice[devSel];
      await transferToProd(item.REPORT_CODE, epName);

      /* 3. 성공 */
      modalVisible = false;
      devSel = -1;
      flash('운영 모드로 이관되었습니다.');
      await Promise.all([loadDev(), loadProd()]);
      dev = [...dev]; // prodAll 갱신 후 isInProd 반영

    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('endpoint_name')) {
        epErr = '이미 사용중인 Endpoint 명입니다.';
      } else {
        flash(msg || '이관 처리 중 오류', 'warn');
      }
    } finally {
      loading = { ...loading, transfer: false };
    }
  }

  /* ── Refresh ── */
  async function refresh() {
    devQ = '';
    prodQ = '';
    devSel = -1;
    prodSel = -1;
    devPage = 1;
    prodPage = 1;
    devSort = { key: null, dir: null };
    prodSort = { key: null, dir: null };
    currentFolderCode = '';
    currentFolderPath = '';
    await Promise.all([loadDev(), loadProd()]);
    flash('새로고침 완료');
  }

  /* ── Helper ── */
  function isInProd(reportCode: string): boolean {
    return prodAll.some(p =>
      p.REPORT_CODE === reportCode ||
      p.REPORT_NAME === reportCode ||
      p.REPORT_CODE.startsWith(reportCode) ||
      reportCode.startsWith(p.REPORT_CODE)
    );
  }

  /* ── 트리 경로 빌드 ── */
  function buildTreePath(node: any): string {
    let nd = node;
    let path = '';
    while (nd != null) {
      path = nd.GetValue('CHILD_NAME') + '/' + path;
      nd = nd.Parent;
      if (nd && nd.IsRoot) break;
    }
    return '/' + path;
  }

  /* ══════════════════════════════════
     Matrix Tree 이벤트 바인딩 + 초기 로드
     ══════════════════════════════════ */
  onMount(() => {
    // Matrix Tree 이벤트 바인딩 (Matrix 환경에서만 동작)
    try {
      const M = getMatrix();
      const Tree = M.getObject('Tree');

      if (Tree) {
        Tree.OnDataBindEnd = function () {
          Tree.ExpandToLevel(1);
          loadDev(); loadProd();
        };

        Tree.OnNodeDbClick = function (s: any, e: any) {
          currentFolderCode = e.Node.GetValue('CHILD_CODE');
          currentFolderPath = buildTreePath(e.Node);
          devQ = '';
          devSel = -1;
          loadDev();
        };
      }
    } catch {
      console.warn('Matrix Tree 환경 외부에서 실행 중');
    }

    // 폴더 트리 + 데이터 로드
    loadFolderTree();
    loadDev();
    loadProd();
  });
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</svelte:head>

<div class="app">
  <!-- Folder Tree Sidebar -->
  <aside class="tree-sidebar" class:collapsed={!sidebarOpen}>
    <div class="tree-header">
      <span>{sidebarOpen ? '폴더' : ''}</span>
      <button class="sidebar-toggle" on:click={() => sidebarOpen = !sidebarOpen}>
        {sidebarOpen ? '◂' : '▸'}
      </button>
    </div>
    {#if sidebarOpen}
      {#each folderTree as root (root.code)}
        <FolderTreeNode
          node={root}
          depth={0}
          activeCode={activeFolderCode}
          onSelect={selectFolder}
        />
      {/each}
    {/if}
  </aside>

  <!-- Main -->
  <div class="main">
    <div class="topbar">
      <div class="topbar-left">
        <div>
          <div class="topbar-title">System Flow Manager</div>
          <div class="topbar-subtitle">
            {#if currentFolderPath}
              {currentFolderPath}
            {:else}
              개발 ↔ 운영 리포트 이관 관리
            {/if}
          </div>
        </div>
      </div>
      <button class="btn-refresh" on:click={refresh}>↻ 새로고침</button>
    </div>

    <div class="content">
      <!-- DEV Panel -->
      <div class="panel dev-panel">
        <div class="panel-header">
          <div class="panel-title-area">
            <span class="panel-dot dev"></span>
            <span class="panel-label dev">개발모드</span>
            <span class="panel-count">{fDev.length}</span>
          </div>
          <div class="panel-right">
            <div class="search-box">
              <span class="search-icon">⌕</span>
              <input class="dev-input" value={devQ} on:input={handleDevSearch} on:keydown={handleDevSearchEnter} placeholder="리포트 검색..." />
            </div>
          </div>
        </div>
        <div class="grid-wrap">
          {#if loading.dev}
            <div class="loading-overlay">조회 중...</div>
          {/if}
          <table class="grid-table">
            <thead>
              <tr>
                <th style="width: 32px">#</th>
                <SortTh label="리포트" sortKey="REPORT_NAME" currentSort={devSort} onSort={toggleDevSort} />
                <SortTh label="설명" sortKey="REPORT_DESC" currentSort={devSort} onSort={toggleDevSort} />
                <SortTh label="생성자" sortKey="OWNER_CODE" currentSort={devSort} onSort={toggleDevSort} />
                <SortTh label="생성일" sortKey="CREATE_DATE" currentSort={devSort} onSort={toggleDevSort} />
                <SortTh label="수정자" sortKey="MODIFY_CODE" currentSort={devSort} onSort={toggleDevSort} />
                <SortTh label="수정일" sortKey="MODIFY_DATE" currentSort={devSort} onSort={toggleDevSort} />
              </tr>
            </thead>
            <tbody>
              {#if devSlice.length === 0}
                <tr><td colspan="7" class="empty-state">
                  {loading.dev ? '' : '개발 리포트가 없습니다.'}
                </td></tr>
              {:else}
                {#each devSlice as r, i (r.REPORT_CODE + i)}
                  {@const inProd = isInProd(r.REPORT_CODE)}
                  <tr
                    class="grid-row"
                    class:selected={devSel === i}
                    class:in-prod={inProd}
                    on:click={() => devSel = i}
                  >
                    <td class="cell-num">{(clampDev - 1) * PAGE_SIZE + i + 1}</td>
                    <td class="cell-name">
                      <div class="name-wrap">
                        <img class="report-icon-img" src="/trinitylogo.png" alt="" />
                        <div>
                          <div class="report-name">{r.REPORT_NAME}</div>
                          <div class="report-sub">
                            {#if inProd}<span class="prod-badge">운영중</span>{/if}
                            <span class="report-code">{r.REPORT_CODE}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="cell-desc">{r.REPORT_DESC || ''}</td>
                    <td class="cell-owner">{r.OWNER_CODE || ''}</td>
                    <td class="cell-date">{r.CREATE_DATE || ''}</td>
                    <td class="cell-owner">{r.MODIFY_CODE || ''}</td>
                    <td class="cell-date">{r.MODIFY_DATE || ''}</td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
        <div class="panel-footer">
          <span class="panel-footer-info">총 {fDev.length}건</span>
          {#if devTotal > 1}
            <div class="pager">
              <button class="pager-btn" disabled={clampDev <= 1} on:click={() => { devPage = 1; devSel = -1; }}>«</button>
              <button class="pager-btn" disabled={clampDev <= 1} on:click={() => { devPage = clampDev - 1; devSel = -1; }}>‹</button>
              <span class="pager-info">{clampDev} / {devTotal}</span>
              <button class="pager-btn" disabled={clampDev >= devTotal} on:click={() => { devPage = clampDev + 1; devSel = -1; }}>›</button>
              <button class="pager-btn" disabled={clampDev >= devTotal} on:click={() => { devPage = devTotal; devSel = -1; }}>»</button>
            </div>
          {/if}
        </div>
      </div>

      <!-- Transfer Buttons -->
      <div class="transfer-row">
        <button class="transfer-btn to-prod" on:click={toProd} disabled={loading.transfer}>
          <span class="arrow">↓</span>
          <span class="label">운영모드로 이관</span>
        </button>
        <div class="transfer-divider"></div>
        <button class="transfer-btn to-dev" on:click={toDev} disabled={loading.transfer}>
          <span class="arrow">↑</span>
          <span class="label">개발모드로 이관</span>
        </button>
      </div>

      <!-- PROD Panel -->
      <div class="panel prod-panel" class:anim-to-dev={transferAnim === 'toDev'}>
        <div class="panel-header">
          <div class="panel-title-area">
            <span class="panel-dot prod"></span>
            <span class="panel-label prod">운영모드</span>
            <span class="panel-count">{fProd.length}</span>
          </div>
          <div class="panel-right">
            <div class="search-box">
              <span class="search-icon">⌕</span>
              <input class="prod-input" value={prodQ} on:input={handleProdSearch} on:keydown={handleProdSearchEnter} placeholder="리포트 검색..." />
            </div>
          </div>
        </div>
        <div class="grid-wrap">
          {#if loading.prod}
            <div class="loading-overlay">조회 중...</div>
          {/if}
          <table class="grid-table">
            <thead>
              <tr>
                <th style="width: 32px">#</th>
                <SortTh label="리포트" sortKey="REPORT_NAME" currentSort={prodSort} onSort={toggleProdSort} />
                <SortTh label="Endpoint" sortKey="ENDPOINT_NAME" currentSort={prodSort} onSort={toggleProdSort} />
                <SortTh label="설명" sortKey="REPORT_DESC" currentSort={prodSort} onSort={toggleProdSort} />
                <SortTh label="폴더" sortKey="FOLDER_NAME" currentSort={prodSort} onSort={toggleProdSort} />
                <SortTh label="생성자" sortKey="OWNER_CODE" currentSort={prodSort} onSort={toggleProdSort} />
                <SortTh label="생성일" sortKey="CREATE_DATE" currentSort={prodSort} onSort={toggleProdSort} />
                <SortTh label="수정자" sortKey="MODIFY_CODE" currentSort={prodSort} onSort={toggleProdSort} />
                <SortTh label="수정일" sortKey="MODIFY_DATE" currentSort={prodSort} onSort={toggleProdSort} />
              </tr>
            </thead>
            <tbody>
              {#if prodSlice.length === 0}
                <tr><td colspan="9" class="empty-state">
                  {loading.prod ? '' : '운영 리포트가 없습니다.'}
                </td></tr>
              {:else}
                {#each prodSlice as r, i ((r.REPORT_CODE || r.id || i) + '-' + i)}
                  <tr
                    class="grid-row"
                    class:selected={prodSel === i}
                    on:click={() => prodSel = i}
                  >
                    <td class="cell-num">{(clampProd - 1) * PAGE_SIZE + i + 1}</td>
                    <td class="cell-name">
                      <div class="name-wrap">
                        <img class="report-icon-img" src="/trinitylogo.png" alt="" />
                        <div>
                          <div class="report-name">{r.REPORT_NAME}</div>
                          <div class="report-sub">
                            <span class="report-code">{r.REPORT_CODE}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {#if r.ENDPOINT_NAME}
                        <span class="endpoint-tag">{r.ENDPOINT_NAME}</span>
                      {:else}
                        —
                      {/if}
                    </td>
                    <td class="cell-desc">{r.REPORT_DESC}</td>
                    <td class="cell-folder"><span class="folder-badge">{r.FOLDER_NAME}</span></td>
                    <td class="cell-owner">{r.OWNER_CODE}</td>
                    <td class="cell-date">{r.CREATE_DATE}</td>
                    <td class="cell-owner">{r.MODIFY_CODE}</td>
                    <td class="cell-date">{r.MODIFY_DATE}</td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
        <div class="panel-footer">
          <span class="panel-footer-info">총 {fProd.length}건</span>
          {#if prodTotal > 1}
            <div class="pager">
              <button class="pager-btn" disabled={clampProd <= 1} on:click={() => { prodPage = 1; prodSel = -1; }}>«</button>
              <button class="pager-btn" disabled={clampProd <= 1} on:click={() => { prodPage = clampProd - 1; prodSel = -1; }}>‹</button>
              <span class="pager-info">{clampProd} / {prodTotal}</span>
              <button class="pager-btn" disabled={clampProd >= prodTotal} on:click={() => { prodPage = clampProd + 1; prodSel = -1; }}>›</button>
              <button class="pager-btn" disabled={clampProd >= prodTotal} on:click={() => { prodPage = prodTotal; prodSel = -1; }}>»</button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Endpoint Modal -->
  {#if modalVisible}
    <div class="modal-overlay" on:click|self={closeModal}>
      <div class="modal-box">
        <div class="modal-header">
          <span>🚀 운영모드 이관</span>
          <button class="modal-close" on:click={closeModal}>✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-info-row">
            <div class="modal-info-label">리포트</div>
            <div class="modal-info-value">{selItem?.REPORT_NAME || ''}</div>
          </div>
          <div class="modal-info-row">
            <div class="modal-info-label">Code</div>
            <div class="modal-info-value mono">{selItem?.REPORT_CODE || ''}</div>
          </div>
          <div class="modal-field">
            <label>Endpoint Name <span class="required">*</span></label>
            <input
              bind:this={epInput}
              bind:value={ep}
              on:input={() => epErr = ''}
              on:keydown={(e) => e.key === 'Enter' && saveEp()}
              placeholder="예: my-report-api"
              class:input-error={epErr}
            />
            {#if epErr}
              <div class="field-error">{epErr}</div>
            {/if}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" on:click={closeModal}>취소</button>
          <button class="btn-primary" on:click={saveEp} disabled={loading.transfer}>
            {loading.transfer ? '처리 중...' : '이관 실행'}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Confirm Dialog -->
  {#if confirmState.visible}
    <div class="modal-overlay" on:click|self={() => confirmState = { visible: false, item: null }}>
      <div class="confirm-box">
        <div class="confirm-icon">⚠️</div>
        <div class="confirm-title">개발모드로 이관</div>
        <div class="confirm-msg">
          "{confirmState.item?.REPORT_NAME}" 리포트를 운영모드에서 제거하고 개발모드로 이관하시겠습니까?
        </div>
        <div class="confirm-actions">
          <button class="btn-cancel" on:click={() => confirmState = { visible: false, item: null }}>취소</button>
          <button class="btn-danger" on:click={confirmToDev} disabled={loading.transfer}>
            {loading.transfer ? '처리 중...' : '이관 실행'}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Toast -->
  {#if toast.visible}
    <div class="toast toast-{toast.type}">
      <span>{toastIcon(toast.type)}</span>{toast.msg}
    </div>
  {/if}
</div>

<style>
  :global(:root) {
    --bg: #f0f2f5; --surface: #ffffff; --surface2: #f7f8fa;
    --border: #e1e4ea; --border-light: #d0d5dd;
    --text: #1a1d23; --text2: #5f6777; --text3: #9aa1b0;
    --dev: #2563eb; --dev-light: #eff4ff; --dev-border: #bfdbfe; --dev-glow: rgba(37,99,235,.08);
    --prod: #16a34a; --prod-light: #ecfdf3; --prod-border: #bbf7d0; --prod-glow: rgba(22,163,74,.08);
    --danger: #dc2626;
    --font: 'Outfit', -apple-system, sans-serif;
    --mono: 'JetBrains Mono', monospace;
  }
  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(::-webkit-scrollbar) { width: 5px; height: 5px; }
  :global(::-webkit-scrollbar-track) { background: transparent; }
  :global(::-webkit-scrollbar-thumb) { background: #d0d5dd; border-radius: 3px; }

  .app { display: flex; height: 100vh; background: var(--bg); font-family: var(--font); color: var(--text); overflow: hidden; }

  /* Tree Sidebar */
  .tree-sidebar { width: 220px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow-y: auto; transition: width .2s ease; }
  .tree-sidebar.collapsed { width: 36px; overflow: hidden; }
  .tree-header { padding: 10px 10px 8px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text3); display: flex; align-items: center; justify-content: space-between; }
  .sidebar-toggle { background: none; border: 1px solid var(--border); border-radius: 5px; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text3); font-size: 11px; transition: all .15s; flex-shrink: 0; }
  .sidebar-toggle:hover { background: var(--surface2); color: var(--text); border-color: var(--border-light); }
  .collapsed .tree-header { padding: 10px 7px 8px; justify-content: center; }
  .collapsed .sidebar-toggle { border: none; }


  /* Main */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .topbar { padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); background: var(--surface); flex-shrink: 0; }
  .topbar-left { display: flex; align-items: center; gap: 12px; }
  .topbar-title { font-size: 17px; font-weight: 700; letter-spacing: -.02em; }
  .topbar-subtitle { font-size: 12px; color: var(--text3); margin-top: 1px; }
  .btn-refresh { display: flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text2); cursor: pointer; font-size: 12.5px; font-family: var(--font); font-weight: 500; transition: all .15s; }
  .btn-refresh:hover { border-color: var(--border-light); color: var(--text); background: var(--surface2); box-shadow: 0 1px 3px rgba(0,0,0,.06); }
  .content { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 16px 20px; gap: 0; }

  /* Panel */
  .panel { flex: 1; display: flex; flex-direction: column; min-height: 0; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
  .panel-header { padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; border-bottom: 1px solid var(--border); background: var(--surface2); }
  .panel-title-area { display: flex; align-items: center; gap: 9px; }
  .panel-dot { width: 9px; height: 9px; border-radius: 50%; }
  .panel-dot.dev { background: var(--dev); box-shadow: 0 0 0 3px var(--dev-glow); }
  .panel-dot.prod { background: var(--prod); box-shadow: 0 0 0 3px var(--prod-glow); }
  .panel-label { font-size: 13.5px; font-weight: 700; }
  .panel-label.dev { color: var(--dev); }
  .panel-label.prod { color: var(--prod); }
  .panel-count { font-size: 11px; color: var(--text3); background: var(--surface); padding: 2px 9px; border-radius: 10px; border: 1px solid var(--border); font-weight: 500; font-family: var(--mono); }
  .panel-right { display: flex; align-items: center; gap: 10px; }
  .search-box { position: relative; width: 200px; }
  .search-box input { width: 100%; padding: 5px 10px 5px 28px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 12.5px; font-family: var(--font); outline: none; transition: all .15s; }
  .search-box input::placeholder { color: var(--text3); }
  .search-box input.dev-input:focus { border-color: var(--dev); box-shadow: 0 0 0 3px var(--dev-glow); }
  .search-box input.prod-input:focus { border-color: var(--prod); box-shadow: 0 0 0 3px var(--prod-glow); }
  .search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: var(--text3); font-size: 13px; pointer-events: none; }

  /* Table */
  .grid-wrap { flex: 1; overflow: auto; position: relative; }
  .grid-table { width: 100%; border-collapse: separate; border-spacing: 0; }
  .grid-table thead :global(th) { position: sticky; top: 0; z-index: 2; padding: 8px 10px; text-align: left; font-size: 10.5px; font-weight: 600; color: var(--text3); letter-spacing: .06em; text-transform: uppercase; background: var(--surface2); border-bottom: 1px solid var(--border); }
  .grid-row { cursor: pointer; transition: background .1s; }
  .grid-row td { padding: 9px 10px; border-bottom: 1px solid var(--bg); font-size: 12.5px; color: var(--text2); vertical-align: middle; }
  .grid-row:hover td { background: var(--surface2); }
  .grid-row.selected td { background: var(--dev-light); }
  .prod-panel .grid-row.selected td { background: var(--prod-light); }
  .cell-num { width: 32px; text-align: center; color: var(--text3) !important; font-family: var(--mono); font-size: 11px !important; }
  .cell-name { min-width: 170px; }
  .name-wrap { display: flex; align-items: center; gap: 10px; }
  .report-icon-img { width: 20px; height: 20px; flex-shrink: 0; object-fit: contain; }
  .report-name { font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; font-size: 12.5px; }
  .report-sub { display: flex; align-items: center; gap: 6px; margin-top: 1px; }
  .report-code { font-size: 10.5px; color: var(--text3); font-family: var(--mono); }
  .cell-desc { color: var(--text3) !important; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .folder-badge { display: inline-block; padding: 2px 9px; border-radius: 5px; background: var(--surface2); border: 1px solid var(--border); font-size: 11px; color: var(--text2); white-space: nowrap; }
  .cell-owner { font-size: 12px !important; }
  .cell-date { font-family: var(--mono); font-size: 11px !important; color: var(--text3) !important; white-space: nowrap; }
  .endpoint-tag { display: inline-block; padding: 3px 10px; border-radius: 5px; background: var(--prod-light); border: 1px solid var(--prod-border); font-size: 11px; color: var(--prod); font-family: var(--mono); font-weight: 500; }
  .empty-state { padding: 36px 20px; text-align: center; color: var(--text3); font-size: 13px; }

  /* In-prod indicator */
  .grid-row.in-prod td { color: var(--text3) !important; opacity: .6; }
  .grid-row.in-prod .report-name { color: var(--text3) !important; }
  .grid-row.in-prod:hover td { opacity: .8; }
  .grid-row.in-prod.selected td { opacity: .8; }
  .prod-badge { display: inline-block; margin-left: 8px; padding: 1px 7px; border-radius: 4px; background: var(--prod-light); border: 1px solid var(--prod-border); font-size: 9.5px; font-weight: 600; color: var(--prod); vertical-align: middle; letter-spacing: .02em; }

  /* Sort indicator (global because SortTh is a child component) */
  :global(.sort-th-inner) { display: flex; align-items: center; gap: 4px; }
  :global(.sort-indicator) { font-size: 8px; color: var(--text3); opacity: .4; transition: all .15s; }
  :global(.sort-indicator.active) { opacity: 1; color: var(--dev); }
  .grid-table thead :global(th:hover .sort-indicator) { opacity: .7; }

  /* Loading overlay */
  .loading-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.7); color: var(--text3); font-size: 13px; z-index: 5; }

  /* Confirm dialog */
  .confirm-box { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; width: 380px; padding: 28px 24px 22px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,.12); animation: modalPop .2s ease-out; }
  .confirm-icon { font-size: 32px; margin-bottom: 10px; }
  .confirm-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
  .confirm-msg { font-size: 13px; color: var(--text2); line-height: 1.5; margin-bottom: 20px; word-break: keep-all; }
  .confirm-actions { display: flex; justify-content: center; gap: 8px; }
  .btn-danger { padding: 8px 22px; border-radius: 8px; border: none; background: #dc2626; color: #fff; cursor: pointer; font-size: 13px; font-family: var(--font); font-weight: 600; transition: all .15s; box-shadow: 0 2px 8px rgba(220,38,38,.2); }
  .btn-danger:hover { background: #b91c1c; box-shadow: 0 4px 14px rgba(220,38,38,.25); transform: translateY(-1px); }
  .btn-danger:disabled { opacity: .6; cursor: not-allowed; transform: none; }

  /* Panel footer with pagination */
  .panel-footer { display: flex; align-items: center; justify-content: space-between; padding: 6px 16px; border-top: 1px solid var(--border); background: var(--surface2); flex-shrink: 0; min-height: 34px; }
  .panel-footer-info { font-size: 11px; color: var(--text3); font-family: var(--mono); }
  .pager { display: flex; align-items: center; gap: 4px; }
  .pager-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text2); cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; transition: all .12s; font-family: var(--font); }
  .pager-btn:hover:not(:disabled) { background: var(--surface2); border-color: var(--border-light); color: var(--text); }
  .pager-btn:disabled { opacity: .35; cursor: default; }
  .pager-info { font-size: 12px; font-weight: 600; color: var(--text); padding: 0 8px; font-family: var(--mono); min-width: 50px; text-align: center; }

  /* Transfer */
  .transfer-row { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 8px 0; flex-shrink: 0; }
  .transfer-btn { height: 36px; padding: 0 22px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all .18s; font-family: var(--font); }
  .transfer-btn:hover:not(:disabled) { box-shadow: 0 2px 8px rgba(0,0,0,.08); transform: translateY(-1px); }
  .transfer-btn:active:not(:disabled) { transform: translateY(0) scale(.98); }
  .transfer-btn:disabled { opacity: .5; cursor: not-allowed; }
  .transfer-btn.to-prod:hover:not(:disabled) { border-color: var(--prod-border); background: var(--prod-light); }
  .transfer-btn.to-dev:hover:not(:disabled) { border-color: var(--dev-border); background: var(--dev-light); }
  .transfer-btn .arrow { font-size: 16px; line-height: 1; }
  .transfer-btn.to-prod .arrow { color: var(--prod); }
  .transfer-btn.to-dev .arrow { color: var(--dev); }
  .transfer-btn .label { font-size: 12px; font-weight: 600; color: var(--text2); white-space: nowrap; }
  .transfer-btn.to-prod:hover:not(:disabled) .label { color: var(--prod); }
  .transfer-btn.to-dev:hover:not(:disabled) .label { color: var(--dev); }
  .transfer-divider { width: 1px; height: 18px; background: var(--border); }

  @keyframes slideDown { 0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(24px)} }
  @keyframes slideUp { 0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-24px)} }
  :global(.anim-to-prod .grid-row.selected td) { animation: slideDown .35s ease-in forwards; }
  :global(.anim-to-dev .grid-row.selected td) { animation: slideUp .35s ease-in forwards; }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,.3); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; }
  .modal-box { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,.12); animation: modalPop .2s ease-out; }
  @keyframes modalPop { from{opacity:0;transform:scale(.94) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)} }
  .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); font-size: 15px; font-weight: 700; }
  .modal-close { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 16px; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all .12s; }
  .modal-close:hover { background: var(--surface2); color: var(--text); }
  .modal-body { padding: 20px 22px; }
  .modal-info-row { display: flex; gap: 12px; margin-bottom: 14px; align-items: baseline; }
  .modal-info-label { font-size: 11px; font-weight: 600; color: var(--text3); min-width: 50px; text-transform: uppercase; letter-spacing: .04em; }
  .modal-info-value { font-size: 13px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .modal-info-value.mono { font-family: var(--mono); font-size: 12px; color: var(--text2); }
  .modal-field { margin-top: 18px; }
  .modal-field label { display: block; font-size: 12.5px; font-weight: 600; color: var(--text2); margin-bottom: 7px; }
  .required { color: var(--danger); }
  .modal-field input { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13px; font-family: var(--mono); outline: none; transition: all .15s; }
  .modal-field input::placeholder { color: var(--text3); }
  .modal-field input:focus { border-color: var(--prod); box-shadow: 0 0 0 3px var(--prod-glow); background: var(--surface); }
  .modal-field input.input-error { border-color: var(--danger); }
  .field-error { color: var(--danger); font-size: 11.5px; margin-top: 6px; font-weight: 500; }
  .modal-footer { padding: 14px 22px 18px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border); }
  .btn-cancel { padding: 8px 20px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text2); cursor: pointer; font-size: 13px; font-family: var(--font); font-weight: 500; transition: all .12s; }
  .btn-cancel:hover { border-color: var(--border-light); color: var(--text); background: var(--surface2); }
  .btn-primary { padding: 8px 22px; border-radius: 8px; border: none; background: var(--prod); color: #fff; cursor: pointer; font-size: 13px; font-family: var(--font); font-weight: 600; transition: all .15s; box-shadow: 0 2px 8px rgba(22,163,74,.2); }
  .btn-primary:hover:not(:disabled) { background: #15803d; box-shadow: 0 4px 14px rgba(22,163,74,.25); transform: translateY(-1px); }
  .btn-primary:disabled { opacity: .6; cursor: not-allowed; transform: none; }

  .toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); padding: 10px 24px; border-radius: 10px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; box-shadow: 0 6px 24px rgba(0,0,0,.1); z-index: 10000; animation: toastIn .25s ease-out; font-family: var(--font); }
  :global(.toast-success) { background: #ecfdf3; color: var(--prod); border: 1px solid var(--prod-border); }
  :global(.toast-info) { background: #eff4ff; color: var(--dev); border: 1px solid var(--dev-border); }
  :global(.toast-warn) { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)} }
</style>
