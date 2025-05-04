# 세련된 온라인 MUD 게임 (웹 기반)

## 소개
- Node.js(Express, WebSocket)와 React를 활용한 실시간 온라인 MUD 게임입니다.
- 실시간 채팅, 명령어 기반 방 이동, 플레이어 목록 등 기본 기능 제공
- 세련된 UI와 확장성 고려

## 폴더 구조
```
mud-game/
├── backend/         # Node.js 서버 (Express + WebSocket)
│   ├── server.js
│   └── package.json
├── frontend/        # React 프론트엔드
│   ├── src/
│   │   ├── App.js
│   │   └── ...
│   └── package.json
├── package.json     # (루트) 서버/클라 동시 실행 스크립트
└── README.md
```

## 실행 방법

### 1. 서버/클라이언트 동시 실행 (추천)
```bash
npm install  # (루트에서, concurrently 설치)
npm install --prefix backend  # 백엔드 의존성
npm install --prefix frontend # 프론트엔드 의존성
npm run dev   # 서버와 클라이언트가 동시에 실행됨
```
- 프론트엔드: http://localhost:3000
- 백엔드(WebSocket): ws://localhost:4000

### 2. 서버 코드 수정 시 자동 재시작
- `npm run dev --prefix backend` (nodemon 사용)

### 3. 개별 실행 (기존 방식)
- 백엔드: `cd backend && npm install && npm start`
- 프론트엔드: `cd frontend && npm install && npm start` 