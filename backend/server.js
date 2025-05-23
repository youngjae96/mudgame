const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const Player = require('./models/Player');
const { ITEM_POOL, FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS, SHOP_ITEMS, ISLAND_MONSTERS, ISLAND2_MONSTERS, DESERT_MONSTERS, PYRAMID_MONSTERS, PYRAMID2_MONSTERS } = require('./data/items');
const { MAP_SIZE, VILLAGE_POS, rooms, getRoom, roomsIsland, ISLAND_VILLAGE_POS, roomsCave, MAP_SIZE_CAVE, roomsIsland2, ISLAND2_VILLAGE_POS } = require('./data/map');
const Monster = require('./models/Monster');
const {
  broadcast,
  sendPlayerList,
  sendRoomInfo,
  sendRoomInfoToAllInRoom,
  sendInventory,
  sendCharacterInfo
} = require('./utils/broadcast');
const { processBattle } = require('./battle');
const { respawnMonster } = require('./monsterSpawner');
require('./db');
const jwt = require('jsonwebtoken');
const SECRET = 'your_jwt_secret';
const PlayerData = require('./models/PlayerData');
const User = require('./models/User');
const { commandHandlers } = require('./commands');
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const playerRouter = require('./routes/player');
const shopRouter = require('./routes/shop');
const battleRouter = require('./routes/battle');
const { PlayerManager, clanHealTick } = require('./playerManager');
const RoomManager = require('./roomManager');
const ShopService = require('./services/ShopService');
const PlayerService = require('./services/PlayerService');
const { setupCommands } = require('./commands');
const PlayerGameService = require('./services/PlayerGameService');
const Guild = require('./models/Guild');
const ChatLog = require('./models/ChatLog');
const authRouter = require('./routes/auth');
const commandsRouter = require('./routes/commands');
const boardRouter = require('./routes/board');

const app = express();
app.use(cors());
app.use(express.json());
app.use(logger);
app.use('/api/player', playerRouter);
app.use('/api/shop', shopRouter);
app.use('/api/battle', battleRouter);
app.use('/api/auth', authRouter);
app.use('/api/commands', commandsRouter);
app.use('/api/board', boardRouter);
require('./routes/docs')(app);
app.use(errorHandler);
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 4000;

let battleIntervals = {};
global.currentNotice = null;
global.wss = wss;

// 한 계정당 하나의 WebSocket만 허용
const activeSockets = {}; // username: ws

// 저장 쿨타임 관리 객체
const playerSaveCooldown = {}; // { [playerName]: timestamp }
// 저장 큐잉 관리 객체
const playerSaveQueue = {}; // { [playerName]: Promise }

// === WebSocket ping/pong 감시 및 타임아웃 정리 ===
const PING_INTERVAL = 30000; // 30초
let pingInterval = null;

function getPlayersInRoom(world, x, y) {
  return Object.values(PlayerManager.getAllPlayers())
    .filter((p) => p.world === world && p.position && p.position.x === x && p.position.y === y)
    .map((p) => p.name);
}

/*
 * =============================
 * 서버-클라이언트 메시지 스키마
 * =============================
 *
 * 채팅 메시지
 * {
 *   type: 'chat',            // 메시지 타입
 *   chatType: 'global'|'local', // 전체/지역 구분
 *   name: string,            // 보낸 사람 닉네임
 *   message: string          // 메시지 본문
 * }
 *
 * 시스템 메시지
 * {
 *   type: 'system',
 *   subtype?: 'info'|'error'|'guide'|'event',
 *   message: string
 * }
 *
 * 전투 로그 메시지
 * {
 *   type: 'battle',
 *   subtype: 'attack'|'counter'|'kill'|'death'|'heal',
 *   text: string,
 *   value?: number,
 *   gold?: number,
 *   monsterHp?: number,
 *   monsterMaxHp?: number,
 *   playerHp?: number,
 *   playerMaxHp?: number
 * }
 * =============================
 */

// 채팅 명령어 파싱 함수
function parseChatCommand(msg) {
  const trimmed = msg.trim();
  if (trimmed.startsWith('/우리')) {
    return { type: 'invalid', message: '[알림] /우리(파티채팅)는 현재 지원하지 않습니다. [채팅 명령어 안내] /전 : 전체채팅, /지역 또는 /지 : 지역채팅(기본)' };
  }
  if (trimmed.startsWith('/전 ')) {
    return { type: 'global', message: trimmed.replace(/^\/전 /, '') };
  }
  if (trimmed.startsWith('/지역 ')) {
    return { type: 'local', message: trimmed.replace(/^\/지역 /, '') };
  }
  if (trimmed.startsWith('/지 ')) {
    return { type: 'local', message: trimmed.replace(/^\/지 /, '') };
  }
  if (trimmed === '/동') {
    return { type: 'move', dx: 1, dy: 0 };
  }
  if (trimmed === '/서') {
    return { type: 'move', dx: -1, dy: 0 };
  }
  if (trimmed === '/남') {
    return { type: 'move', dx: 0, dy: 1 };
  }
  if (trimmed === '/북') {
    return { type: 'move', dx: 0, dy: -1 };
  }
  // /로 시작하는 명령어는 명령어로 처리
  if (trimmed.startsWith('/')) {
    const [command, ...args] = trimmed.split(' ');
    return { type: 'command', command, args };
  }
  // /나가기 명령어는 여기서 처리하지 않음 (async 필요)
  return { type: 'local', message: trimmed };
}

// respawnMonster 래퍼 함수: getRoom을 항상 첫 인자로 넘겨줌
function respawnMonsterWithDeps(world, x, y) {
  if (world === 6) {
    respawnMonster(
      world, x, y,
      getRoom,
      PYRAMID_MONSTERS, PYRAMID_MONSTERS, PYRAMID_MONSTERS, Monster,
      getPlayersInRoom, sendRoomInfo, 15, { x: 0, y: 0 }, PlayerManager.getAllPlayers()
    );
  } else if (world === 7) {
    respawnMonster(
      world, x, y,
      getRoom,
      PYRAMID2_MONSTERS, PYRAMID2_MONSTERS, PYRAMID2_MONSTERS, Monster,
      getPlayersInRoom, sendRoomInfo, 15, { x: 0, y: 0 }, PlayerManager.getAllPlayers()
    );
  } else if (world === 2) {
    respawnMonster(
      world, x, y,
      getRoom,
      ISLAND_MONSTERS, ISLAND_MONSTERS, ISLAND_MONSTERS, Monster,
      getPlayersInRoom, sendRoomInfo, MAP_SIZE, ISLAND_VILLAGE_POS, PlayerManager.getAllPlayers()
    );
  } else if (world === 3) {
    respawnMonster(
      world, x, y,
      getRoom,
      CAVE_MONSTERS, CAVE_MONSTERS, CAVE_MONSTERS, Monster,
      getPlayersInRoom, sendRoomInfo, MAP_SIZE_CAVE, { x: 0, y: 9 }, PlayerManager.getAllPlayers()
    );
  } else if (world === 4) {
    respawnMonster(
      world, x, y,
      getRoom,
      ISLAND2_MONSTERS, ISLAND2_MONSTERS, ISLAND2_MONSTERS, Monster,
      getPlayersInRoom, sendRoomInfo, MAP_SIZE, ISLAND2_VILLAGE_POS, PlayerManager.getAllPlayers()
    );
  } else if (world === 5) {
    respawnMonster(
      world, x, y,
      getRoom,
      DESERT_MONSTERS, DESERT_MONSTERS, DESERT_MONSTERS, Monster,
      getPlayersInRoom, sendRoomInfo, 7, { x: 3, y: 3 }, PlayerManager.getAllPlayers()
    );
  } else {
    respawnMonster(
      world, x, y,
      getRoom,
      FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS, Monster,
      getPlayersInRoom, sendRoomInfo, MAP_SIZE, VILLAGE_POS, PlayerManager.getAllPlayers()
    );
  }
}

// PlayerData 저장 함수
async function savePlayerData(playerName) {
  // 저장 쿨타임: 5초
  const now = Date.now();
  if (playerSaveCooldown[playerName] && now - playerSaveCooldown[playerName] < 5000) {
    return; // 5초 이내 중복 저장 방지
  }
  playerSaveCooldown[playerName] = now;
  try {
    const pdata = await PlayerData.findOne({ name: playerName });
    if (!pdata) return;
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    pdata.world = player.world;
    pdata.position = player.position;
    pdata.hp = player.hp;
    pdata.maxHp = player.maxHp;
    pdata.mp = player.mp;
    pdata.maxMp = player.maxMp;
    pdata.str = player.str;
    pdata.dex = player.dex;
    pdata.int = player.int;
    pdata.atk = player.atk;
    pdata.def = player.def;
    pdata.gold = player.gold;
    pdata.inventory = player.inventory;
    pdata.strExp = player.strExp;
    pdata.strExpMax = player.strExpMax;
    pdata.dexExp = player.dexExp;
    pdata.dexExpMax = player.dexExpMax;
    pdata.intExp = player.intExp;
    pdata.intExpMax = player.intExpMax;
    pdata.equipWeapon = player.equipWeapon;
    pdata.equipArmor = player.equipArmor;
    pdata.expCandyBuffUntil = player.expCandyBuffUntil;
    pdata.updatedAt = new Date();
    // VersionError 발생 시 최대 3회까지 재시도
    let retries = 0;
    while (retries < 3) {
      try {
        await pdata.save();
        break;
      } catch (err) {
        if (err.name === 'VersionError') {
          retries++;
          if (retries < 3) {
            // 100~300ms 랜덤 딜레이 후 재시도
            await new Promise(res => setTimeout(res, 100 + Math.random() * 200));
            continue;
          } else {
            console.warn('[경고] VersionError 발생, 3회 재시도 후 저장 무시:', err.message);
            break;
          }
        } else {
          throw err;
        }
      }
    }
  } catch (err) {
    if (err.name === 'VersionError') {
      console.warn('[경고] VersionError 발생, 저장 무시:', err.message);
      // 필요시 재시도 로직 추가 가능
    } else {
      console.error('[에러] PlayerData 저장 실패:', err);
    }
  }
}

function savePlayerDataQueued(playerName) {
  if (!playerSaveQueue[playerName]) {
    playerSaveQueue[playerName] = Promise.resolve();
  }
  // 이전 저장이 끝난 뒤에 다음 저장 실행
  playerSaveQueue[playerName] = playerSaveQueue[playerName].then(() => savePlayerData(playerName));
  return playerSaveQueue[playerName];
}

// 서비스 인스턴스 생성 및 의존성 주입
const shopService = new ShopService({
  savePlayerData,
  sendInventory,
  sendCharacterInfo
});
const playerService = new PlayerService({
  savePlayerData,
  sendCharacterInfo,
  sendInventory
});
setupCommands({ shopService, playerService });

// === 글로벌 예외 핸들러 추가 ===
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

async function handleJoin({ ws, data, wss, PlayerManager, RoomManager, PlayerData, Guild, broadcast, sendPlayerList, sendInventory, sendCharacterInfo, sendRoomInfo, MAP_SIZE, VILLAGE_POS, ChatLog, global }) {
  const { name, password } = data;
  if (process.env.DEBUG === 'true') console.log('[서버] join 요청:', { name, password: !!password });
  if (!name || !password) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '닉네임/비번 필요' }));
    ws.close();
    return;
  }
  const user = await User.findOne({ username: name });
  if (!user) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '존재하지 않는 계정' }));
    ws.close();
    return;
  }
  const ok = await require('bcrypt').compare(password, user.password);
  if (!ok) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '비번 불일치' }));
    ws.close();
    return;
  }
  // === 중복접속 방지 및 세션 꼬임 완전 방지 ===
  if (global.activeSockets && global.activeSockets[name]) {
    try {
      global.activeSockets[name].send(JSON.stringify({ type: 'system', subtype: 'error', message: '다른 곳에서 로그인되어 접속이 종료됩니다.' }));
      global.activeSockets[name].close();
    } catch {}
  }
  if (global.activeSockets) delete global.activeSockets[name];
  if (PlayerManager.getPlayer(name)) {
    PlayerManager.removePlayer(name);
  }
  if (global.activeSockets) global.activeSockets[name] = ws;
  // playerName = name; // playerName은 상위 스코프에서 처리 필요
  let pdata = await PlayerData.findOne({ userId: user.id });
  if (!pdata) {
    pdata = await PlayerData.create({
      userId: user.id,
      name: name,
      world: 1,
      position: { x: 4, y: 4 },
      hp: 30, maxHp: 30, mp: 10, maxMp: 10,
      str: 5, dex: 5, int: 5, atk: 3, def: 1, gold: 100,
      inventory: [],
    });
  }
  const player = new Player(name, ws);
  player.world = pdata.world;
  player.position = pdata.position;
  player.hp = pdata.hp;
  player.maxHp = pdata.maxHp;
  player.mp = pdata.mp;
  player.maxMp = pdata.maxMp;
  player.str = pdata.str;
  player.dex = pdata.dex;
  player.int = pdata.int;
  player.atk = pdata.atk;
  player.def = pdata.def;
  player.gold = pdata.gold;
  player.inventory = pdata.inventory;
  player.strExp = pdata.strExp || 0;
  player.strExpMax = pdata.strExpMax || 10;
  player.dexExp = pdata.dexExp || 0;
  player.dexExpMax = pdata.dexExpMax || 10;
  player.intExp = pdata.intExp || 0;
  player.intExpMax = pdata.intExpMax || 10;
  player.equipWeapon = pdata.equipWeapon || null;
  player.equipArmor = pdata.equipArmor || null;
  player.expCandyBuffUntil = pdata.expCandyBuffUntil || null;
  // 길드 정보 동기화
  const guild = await Guild.findOne({ members: name });
  if (guild) {
    player.guildName = guild.name;
  } else {
    player.guildName = undefined;
  }
  PlayerManager.addPlayer(name, player);
  broadcast(wss, { type: 'system', subtype: 'event', message: `${name}님이 입장했습니다.` });
  sendPlayerList(wss, PlayerManager.getAllPlayers());
  RoomManager.addPlayerToRoom(name, player.world, player.position.x, player.position.y);
  sendInventory(PlayerManager.getPlayer(name));
  sendCharacterInfo(PlayerManager.getPlayer(name));
  sendRoomInfo(PlayerManager.getPlayer(name), getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
  // 공지 전송
  if (global.currentNotice) {
    ws.send(JSON.stringify({ type: 'notice', notice: global.currentNotice }));
  }
  // 최근 100개 전체채팅 전송
  const recentChats = await ChatLog.find({ chatType: 'global' }).sort({ time: -1 }).limit(100).lean();
  ws.send(JSON.stringify({ type: 'chatLog', log: recentChats.reverse() }));
  // 길드채팅 로그 전송 (길드 있을 때만)
  if (player.guildName) {
    const guild = await Guild.findOne({ name: player.guildName });
    if (guild && Array.isArray(guild.chatLog)) {
      const guildChats = guild.chatLog.slice(-100);
      ws.send(JSON.stringify({ type: 'guildChatLog', log: guildChats }));
    }
  }
  return name;
}

async function handleChat({ ws, data, playerName, PlayerManager, RoomManager, getRoom, getPlayersInRoom, sendRoomInfo, sendInventory, sendCharacterInfo, sendPlayerList, broadcast, wss, sendRoomInfoToAllInRoom, savePlayerData, commandHandlers, SHOP_ITEMS, MAP_SIZE, VILLAGE_POS, battleIntervals, parseChatCommand, PlayerGameService }) {
  const msg = data.message.trim();
  // 동굴 입장
  if (msg === '/입장') {
    // 무인도 동굴 입구(월드2, 2,6)에서만 동굴로 입장
    if (PlayerManager.getPlayer(playerName).world === 2 && PlayerManager.getPlayer(playerName).position.x === 2 && PlayerManager.getPlayer(playerName).position.y === 6) {
      RoomManager.removePlayerFromRoom(playerName, PlayerManager.getPlayer(playerName).world, PlayerManager.getPlayer(playerName).position.x, PlayerManager.getPlayer(playerName).position.y);
      PlayerManager.getPlayer(playerName).world = 3;
      PlayerManager.getPlayer(playerName).position = { x: 0, y: 0 };
      RoomManager.addPlayerToRoom(playerName, PlayerManager.getPlayer(playerName).world, PlayerManager.getPlayer(playerName).position.x, PlayerManager.getPlayer(playerName).position.y);
      PlayerManager.addPlayer(playerName, PlayerManager.getPlayer(playerName));
      sendRoomInfo(PlayerManager.getPlayer(playerName), getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
      sendInventory(PlayerManager.getPlayer(playerName));
      sendCharacterInfo(PlayerManager.getPlayer(playerName));
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[동굴] 동굴로 입장합니다!' }));
      return;
    }
    // 사막 피라미드 입구(월드5, 5,2)에서 피라미드 내부로 입장
    if (PlayerManager.getPlayer(playerName).world === 5 && PlayerManager.getPlayer(playerName).position.x === 5 && PlayerManager.getPlayer(playerName).position.y === 2) {
      await PlayerGameService.handleEnterPyramid({ ws, playerName, getRoom, getPlayersInRoom, RoomManager, sendRoomInfo, sendInventory, sendCharacterInfo });
      return;
    }
    // 피라미드1→피라미드2 입구(월드6, 5,2)
    if (PlayerManager.getPlayer(playerName).world === 6 && PlayerManager.getPlayer(playerName).position.x === 5 && PlayerManager.getPlayer(playerName).position.y === 2) {
      RoomManager.removePlayerFromRoom(playerName, 6, 5, 2);
      PlayerManager.getPlayer(playerName).world = 7;
      PlayerManager.getPlayer(playerName).position = { x: 0, y: 0 };
      RoomManager.addPlayerToRoom(playerName, 7, 0, 0);
      PlayerManager.addPlayer(playerName, PlayerManager.getPlayer(playerName));
      sendRoomInfo(PlayerManager.getPlayer(playerName), getRoom, getPlayersInRoom, 7, { x: 0, y: 0 });
      sendInventory(PlayerManager.getPlayer(playerName));
      sendCharacterInfo(PlayerManager.getPlayer(playerName));
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[피라미드2] 더 깊은 피라미드로 입장합니다!' }));
      return;
    }
    // 피라미드2→피라미드1 입구(월드7, 0,0)
    if (PlayerManager.getPlayer(playerName).world === 7 && PlayerManager.getPlayer(playerName).position.x === 0 && PlayerManager.getPlayer(playerName).position.y === 0) {
      RoomManager.removePlayerFromRoom(playerName, 7, 0, 0);
      PlayerManager.getPlayer(playerName).world = 6;
      PlayerManager.getPlayer(playerName).position = { x: 5, y: 2 };
      RoomManager.addPlayerToRoom(playerName, 6, 5, 2);
      PlayerManager.addPlayer(playerName, PlayerManager.getPlayer(playerName));
      sendRoomInfo(PlayerManager.getPlayer(playerName), getRoom, getPlayersInRoom, 6, { x: 5, y: 2 });
      sendInventory(PlayerManager.getPlayer(playerName));
      sendCharacterInfo(PlayerManager.getPlayer(playerName));
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[피라미드1] 피라미드1로 돌아갑니다.' }));
      return;
    }
    else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[동굴/피라미드] 입구에서만 입장할 수 있습니다.' }));
      return;
    }
  }
  // 동굴 나가기
  if (msg === '/나가기') {
    // 동굴 사다리방(월드3, 0,9)에서만 무인도 동굴 입구로 나감
    if (PlayerManager.getPlayer(playerName).world === 3 && PlayerManager.getPlayer(playerName).position.x === 0 && PlayerManager.getPlayer(playerName).position.y === 9) {
      RoomManager.removePlayerFromRoom(playerName, PlayerManager.getPlayer(playerName).world, PlayerManager.getPlayer(playerName).position.x, PlayerManager.getPlayer(playerName).position.y);
      PlayerManager.getPlayer(playerName).world = 2;
      PlayerManager.getPlayer(playerName).position = { x: 2, y: 6 };
      RoomManager.addPlayerToRoom(playerName, PlayerManager.getPlayer(playerName).world, PlayerManager.getPlayer(playerName).position.x, PlayerManager.getPlayer(playerName).position.y);
      PlayerManager.addPlayer(playerName, PlayerManager.getPlayer(playerName));
      sendRoomInfo(PlayerManager.getPlayer(playerName), getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
      sendInventory(PlayerManager.getPlayer(playerName));
      sendCharacterInfo(PlayerManager.getPlayer(playerName));
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[동굴] 무인도 동굴 입구로 나갑니다!' }));
      return;
    }
    // 피라미드 내부 출구(월드6, 0,0)에서 사막(5,2)로 나감
    if (PlayerManager.getPlayer(playerName).world === 6 && PlayerManager.getPlayer(playerName).position.x === 0 && PlayerManager.getPlayer(playerName).position.y === 0) {
      await PlayerGameService.handleExitPyramid({ ws, playerName, getRoom, getPlayersInRoom, RoomManager, sendRoomInfo, sendInventory, sendCharacterInfo });
      return;
    }
    // 피라미드2(월드7, 0,0)에서 피라미드1(월드6, 5,2)로 나감
    if (PlayerManager.getPlayer(playerName).world === 7 && PlayerManager.getPlayer(playerName).position.x === 0 && PlayerManager.getPlayer(playerName).position.y === 0) {
      RoomManager.removePlayerFromRoom(playerName, 7, 0, 0);
      PlayerManager.getPlayer(playerName).world = 6;
      PlayerManager.getPlayer(playerName).position = { x: 5, y: 2 };
      RoomManager.addPlayerToRoom(playerName, 6, 5, 2);
      PlayerManager.addPlayer(playerName, PlayerManager.getPlayer(playerName));
      sendRoomInfo(PlayerManager.getPlayer(playerName), getRoom, getPlayersInRoom, 6, { x: 5, y: 2 });
      sendInventory(PlayerManager.getPlayer(playerName));
      sendCharacterInfo(PlayerManager.getPlayer(playerName));
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[피라미드1] 피라미드1로 돌아갑니다.' }));
      return;
    }
    else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[동굴/피라미드] 출구에서만 나갈 수 있습니다.' }));
      return;
    }
  }
  // 나머지 채팅/명령어/이동은 PlayerGameService로 위임
  await PlayerGameService.handleChat({
    ws,
    playerName,
    message: data.message,
    PlayerManager,
    broadcast,
    wss,
    getRoom,
    getPlayersInRoom,
    sendPlayerList,
    sendRoomInfoToAllInRoom,
    savePlayerData,
    sendInventory,
    sendCharacterInfo,
    commandHandlers,
    SHOP_ITEMS,
    MAP_SIZE,
    VILLAGE_POS,
    battleIntervals,
    parseChatCommand
  });
}

async function handleMove({ ws, data, playerName, PlayerManager, RoomManager, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, MAP_SIZE, VILLAGE_POS, battleIntervals, PlayerGameService }) {
  const player = PlayerManager.getPlayer(playerName);
  if (!player) {
    ws.send(JSON.stringify({ type: 'error', message: '플레이어 정보를 찾을 수 없습니다. 다시 로그인 해주세요.' }));
    return;
  }
  await PlayerGameService.handleMove({
    ws,
    playerName,
    dx: data.x - player.position.x,
    dy: data.y - player.position.y,
    PlayerManager,
    RoomManager,
    getRoom,
    getPlayersInRoom,
    sendRoomInfoToAllInRoom,
    savePlayerData,
    sendInventory,
    sendCharacterInfo,
    MAP_SIZE,
    VILLAGE_POS,
    battleIntervals
  });
}

async function handlePickup({ ws, data, playerName, PlayerManager, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, MAP_SIZE, VILLAGE_POS, PlayerGameService }) {
  const player = PlayerManager.getPlayer(playerName);
  if (!player) {
    ws.send(JSON.stringify({ type: 'error', message: '플레이어 정보를 찾을 수 없습니다. 다시 로그인 해주세요.' }));
    return;
  }
  await PlayerGameService.handlePickup({
    ws,
    playerName,
    itemId: data.itemId,
    PlayerManager,
    getRoom,
    getPlayersInRoom,
    sendRoomInfoToAllInRoom,
    savePlayerData,
    sendInventory,
    sendCharacterInfo,
    MAP_SIZE,
    VILLAGE_POS
  });
}

async function handleAttack({ ws, data, playerName, PlayerManager, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendCharacterInfo, broadcast, processBattle, respawnMonsterWithDeps, MAP_SIZE, VILLAGE_POS, PlayerGameService }) {
  const player = PlayerManager.getPlayer(playerName);
  if (!player) {
    ws.send(JSON.stringify({ type: 'error', message: '플레이어 정보를 찾을 수 없습니다. 다시 로그인 해주세요.' }));
    return;
  }
  await PlayerGameService.handleAttack({
    ws,
    playerName,
    monsterId: data.monsterId,
    PlayerManager,
    getRoom,
    getPlayersInRoom,
    sendRoomInfoToAllInRoom,
    savePlayerData,
    sendCharacterInfo,
    broadcast,
    processBattle,
    respawnMonsterWithDeps,
    MAP_SIZE,
    VILLAGE_POS
  });
}

async function handleAutoBattle({ ws, data, playerName, PlayerManager, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, broadcast, processBattle, respawnMonsterWithDeps, battleIntervals, MAP_SIZE, VILLAGE_POS, PlayerGameService }) {
  const player = PlayerManager.getPlayer(playerName);
  if (!player) {
    ws.send(JSON.stringify({ type: 'error', message: '플레이어 정보를 찾을 수 없습니다. 다시 로그인 해주세요.' }));
    return;
  }
  await PlayerGameService.handleAutoBattle({
    ws,
    playerName,
    monsterId: data.monsterId,
    PlayerManager,
    getRoom,
    getPlayersInRoom,
    sendRoomInfoToAllInRoom,
    savePlayerData,
    sendInventory,
    sendCharacterInfo,
    broadcast,
    processBattle,
    respawnMonsterWithDeps,
    battleIntervals,
    MAP_SIZE,
    VILLAGE_POS
  });
}

async function handleStat({ ws, playerName, PlayerManager, PlayerGameService }) {
  const player = PlayerManager.getPlayer(playerName);
  if (!player) {
    ws.send(JSON.stringify({ type: 'error', message: '플레이어 정보를 찾을 수 없습니다. 다시 로그인 해주세요.' }));
    return;
  }
  await PlayerGameService.handleStat({ ws, playerName, PlayerManager });
}

async function handleEquipInfo({ ws, playerName, PlayerManager, PlayerGameService }) {
  const player = PlayerManager.getPlayer(playerName);
  if (!player) {
    ws.send(JSON.stringify({ type: 'error', message: '플레이어 정보를 찾을 수 없습니다. 다시 로그인 해주세요.' }));
    return;
  }
  await PlayerGameService.handleEquipInfo({ ws, playerName, PlayerManager });
}

async function handleShop({ ws, playerName, PlayerManager, getRoom, SHOP_ITEMS, MAP_SIZE, VILLAGE_POS, PlayerGameService }) {
  const player = PlayerManager.getPlayer(playerName);
  if (!player) {
    ws.send(JSON.stringify({ type: 'error', message: '플레이어 정보를 찾을 수 없습니다. 다시 로그인 해주세요.' }));
    return;
  }
  await PlayerGameService.handleShop({ ws, playerName, PlayerManager, getRoom, SHOP_ITEMS, MAP_SIZE, VILLAGE_POS });
}

async function handleClose({ ws, playerName, PlayerManager, wss, sendPlayerList, broadcast, sendRoomInfoToAllInRoom, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, PlayerGameService }) {
  const player = PlayerManager.getPlayer(playerName);
  if (!player) {
    ws.send(JSON.stringify({ type: 'error', message: '플레이어 정보를 찾을 수 없습니다. 다시 로그인 해주세요.' }));
    return;
  }
  await PlayerGameService.handleClose({ ws, playerName, PlayerManager, wss, sendPlayerList, broadcast, sendRoomInfoToAllInRoom, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS });
}

wss.on('connection', async (ws, req) => {
  // --- IP 차단 체크 추가 시작 ---
  let ip = req?.headers['x-forwarded-for']?.split(',')[0]?.trim() || ws._socket?.remoteAddress;
  if (ip && ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
  try {
    const BannedIp = require('./models/BannedIp');
    const bannedIp = await BannedIp.findOne({ ip });
    if (bannedIp) {
      ws.close();
      return;
    }
  } catch (e) {
    console.error('[WebSocket 차단 체크 에러]', e);
  }
  // --- IP 차단 체크 추가 끝 ---

  // --- 반복 재접속(테러) 방지: 동일 User-Agent+쿠키 조합 1분 내 5회 이상 접속 시 차단 ---
  const userAgent = req.headers['user-agent'] || '';
  const cookie = req.headers['cookie'] || '';
  global.recentConnections = global.recentConnections || [];
  const now = Date.now();
  // 1분 내 기록만 유지
  global.recentConnections = global.recentConnections.filter(c => now - c.time < 60000);
  const same = global.recentConnections.filter(c => c.userAgent === userAgent && c.cookie === cookie);
  if (same.length >= 5) {
    ws.close();
    return;
  }
  global.recentConnections.push({ userAgent, cookie, time: now });
  // --- 반복 재접속 방지 끝 ---

  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  let playerName = '';

  ws.on('message', async (message) => {
    try {
      let data;
      try {
        data = JSON.parse(message);
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        return;
      }

      if (data.type === 'join') {
        const joinedName = await handleJoin({ ws, data, wss, PlayerManager, RoomManager, PlayerData, Guild, broadcast, sendPlayerList, sendInventory, sendCharacterInfo, sendRoomInfo, MAP_SIZE, VILLAGE_POS, ChatLog, global });
        if (joinedName) playerName = joinedName;
        return;
      }
      if (data.type === 'chat') {
        await handleChat({ ws, data, playerName, PlayerManager, RoomManager, getRoom, getPlayersInRoom, sendRoomInfo, sendInventory, sendCharacterInfo, sendPlayerList, broadcast, wss, sendRoomInfoToAllInRoom, savePlayerData, commandHandlers, SHOP_ITEMS, MAP_SIZE, VILLAGE_POS, battleIntervals, parseChatCommand, PlayerGameService });
        return;
      }
      if (data.type === 'move') {
        await handleMove({ ws, data, playerName, PlayerManager, RoomManager, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, MAP_SIZE, VILLAGE_POS, battleIntervals, PlayerGameService });
        return;
      }
      if (data.type === 'pickup') {
        await handlePickup({ ws, data, playerName, PlayerManager, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, MAP_SIZE, VILLAGE_POS, PlayerGameService });
        return;
      }
      if (data.type === 'attack') {
        await handleAttack({ ws, data, playerName, PlayerManager, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendCharacterInfo, broadcast, processBattle, respawnMonsterWithDeps, MAP_SIZE, VILLAGE_POS, PlayerGameService });
        return;
      }
      if (data.type === 'autobattle') {
        await handleAutoBattle({ ws, data, playerName, PlayerManager, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, broadcast, processBattle, respawnMonsterWithDeps, battleIntervals, MAP_SIZE, VILLAGE_POS, PlayerGameService });
        return;
      }
      if (data.type === 'stat') {
        await handleStat({ ws, playerName, PlayerManager, PlayerGameService });
        return;
      }
      if (data.type === 'equipinfo') {
        await handleEquipInfo({ ws, playerName, PlayerManager, PlayerGameService });
        return;
      }
      if (data.type === 'shop') {
        await handleShop({ ws, playerName, PlayerManager, getRoom, SHOP_ITEMS, MAP_SIZE, VILLAGE_POS, PlayerGameService });
        return;
      }
      if (data.type === 'close') {
        await handleClose({ ws, playerName, PlayerManager, wss, sendPlayerList, broadcast, sendRoomInfoToAllInRoom, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, PlayerGameService });
        return;
      }
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }
      ws.send(JSON.stringify({ type: 'error', message: '알 수 없는 메시지 타입입니다.' }));
    } catch (err) {
      console.error('[WebSocket 에러]', err);
      ws.send(JSON.stringify({ type: 'error', message: '서버 내부 오류가 발생했습니다.' }));
    }
  });

  ws.on('close', () => {
    if (activeSockets[playerName] === ws) {
      delete activeSockets[playerName];
    }
    const player = PlayerManager.getPlayer(playerName);
    if (player) {
      const prevWorld = player.world;
      const prevX = player.position.x;
      const prevY = player.position.y;
      PlayerManager.removePlayer(playerName);
      sendPlayerList(wss, PlayerManager.getAllPlayers());
      broadcast(wss, { type: 'system', subtype: 'event', message: `${playerName}님이 퇴장했습니다.` });
      sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), prevWorld, prevX, prevY, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
    }
    if (battleIntervals[playerName]) {
      clearInterval(battleIntervals[playerName]);
      delete battleIntervals[playerName];
    }
  });
});

// 40초마다 전체 플레이어 자동저장
setInterval(() => {
  Object.keys(PlayerManager.getAllPlayers()).forEach(playerName => {
    savePlayerDataQueued(playerName).catch(() => {}); // 예외 무시
  });
}, 40000); // 40초마다

// 4초마다 클랜힐 효과 적용
setInterval(() => {
  clanHealTick(PlayerManager, Guild);
}, 4000);

// === 경험치 이벤트 자동 스케줄러 (테스트: 목요일 18:55~18:58) ===
function getKoreaTime() {
  // 한국 시간(UTC+9) Date 객체 반환
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

setInterval(() => {
  const now = getKoreaTime();
  const day = now.getUTCDay(); // 0:일, 1:월, ..., 4:목, 5:금, 6:토
  const hour = now.getUTCHours();
  const min = now.getUTCMinutes();

  // 토요일 09:00 ~ 일요일 21:00
  const eventStart = (day === 6 && (hour > 9 || (hour === 9 && min >= 0))) || (day === 0 && (hour < 21 || (hour === 21 && min === 0)));
  const eventActive = (day === 6 && (hour > 9 || (hour === 9 && min >= 0))) || (day === 0 && (hour < 21 || (hour === 21 && min === 0)));
  // 실제로는 토요일 09:00부터 일요일 21:00까지
  // day === 6(토) 09:00~24:00, day === 0(일) 00:00~21:00
  const isEventTime = (day === 6 && (hour > 9 || (hour === 9 && min >= 0))) || (day === 0 && (hour < 21 || (hour === 21 && min === 0)));

  if (isEventTime) {
    if (!global.expDoubleEvent) {
      global.expDoubleEvent = true;
      global.EVENT_EXP_BONUS = 1.2;
      if (typeof global.wss !== 'undefined') {
        broadcast(global.wss, { type: 'notice', notice: '[자동] 경험치 1.2배 이벤트가 시작되었습니다! (토 09:00 ~ 일 21:00)' });
        Object.values(PlayerManager.getAllPlayers()).forEach(p => sendCharacterInfo(p));
      }
      console.log('[경험치이벤트] 자동 시작 (토 09:00 ~ 일 21:00)');
    }
  } else {
    if (global.expDoubleEvent) {
      global.expDoubleEvent = false;
      global.EVENT_EXP_BONUS = undefined;
      if (typeof global.wss !== 'undefined') {
        Object.values(PlayerManager.getAllPlayers()).forEach(p => sendCharacterInfo(p));
      }
      console.log('[경험치이벤트] 자동 종료 (토 09:00 ~ 일 21:00)');
    }
  }
}, 5000); // 5초마다 체크

pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  });
}, PING_INTERVAL);

wss.on('close', () => {
  if (pingInterval) clearInterval(pingInterval);
});

if (require.main === module) {
  global.wss = wss;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = {
  app,
  server,
  wss,
  parseChatCommand,
  savePlayerData: savePlayerDataQueued,
  respawnMonsterWithDeps,
  // ... 기존 내보내는 것들 ...
};