import { defineConfig, loadEnv } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const matrixTarget = env.VITE_MATRIX_PROXY_TARGET || 'http://localhost:9091';
  const flowApiTarget = env.VITE_FLOW_API_PROXY_TARGET || 'http://localhost:7897';
  const proxyOrigin = env.VITE_PROXY_ORIGIN || 'http://localhost:5175';

  return {
    plugins: [svelte()],
    server: {
      proxy: {
        '/matrix': {
          target: matrixTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('User-Agent', 'MatrixCore3.0');
              proxyReq.setHeader('Origin', proxyOrigin);
            });
          },
        },
        '/flow-api': {
          target: flowApiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/flow-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('User-Agent', 'MatrixCore3.0');
              proxyReq.setHeader('Origin', proxyOrigin);
            });
          },
        },
      },
    },
    build: {
      // Matrix에서 로드할 수 있도록 단일 파일 빌드
      lib: {
        entry: 'src/entry.ts',
        name: 'FlowManager',
        fileName: 'flow-manager',
        formats: ['iife'],
      },
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          assetFileNames: 'flow-manager.[ext]',
        },
      },
    },
  };
});
