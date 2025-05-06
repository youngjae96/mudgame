const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const Player = require('./models/Player');
const { ITEM_POOL, FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS, SHOP_ITEMS } = require('./data/items');
const { MAP_SIZE, VILLAGE_POS, rooms, getRoom } = require('./data/map');
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
const authRouter = require('./routes/auth');
const jwt = require('jsonwebtoken');
const SECRET = 'your_jwt_secret';
const PlayerData = require('./models/PlayerData');
const User = require('./models/User');
const {
  handleBuyCommand,
  handleSellCommand,
  handleEquipCommand,
  handleUnequipCommand,
  handleTeleportCommand,
  handleInnCommand,
  handleAdminCommand,
  handleGuildCommand,
  handleWhoCommand,
  handleHelpCommand,
  handleShopCommand,
  handleShopSellCommand,
} = require('./commands');
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const playerRouter = require('./routes/player');
const shopRouter = require('./routes/shop');
const battleRouter = require('./routes/battle');
const docsRouter = require('./routes/docs');
const PlayerManager = require('./playerManager');
const RoomManager = require('./roomManager');
const ShopService = require('./services/ShopService');
const PlayerService = require('./services/PlayerService');
const { setupCommands } = require('./commands');
const PlayerGameService = require('./services/PlayerGameService');

const app = express();
app.use(cors());
app.use(express.json());
app.use(logger);
app.use('/api/auth', authRouter);
app.use('/api/player', playerRouter);
app.use('/api/shop', shopRouter);
app.use('/api/battle', battleRouter);
app.use('/api/docs', docsRouter);
app.use(errorHandler);
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 4000;

let battleIntervals = {};

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
    return { type: 'invalid', message: '[알림] /우리(파티채팅)는 현재 지원하지 않습니다. [채팅 명령어 안내] /전체 또는 /전 : 전체채팅, /지역 또는 /지 : 지역채팅(기본)' };
  }
  if (trimmed.startsWith('/전체 ')) {
    return { type: 'global', message: trimmed.replace(/^\/전체 /, '') };
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
  respawnMonster(
    world, x, y,
    getRoom,
    FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS, Monster,
    getPlayersInRoom, sendRoomInfo, MAP_SIZE, VILLAGE_POS, PlayerManager.getAllPlayers()
  );
}

// PlayerData 저장 함수
async function savePlayerData(playerName) {
  const player = PlayerManager.getPlayer(playerName);
  if (!player) return;
  try {
    const pdata = await PlayerData.findOne({ name: playerName });
    if (!pdata) return;
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
    pdata.updatedAt = new Date();
    await pdata.save();
  } catch (err) {
    if (err.name === 'VersionError') {
      console.warn('[경고] VersionError 발생, 저장 무시:', err.message);
      // 필요시 재시도 로직 추가 가능
    } else {
      console.error('[에러] PlayerData 저장 실패:', err);
    }
  }
}

// 명령어-핸들러 매핑 객체
const commandHandlers = {
  '/구매': handleBuyCommand,
  '/판매': handleSellCommand,
  '/상점': handleShopCommand,
  '/상점판매': handleShopSellCommand,
  '/장착': handleEquipCommand,
  '/해제': handleUnequipCommand,
  '/텔포': handleTeleportCommand,
  '/여관': handleInnCommand,
  '/운영자': (args) => handleAdminCommand({ ...args, savePlayerData }),
  '/길드': (args) => handleGuildCommand(args),
  '/누구': (args) => handleWhoCommand(args),
  '/도움말': (args) => handleHelpCommand(args),
};

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

wss.on('connection', (ws) => {
  let playerName = '';

  ws.on('message', async (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      return;
    }

    if (data.type === 'join') {
      const { name, token } = data;
      if (process.env.DEBUG === 'true') console.log('[서버] join 요청:', { name, token });
      if (!token) {
        if (process.env.DEBUG === 'true') console.log('[서버] 인증 토큰 없음');
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '인증 토큰이 필요합니다.' }));
        ws.close();
        return;
      }
      let decoded;
      try {
        decoded = jwt.verify(token, SECRET);
        if (decoded.username !== name) {
          if (process.env.DEBUG === 'true') console.log('[서버] 토큰 username 불일치', decoded.username, name);
          ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '토큰 정보가 일치하지 않습니다.' }));
          ws.close();
          return;
        }
      } catch (e) {
        if (process.env.DEBUG === 'true') console.log('[서버] 유효하지 않은 토큰', e);
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '유효하지 않은 토큰입니다.' }));
        ws.close();
        return;
      }
      playerName = name;
      (async () => {
        let pdata = await PlayerData.findOne({ userId: decoded.userId });
        if (!pdata) {
          if (process.env.DEBUG === 'true') console.log('[서버] PlayerData 없음, 새로 생성', decoded.userId, playerName);
          pdata = await PlayerData.create({
            userId: decoded.userId,
            name: playerName,
            world: 1,
            position: { x: 4, y: 4 },
            hp: 30, maxHp: 30, mp: 10, maxMp: 10,
            str: 5, dex: 5, int: 5, atk: 3, def: 1, gold: 100,
            inventory: [],
          });
        } else {
          if (process.env.DEBUG === 'true') console.log('[서버] PlayerData 불러옴', pdata);
        }
        const player = new Player(playerName, ws);
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
        PlayerManager.addPlayer(playerName, player);
        broadcast(wss, { type: 'system', subtype: 'event', message: `${playerName}님이 입장했습니다.` });
        sendPlayerList(wss, PlayerManager.getAllPlayers());
        RoomManager.addPlayerToRoom(playerName, player.world, player.position.x, player.position.y);
        sendInventory(PlayerManager.getPlayer(playerName));
        sendCharacterInfo(PlayerManager.getPlayer(playerName));
        // 입장 시 방 정보도 전송 (room 정보가 클라이언트에 안 떠서 추가)
        sendRoomInfo(PlayerManager.getPlayer(playerName), getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
      })();
    } else if (data.type === 'chat') {
      // 운영자 명령어, /입장, /나가기 등은 기존 분기 유지
      const player = PlayerManager.getPlayer(playerName);
      if (!player) return;
      const msg = data.message.trim();
      // 동굴 입장
      if (msg === '/입장') {
        // 무인도 동굴 입구(월드2, 2,6)에서만 동굴로 입장
        if (player.world === 2 && player.position.x === 2 && player.position.y === 6) {
          RoomManager.removePlayerFromRoom(playerName, player.world, player.position.x, player.position.y);
          player.world = 3;
          player.position = { x: 0, y: 0 };
          RoomManager.addPlayerToRoom(playerName, player.world, player.position.x, player.position.y);
          PlayerManager.addPlayer(playerName, player);
          sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
          sendInventory(player);
          sendCharacterInfo(player);
          ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[동굴] 동굴로 입장합니다!' }));
        } else {
          ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[동굴] 무인도 동굴 입구(2,6)에서만 입장할 수 있습니다.' }));
        }
        return;
      }
      // 동굴 나가기
      if (msg === '/나가기') {
        // 동굴 사다리방(월드3, 0,9)에서만 무인도 동굴 입구로 나감
        if (player.world === 3 && player.position.x === 0 && player.position.y === 9) {
          RoomManager.removePlayerFromRoom(playerName, player.world, player.position.x, player.position.y);
          player.world = 2;
          player.position = { x: 2, y: 6 };
          RoomManager.addPlayerToRoom(playerName, player.world, player.position.x, player.position.y);
          PlayerManager.addPlayer(playerName, player);
          sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
          sendInventory(player);
          sendCharacterInfo(player);
          ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[동굴] 무인도 동굴 입구로 나갑니다!' }));
        } else {
          ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[동굴] 동굴 사다리방(0,9)에서만 나갈 수 있습니다.' }));
        }
        return;
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
      return;
    }
    if (data.type === 'move') {
      await PlayerGameService.handleMove({
        ws,
        playerName,
        dx: data.x - PlayerManager.getPlayer(playerName).position.x,
        dy: data.y - PlayerManager.getPlayer(playerName).position.y,
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
      return;
    }
    if (data.type === 'pickup') {
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
      return;
    }
    if (data.type === 'attack') {
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
      return;
    }
    if (data.type === 'autobattle') {
      await PlayerGameService.handleAutoBattle({
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
        battleIntervals,
        MAP_SIZE,
        VILLAGE_POS
      });
      return;
    }
    if (data.type === 'stat') {
      await PlayerGameService.handleStat({ ws, playerName, PlayerManager });
    } else if (data.type === 'equipinfo') {
      await PlayerGameService.handleEquipInfo({ ws, playerName, PlayerManager });
    } else if (data.type === 'shop') {
      await PlayerGameService.handleShop({ ws, playerName, PlayerManager, getRoom, SHOP_ITEMS, MAP_SIZE, VILLAGE_POS });
    } else if (data.type === 'close') {
      await PlayerGameService.handleClose({ ws, playerName, PlayerManager, wss, sendPlayerList, broadcast, sendRoomInfoToAllInRoom, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS });
      return;
    }
  });

  ws.on('close', () => {
    // WebSocket 연결이 끊겼을 때도 동일하게 처리
    if (playerName && PlayerManager.getPlayer(playerName)) {
      const prevWorld = PlayerManager.getPlayer(playerName).world;
      const prevX = PlayerManager.getPlayer(playerName).position.x;
      const prevY = PlayerManager.getPlayer(playerName).position.y;
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
    savePlayerData(playerName).catch(() => {}); // 예외 무시
  });
}, 40000); // 40초마다

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
  savePlayerData,
  respawnMonsterWithDeps,
  // ... 기존 내보내는 것들 ...
};