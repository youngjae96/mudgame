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
  handleTeleportCommand
} = require('./commands');
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const playerRouter = require('./routes/player');
const shopRouter = require('./routes/shop');
const battleRouter = require('./routes/battle');
const docsRouter = require('./routes/docs');

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

let players = {};
let battleIntervals = {};

function getPlayersInRoom(x, y) {
  return Object.values(players)
    .filter((p) => p.position && p.position.x === x && p.position.y === y)
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
  return { type: 'local', message: trimmed };
}

// respawnMonster 래퍼 함수: getRoom을 항상 첫 인자로 넘겨줌
function respawnMonsterWithDeps(world, x, y) {
  respawnMonster(
    world, x, y,
    getRoom,
    FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS, Monster,
    getPlayersInRoom, sendRoomInfo, MAP_SIZE, VILLAGE_POS, players
  );
}

// PlayerData 저장 함수
async function savePlayerData(playerName) {
  const player = players[playerName];
  if (!player) return;
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
}

// 명령어-핸들러 매핑 객체
const commandHandlers = {
  '/구매': handleBuyCommand,
  '/판매': handleSellCommand,
  '/장착': handleEquipCommand,
  '/해제': handleUnequipCommand,
  '/텔포': handleTeleportCommand,
};

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
      console.log('[서버] join 요청:', { name, token });
      if (!token) {
        console.log('[서버] 인증 토큰 없음');
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '인증 토큰이 필요합니다.' }));
        ws.close();
        return;
      }
      let decoded;
      try {
        decoded = jwt.verify(token, SECRET);
        if (decoded.username !== name) {
          console.log('[서버] 토큰 username 불일치', decoded.username, name);
          ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '토큰 정보가 일치하지 않습니다.' }));
          ws.close();
          return;
        }
      } catch (e) {
        console.log('[서버] 유효하지 않은 토큰', e);
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '유효하지 않은 토큰입니다.' }));
        ws.close();
        return;
      }
      playerName = name;
      (async () => {
        let pdata = await PlayerData.findOne({ userId: decoded.userId });
        if (!pdata) {
          console.log('[서버] PlayerData 없음, 새로 생성', decoded.userId, playerName);
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
          console.log('[서버] PlayerData 불러옴', pdata);
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
        players[playerName] = player;
        broadcast(wss, { type: 'system', subtype: 'event', message: `${playerName}님이 입장했습니다.` });
        sendPlayerList(wss, players);
        sendRoomInfo(players[playerName], getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
        sendInventory(players[playerName]);
        sendCharacterInfo(players[playerName]);
      })();
    } else if (data.type === 'chat') {
      const trimmed = data.message.trim();
      // 운영자 한글 명령어 처리
      if (trimmed.startsWith('/운영자')) {
        const player = players[playerName];
        if (!player || player.name !== 'admin') {
          ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '운영자만 사용할 수 있는 명령어입니다.' }));
          return;
        }
        const [slash, cmd, ...args] = trimmed.split(' ');
        if (cmd === '아이템지급') {
          const [targetName, itemName, countStr] = args;
          const count = parseInt(countStr) || 1;
          const target = players[targetName];
          if (!target) {
            ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 대상 유저를 찾을 수 없습니다.` }));
            return;
          }
          let found = null;
          for (const arr of Object.values(SHOP_ITEMS)) {
            found = arr.find(i => i.name === itemName);
            if (found) break;
          }
          if (!found) {
            ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 해당 아이템을 찾을 수 없습니다.` }));
            return;
          }
          for (let i = 0; i < count; i++) {
            target.inventory.push({ ...found });
          }
          ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `[운영자] ${targetName}에게 ${itemName} ${count}개를 지급했습니다.` }));
          if (target.ws) {
            target.ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `[운영자] ${itemName} ${count}개를 지급받았습니다.` }));
          }
          await savePlayerData(targetName);
          return;
        } else if (cmd === '골드지급') {
          const [targetName, goldStr] = args;
          const gold = parseInt(goldStr) || 0;
          const target = players[targetName];
          if (!target) {
            ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 대상 유저를 찾을 수 없습니다.` }));
            return;
          }
          target.gold += gold;
          ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `[운영자] ${targetName}에게 골드 ${gold}G를 지급했습니다.` }));
          if (target.ws) {
            target.ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `[운영자] 골드 ${gold}G를 지급받았습니다.` }));
          }
          await savePlayerData(targetName);
          return;
        } else if (cmd === '공지') {
          const noticeMsg = args.join(' ');
          broadcast(wss, { type: 'system', subtype: 'event', message: `[공지] ${noticeMsg}` });
          ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[운영자] 공지를 전송했습니다.' }));
          return;
        } else if (cmd === '강퇴') {
          const [targetName] = args;
          const target = players[targetName];
          if (!target || !target.ws) {
            ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 대상 유저를 찾을 수 없습니다.` }));
            return;
          }
          target.ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[운영자] 강퇴되었습니다.' }));
          target.ws.close();
          delete players[targetName];
          broadcast(wss, { type: 'system', subtype: 'event', message: `[운영자] ${targetName}님이 강퇴되었습니다.` });
          ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `[운영자] ${targetName}님을 강퇴했습니다.` }));
          return;
        } else {
          ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 알 수 없는 명령어입니다.' }));
          return;
        }
      }
      const cmd = Object.keys(commandHandlers).find(prefix => trimmed.startsWith(prefix));
      if (cmd) {
        return commandHandlers[cmd]({
          ws,
          playerName,
          message: data.message,
          players,
          getRoom,
          getPlayersInRoom,
          SHOP_ITEMS,
          savePlayerData,
          sendInventory,
          sendCharacterInfo,
          MAP_SIZE,
          VILLAGE_POS,
          sendRoomInfo
        });
      }
      const { type: chatType, message: chatMsg } = parseChatCommand(data.message);
      if (chatType === 'invalid') {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: chatMsg }));
        return;
      }
      if (chatType === 'global') {
        broadcast(wss, { type: 'chat', chatType: 'global', name: playerName, message: chatMsg });
      } else {
        // 지역채팅: 같은 방(좌표) 유저만
        const player = players[playerName];
        if (!player) return;
        const { x, y } = player.position;
        Object.values(players).forEach((p) => {
          if (p.position && p.position.x === x && p.position.y === y) {
            p.ws.send(JSON.stringify({ type: 'chat', chatType: 'local', name: playerName, message: chatMsg }));
          }
        });
      }
    } else if (data.type === 'move') {
      const { x, y } = data;
      if (
        typeof x === 'number' && typeof y === 'number' &&
        x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE
      ) {
        players[playerName].position = { x, y };
        await savePlayerData(playerName);
        sendRoomInfo(players[playerName], getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
        // 자동전투 중단
        if (battleIntervals[playerName]) {
          clearInterval(battleIntervals[playerName]);
          delete battleIntervals[playerName];
          ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '이동하여 자동전투가 중단되었습니다.' }));
        }
      } else {
        ws.send(JSON.stringify({ type: 'error', message: '잘못된 좌표입니다.' }));
      }
    } else if (data.type === 'pickup') {
      const { itemId } = data;
      const player = players[playerName];
      if (!player) return;
      const { x, y } = player.position;
      const room = getRoom(player.world, x, y);
      const idx = room.items.findIndex((item) => item.id === itemId);
      if (idx !== -1) {
        const [item] = room.items.splice(idx, 1);
        player.inventory.push(item);
        await savePlayerData(playerName);
        sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
        sendInventory(player);
        ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `${item.name}을(를) 획득했습니다!` }));
      } else {
        ws.send(JSON.stringify({ type: 'error', message: '해당 아이템이 없습니다.' }));
      }
    } else if (data.type === 'attack') {
      const { monsterId } = data;
      const player = players[playerName];
      if (!player) return;
      const { x, y } = player.position;
      const room = getRoom(player.world, x, y);
      const mIdx = room.monsters.findIndex((m) => m.id === monsterId);
      if (mIdx !== -1) {
        const monster = room.monsters[mIdx];
        // processBattle 호출
        const result = processBattle(player, monster, room, VILLAGE_POS);
        await savePlayerData(playerName);
        // 로그 전송
        if (Array.isArray(result.log)) {
          ws.send(JSON.stringify({ type: 'battle', log: result.log }));
        } else {
          ws.send(JSON.stringify({ type: 'battle', log: [result.log] }));
        }
        // 몬스터 처치 시
        if (result.monsterDead) {
          broadcast(wss, { type: 'system', subtype: 'event', message: `${playerName}님이 ${monster.name}을(를) 처치했습니다!` });
          respawnMonsterWithDeps(player.world, player.position.x, player.position.y);
        } else {
          // 플레이어 사망 시
          if (result.playerDead) {
            sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
          }
        }
        sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
        sendCharacterInfo(player);
      } else {
        ws.send(JSON.stringify({ type: 'error', message: '해당 몬스터가 없습니다.' }));
      }
    } else if (data.type === 'stat') {
      const player = players[playerName];
      if (!player) return;
      const statMsg =
        `[능력치]\n` +
        `HP  : ${player.hp} / ${player.maxHp}    MP  : ${player.mp} / ${player.maxMp}\n` +
        `STR : ${player.str} (Exp: ${player.strExp}/${player.strExpMax})   DEX: ${player.dex} (Exp: ${player.dexExp}/${player.dexExpMax})   INT: ${player.int} (Exp: ${player.intExp}/${player.intExpMax})\n` +
        `공격력: ${player.getAtk()}   방어력: ${player.getDef()}`;
      ws.send(JSON.stringify({ type: 'system', subtype: 'info', message: statMsg }));
    } else if (data.type === 'equipinfo') {
      const player = players[playerName];
      if (!player) return;
      let msg = '[장비 정보]\n';
      if (player.equipWeapon) {
        msg += `무기: ${player.equipWeapon.name} (${player.equipWeapon.desc || ''})\n`;
      } else {
        msg += '무기: 없음\n';
      }
      if (player.equipArmor) {
        msg += `방어구: ${player.equipArmor.name} (${player.equipArmor.desc || ''})\n`;
      } else {
        msg += '방어구: 없음\n';
      }
      ws.send(JSON.stringify({ type: 'system', subtype: 'info', message: msg }));
    } else if (data.type === 'shop') {
      const player = players[playerName];
      if (!player) return;
      const { x, y } = player.position;
      const room = getRoom(player.world, x, y);
      if (room.type !== 'village') {
        ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '상점은 마을에서만 이용할 수 있습니다.' }));
        return;
      }
      let msg = '[상점 목록]\n────────────────────\n';
      for (const cat of Object.keys(SHOP_ITEMS)) {
        msg += `[${cat}]\n`;
        SHOP_ITEMS[cat].forEach((item) => {
          let statStr = '';
          if (item.atk) statStr += ` 공격력+${item.atk}`;
          if (item.def) statStr += ` 방어력+${item.def}`;
          if (item.str) statStr += ` 힘+${item.str}`;
          if (item.dex) statStr += ` 민첩+${item.dex}`;
          if (item.perUse && item.total) statStr += ` 1회 ${item.perUse} 회복 / 총 ${item.total}`;
          statStr = statStr.trim();
          msg += `  • ${item.name.padEnd(8, ' ')} ${String(item.price).padEnd(5, ' ')}G  - ${item.desc}`;
          if (statStr) msg += ` [${statStr}]`;
          msg += '\n';
        });
        msg += '────────────────────\n';
      }
      msg += '구매: /구매 아이템명 (예: /구매 나무검)';
      msg += '\n판매: /판매 아이템명 (예: /판매 나무검)';
      ws.send(JSON.stringify({ type: 'system', subtype: 'info', message: msg }));
    } else if (data.type === 'inn') {
      // ... 이하 기존 코드 계속 ...
    } else if (data.type === 'close') {
      // ... 이하 기존 코드 계속 ...
    } else if (data.type === 'autobattle') {
      const { monsterId } = data;
      const player = players[playerName];
      if (!player) return;
      const { x, y } = player.position;
      const room = getRoom(player.world, x, y);
      const mIdx = room.monsters.findIndex((m) => m.id === monsterId);
      if (mIdx === -1) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '해당 몬스터가 없습니다.' }));
        return;
      }
      // 이미 자동전투 중이면 중복 실행 방지
      if (battleIntervals[playerName]) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '이미 자동전투 중입니다.' }));
        return;
      }
      battleIntervals[playerName] = setInterval(async () => {
        const curRoom = getRoom(player.world, player.position.x, player.position.y);
        const curIdx = curRoom.monsters.findIndex((m) => m.id === monsterId);
        if (curRoom !== room || curIdx === -1) {
          clearInterval(battleIntervals[playerName]);
          delete battleIntervals[playerName];
          ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '자동전투가 중단되었습니다.' }));
          return;
        }
        const monster = curRoom.monsters[curIdx];
        const result = processBattle(player, monster, curRoom, VILLAGE_POS);
        await savePlayerData(playerName);
        sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS); // 실시간 room 정보 전송
        if (Array.isArray(result.log)) {
          ws.send(JSON.stringify({ type: 'battle', log: result.log }));
        } else {
          ws.send(JSON.stringify({ type: 'battle', log: [result.log] }));
        }
        if (result.monsterDead || result.playerDead) {
          clearInterval(battleIntervals[playerName]);
          delete battleIntervals[playerName];
          if (result.monsterDead) {
            broadcast(wss, { type: 'system', subtype: 'event', message: `${playerName}님이 ${monster.name}을(를) 처치했습니다!` });
            respawnMonsterWithDeps(player.world, player.position.x, player.position.y);
          }
          if (result.playerDead) {
            sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
          }
          sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
          sendCharacterInfo(player);
        }
      }, 1200);
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '자동전투를 시작합니다!' }));
    }
  });

  ws.on('close', () => {
    // ... 이하 기존 코드 계속 ...
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});