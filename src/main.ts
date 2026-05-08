import { installMockMatrix } from './mockMatrix';
import FlowManager from './app/FlowManager.svelte';

// Matrix 환경이 아닌 경우 Mock 설치
if (!(window as any).Matrix) {
  installMockMatrix();
}

const app = new FlowManager({
  target: document.getElementById('app')!,
});

export default app;
