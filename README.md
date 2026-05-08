# Trinity Flow Manager

Svelte와 Vite로 만든 Matrix 기반 플로우 운영 관리 UI입니다. 개발/운영 플로우 목록을 비교하고, endpoint 이름을 검증한 뒤 운영 전환 또는 개발 전환 작업을 수행할 수 있도록 구성했습니다.

## Highlights

- 개발/운영 플로우 목록 조회, 검색, 정렬, 페이지네이션
- 폴더 트리 기반 개발 플로우 탐색
- 운영 endpoint 중복 검증 및 이관 실행
- Matrix 환경용 IIFE 번들 빌드
- 포트폴리오 공개를 위해 내부 API 주소는 환경변수와 예시값으로 분리

## Tech Stack

- Svelte 4
- Vite 5
- TypeScript
- Matrix server script integration

## Project Structure

```txt
src/
  app/
    components/
    FlowManager.svelte
    FlowManager.ts
  entry.ts
  main.ts
  mockMatrix.ts
platform/
  matrix/
    ClientScript.js
    server-scripts/
public/
  trinitylogo.png
```

## Getting Started

```bash
npm install
npm run dev
```

Create a local `.env` from `.env.example` when connecting to a real Matrix or Flow API environment.

```bash
VITE_MATRIX_PROXY_TARGET=http://localhost:9091
VITE_FLOW_API_PROXY_TARGET=http://localhost:7897
VITE_PROXY_ORIGIN=http://localhost:5175
```

## Build

```bash
npm run build
```

The production build emits an IIFE bundle for Matrix embedding.

## Portfolio Note

This repository is sanitized for public portfolio use. Internal network addresses and deployment-specific endpoints are not included.
