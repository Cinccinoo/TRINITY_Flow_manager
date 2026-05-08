/**************************************
 * ClientScript.js - Svelte FlowManager 연동
 *
 * 그리드 렌더링, 검색, 이관, 모달 등
 * 모든 UI 로직은 FlowManager.svelte가 담당합니다.
 *
 * Tree 이벤트(OnDataBindEnd, OnNodeDbClick)도
 * Svelte onMount() 내에서 등록됩니다.
 *
 * 이 파일은 Svelte 컴포넌트 마운트 용도로만 사용됩니다.
 **************************************/

// Svelte 컴포넌트가 Matrix 프레임워크의 Svelte 호스트를 통해
// 자동 마운트되는 경우 이 파일은 비워둘 수 있습니다.
//
// 수동 마운트가 필요한 경우:
// var target = document.getElementById('svelte-flow-manager');
// if (target) {
//   new FlowManager({ target: target });
// }
