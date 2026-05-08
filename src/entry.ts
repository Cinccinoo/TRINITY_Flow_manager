/**
 * Matrix 환경용 엔트리포인트
 * - window.Matrix가 이미 존재하면 Mock 없이 실제 API 사용
 * - 지정된 target 요소에 FlowManager를 마운트
 */
import FlowManager from './app/FlowManager.svelte';

export function mount(targetEl: HTMLElement) {
  return new FlowManager({ target: targetEl });
}

// 자동 마운트: id="flow-manager" 요소가 있으면 바로 마운트
const auto = document.getElementById('flow-manager');
if (auto) {
  mount(auto);
}
