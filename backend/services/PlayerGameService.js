// PlayerGameService: 게임 내 실시간 플레이어 관련 로직(이동, 채팅, 명령어, 아이템, 전투 등)

const { PlayerManager } = require('../playerManager');
const ChatLog = require('../models/ChatLog');
const { filterBadWords } = require('../utils/filterBadWords');

const PlayerGameService = {
  async handleMove({ ws, playerName, dx, dy, RoomManager, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, MAP_SIZE, VILLAGE_POS, battleIntervals }) {
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    const { x, y } = player.position;
    const nx = x + dx;
    const ny = y + dy;
    let maxSize = MAP_SIZE;
    if (player.world === 3) maxSize = 30;
    if (
      typeof nx === 'number' && typeof ny === 'number' &&
      nx >= 0 && ny >= 0 && nx < maxSize && ny < maxSize
    ) {
      const destRoom = getRoom(player.world, nx, ny);
      if (destRoom && (destRoom.type === 'cave_wall' || destRoom.type === 'pyramid_wall')) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '두꺼운 벽이 길을 막고 있습니다.' }));
        return;
      }
      player.position = { x: nx, y: ny };
      // PlayerData 저장 전 인벤토리 50개 제한
      if (player.inventory && player.inventory.length > 50) {
        player.inventory = player.inventory.slice(-50);
      }
      await savePlayerData(playerName);
      // 본인에게는 안내 메시지 포함
      await require('../utils/broadcast').sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
      // 방 전체에는 안내 없이 갱신만
      await sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
      // [추가] 사냥(자동전투) 중인 플레이어 알림
      const playersInRoom = Object.values(PlayerManager.getAllPlayers()).filter(
        p => p.position && p.position.x === player.position.x && p.position.y === player.position.y && p.world === player.world && p.name !== playerName
      );
      const huntingPlayers = playersInRoom.filter(p => battleIntervals && battleIntervals[p.name]);
      if (huntingPlayers.length > 0) {
        const names = huntingPlayers.map(p => p.name).join(', ');
        ws.send(JSON.stringify({
          type: 'system',
          subtype: 'alert', // 프론트에서 빨간색 처리
          message: `⚠️ 이 방에서 ${names}님이 사냥(자동전투) 중입니다!`
        }));
      }
      if (battleIntervals[playerName]) {
        clearInterval(battleIntervals[playerName]);
        delete battleIntervals[playerName];
        ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '이동하여 자동전투가 중단되었습니다.' }));
      }
      const potionResult = player.autoUsePotion();
      if (potionResult) {
        ws.send(JSON.stringify({
          type: 'system',
          subtype: 'event',
          message: `${potionResult.name}을(를) 자동으로 사용했습니다! (HP +${potionResult.healAmount}, 남은량: ${potionResult.left})`
        }));
        await savePlayerData(playerName);
        sendInventory(player);
        sendCharacterInfo(player);
      }
      // 클랜힐 자동 비활성화
      if (player.clanHealOn) {
        player.clanHealOn = false;
        ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '맵 이동으로 클랜힐이 비활성화되었습니다.' }));
      }
    } else {
      ws.send(JSON.stringify({ type: 'error', message: '잘못된 좌표입니다.' }));
    }
  },
  async handleChat({ ws, playerName, message, broadcast, wss, getRoom, getPlayersInRoom, sendPlayerList, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, commandHandlers, SHOP_ITEMS, MAP_SIZE, VILLAGE_POS, battleIntervals, parseChatCommand }) {
    const trimmed = message.trim();
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    const { type: chatType, message: chatMsg, dx, dy, command, args } = parseChatCommand(message);
    if (chatType === 'invalid') {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: chatMsg }));
      return;
    }
    // 욕설 자동 치환 적용 (한국어만)
    let filteredMsg = chatMsg;
    if (typeof chatMsg === 'string') {
      filteredMsg = filterBadWords(chatMsg);
    }
    if (chatType === 'global') {
      const now = Date.now();
      if (typeof filteredMsg === 'string' && filteredMsg.length > 80) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '전체채팅은 80자까지 입력할 수 있습니다.' }));
        return;
      }
      if (player.lastGlobalChat && now - player.lastGlobalChat < 2000) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '전체채팅은 2초에 한 번만 입력할 수 있습니다.' }));
        return;
      }
      player.lastGlobalChat = now;
      // DB에 저장
      await ChatLog.create({ name: playerName, message: filteredMsg, type: 'chat', chatType: 'global', time: new Date() });
      // 100개 초과 시 오래된 것 삭제
      const count = await ChatLog.countDocuments({ chatType: 'global' });
      if (count > 100) {
        const toDelete = await ChatLog.find({ chatType: 'global' }).sort({ time: 1 }).limit(count - 100).select('_id');
        const ids = toDelete.map(doc => doc._id);
        if (ids.length > 0) {
          await ChatLog.deleteMany({ _id: { $in: ids } });
        }
      }
      broadcast(wss, { type: 'chat', chatType: 'global', name: playerName, message: filteredMsg });
      return;
    }
    if (chatType === 'local') {
      const now = Date.now();
      if (typeof filteredMsg === 'string' && filteredMsg.length > 60) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '지역채팅은 60자까지 입력할 수 있습니다.' }));
        return;
      }
      if (player.lastLocalChat && now - player.lastLocalChat < 2000) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '지역채팅은 2초에 한 번만 입력할 수 있습니다.' }));
        return;
      }
      player.lastLocalChat = now;
      const { x, y } = player.position;
      Object.values(PlayerManager.getAllPlayers()).forEach((p) => {
        if (p.position && p.position.x === x && p.position.y === y) {
          p.ws.send(JSON.stringify({ type: 'chat', chatType: 'local', name: playerName, message: filteredMsg }));
        }
      });
      return;
    }
    if (chatType === 'command') {
      await this.handleCommand({ ws, playerName, command, args, RoomManager: null, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, broadcast, SHOP_ITEMS, MAP_SIZE, VILLAGE_POS, commandHandlers, sendRoomInfo: sendRoomInfoToAllInRoom, battleIntervals });
      return;
    }
    if (chatType === 'move') {
      await this.handleMove({ ws, playerName, dx, dy, RoomManager: null, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, MAP_SIZE, VILLAGE_POS, battleIntervals });
      return;
    }
  },
  async handleCommand({ ws, playerName, command, args, RoomManager, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, broadcast, SHOP_ITEMS, MAP_SIZE, VILLAGE_POS, commandHandlers, sendRoomInfo, battleIntervals }) {
    if (!commandHandlers) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '명령어 핸들러가 정의되어 있지 않습니다.' }));
      return;
    }
    if (commandHandlers[command]) {
      // 객체 기반 명령어 지원
      if (typeof commandHandlers[command].execute === 'function') {
        // /클랜힐 명령어는 player, battleIntervals 인자 필요
        if (command === '/클랜힐') {
          const player = PlayerManager.getPlayer(playerName);
          return await commandHandlers[command].execute({
            ws,
            player,
            battleIntervals,
            PlayerManager
          });
        }
        // /정보 명령어는 players 인자 명시적으로 전달
        if (command === '/정보') {
          return await commandHandlers[command].execute({
            ws,
            playerName,
            message: [command, ...args].join(' '),
            players: PlayerManager.getAllPlayers(),
            PlayerManager
          });
        }
        // /랭킹 명령어는 PlayerManager 인자 명시적으로 전달
        if (command === '/랭킹') {
          return await commandHandlers[command].execute({
            ws,
            PlayerManager
          });
        }
        // 모든 객체 기반 명령어에 PlayerManager 등 공통 의존성 포함
        return await commandHandlers[command].execute({
          ws,
          playerName,
          message: [command, ...args].join(' '),
          players: PlayerManager.getAllPlayers(),
          getRoom,
          getPlayersInRoom,
          SHOP_ITEMS,
          savePlayerData,
          sendInventory,
          sendCharacterInfo,
          MAP_SIZE,
          VILLAGE_POS,
          sendRoomInfo,
          PlayerManager
        });
      } else if (typeof commandHandlers[command] === 'function') {
        // 기존 함수 기반 명령어
        return await commandHandlers[command]({
          ws,
          playerName,
          message: [command, ...args].join(' '),
          players: PlayerManager.getAllPlayers(),
          getRoom,
          getPlayersInRoom,
          SHOP_ITEMS,
          savePlayerData,
          sendInventory,
          sendCharacterInfo,
          MAP_SIZE,
          VILLAGE_POS,
          sendRoomInfo,
          PlayerManager
        });
      }
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '알 수 없는 명령어입니다.' }));
    }
  },
  async handlePickup({ ws, playerName, itemId, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, MAP_SIZE, VILLAGE_POS }) {
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    const { x, y } = player.position;
    const room = getRoom(player.world, x, y);
    const idx = room.items.findIndex((item) => item.id === itemId);
    if (idx !== -1) {
      const [item] = room.items.splice(idx, 1);
      const addSuccess = player.addToInventory(item, ws);
      if (!addSuccess) {
        return;
      }
      await savePlayerData(playerName);
      await sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
      sendInventory(player);
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `${item.name}을(를) 획득했습니다!` }));
      const potionResult = player.autoUsePotion();
      if (potionResult) {
        ws.send(JSON.stringify({
          type: 'system',
          subtype: 'event',
          message: `${potionResult.name}을(를) 자동으로 사용했습니다! (HP +${potionResult.healAmount}, 남은량: ${potionResult.left})`
        }));
        await savePlayerData(playerName);
        sendInventory(player);
        sendCharacterInfo(player);
      }
    } else {
      ws.send(JSON.stringify({ type: 'error', message: '해당 아이템이 없습니다.' }));
    }
  },
  async handleAttack({ ws, playerName, monsterId, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendCharacterInfo, broadcast, processBattle, respawnMonsterWithDeps, MAP_SIZE, VILLAGE_POS, sendInventory }) {
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    const { x, y } = player.position;
    const room = getRoom(player.world, x, y);
    const mIdx = room.monsters.findIndex((m) => m.id === monsterId);
    if (mIdx !== -1) {
      const monster = room.monsters[mIdx];
      // 클랜힐 자동 비활성화
      if (player.clanHealOn) {
        player.clanHealOn = false;
        ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '전투로 클랜힐이 비활성화되었습니다.' }));
      }
      const result = processBattle(player, monster, room, VILLAGE_POS);
      await savePlayerData(playerName);
      if (Array.isArray(result.log)) {
        ws.send(JSON.stringify({ type: 'battle', log: result.log }));
      } else {
        ws.send(JSON.stringify({ type: 'battle', log: [result.log] }));
      }
      if (result.monsterDead) {
        Object.values(PlayerManager.getAllPlayers()).forEach((p) => {
          if (p.position && p.position.x === x && p.position.y === y && p.world === player.world) {
            p.ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `${playerName}님이 ${monster.name}을(를) 처치했습니다!` }));
          }
        });
        respawnMonsterWithDeps(player.world, player.position.x, player.position.y);
      } else if (result.playerDead) {
        // 리스폰: 1번 마을로 이동, HP 20%로 설정
        player.world = 1;
        player.position = { x: 4, y: 4 };
        player.hp = Math.max(1, Math.floor(player.maxHp * 0.2));
        await savePlayerData(playerName);
        await sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
      }
      await sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
      sendInventory(player);
      sendCharacterInfo(player);
    } else {
      ws.send(JSON.stringify({ type: 'error', message: '해당 몬스터가 없습니다.' }));
    }
  },
  async handleAutoBattle({ ws, playerName, monsterId, getRoom, sendRoomInfoToAllInRoom, savePlayerData, sendCharacterInfo, broadcast, processBattle, respawnMonsterWithDeps, battleIntervals, MAP_SIZE, VILLAGE_POS, getPlayersInRoom, sendInventory }) {
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    const { x, y } = player.position;
    const room = getRoom(player.world, x, y);
    const mIdx = room.monsters.findIndex((m) => m.id === monsterId);
    if (mIdx === -1) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '해당 몬스터가 없습니다.' }));
      return;
    }
    if (battleIntervals[playerName]) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '이미 자동전투 중입니다.' }));
      return;
    }
    const _sendInventory = sendInventory;
    // 클랜힐 자동 비활성화
    if (player.clanHealOn) {
      player.clanHealOn = false;
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '전투로 클랜힐이 비활성화되었습니다.' }));
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
      await sendRoomInfoToAllInRoom(
        PlayerManager.getAllPlayers(),
        player.world, player.position.x, player.position.y,
        getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS
      );
      sendCharacterInfo(player);
      if (Array.isArray(result.log)) {
        ws.send(JSON.stringify({ type: 'battle', log: result.log }));
      } else {
        ws.send(JSON.stringify({ type: 'battle', log: [result.log] }));
      }
      if (result.monsterDead || result.playerDead) {
        clearInterval(battleIntervals[playerName]);
        delete battleIntervals[playerName];
        if (result.monsterDead) {
          const { x, y } = player.position;
          Object.values(PlayerManager.getAllPlayers()).forEach((p) => {
            if (p.position && p.position.x === x && p.position.y === y && p.world === player.world) {
              p.ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `${playerName}님이 ${monster.name}을(를) 처치했습니다!` }));
            }
          });
          respawnMonsterWithDeps(player.world, player.position.x, player.position.y);
        } else if (result.playerDead) {
          // 리스폰: 1번 마을로 이동, HP 20%로 설정
          player.world = 1;
          player.position = { x: 4, y: 4 };
          player.hp = Math.max(1, Math.floor(player.maxHp * 0.2));
          await savePlayerData(playerName);
          await sendRoomInfoToAllInRoom(
            PlayerManager.getAllPlayers(),
            player.world, player.position.x, player.position.y,
            getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS
          );
        }
        await sendRoomInfoToAllInRoom(
          PlayerManager.getAllPlayers(),
          player.world, player.position.x, player.position.y,
          getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS
        );
        _sendInventory(player);
        sendCharacterInfo(player);
      }
      _sendInventory(player);
    }, 1200);
    ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '자동전투를 시작합니다!' }));
  },
  async handleStat({ ws, playerName }) {
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    // 장비 옵션 증가분 계산
    const weapon = player.equipWeapon || {};
    const armor = player.equipArmor || {};
    const strBonus = (weapon.str || 0) + (armor.str || 0);
    const dexBonus = (weapon.dex || 0) + (armor.dex || 0);
    const intBonus = (weapon.int || 0) + (armor.int || 0);
    const hpBonus = (weapon.hp || 0) + (armor.hp || 0);
    const mpBonus = (weapon.mp || 0) + (armor.mp || 0);
    // 최종 합산값
    const realStr = player.str + strBonus;
    const realDex = player.dex + dexBonus;
    const realInt = player.int + intBonus;
    const realHp = player.getRealMaxHp();
    const realMp = player.maxMp + mpBonus;
    const statMsg =
      `[능력치]\n` +
      `HP  : ${player.hp} / ${realHp}    MP  : ${player.mp} / ${realMp}\n` +
      `STR : ${realStr} (Exp: ${Number(player.strExp).toFixed(2)}/${Number(player.strExpMax).toFixed(2)})   DEX: ${realDex} (Exp: ${Number(player.dexExp).toFixed(2)}/${Number(player.dexExpMax).toFixed(2)})   INT: ${realInt} (Exp: ${Number(player.intExp).toFixed(2)}/${Number(player.intExpMax).toFixed(2)})\n` +
      `공격력: ${player.getAtk()}   방어력: ${player.getDef()}`;
    ws.send(JSON.stringify({ type: 'system', subtype: 'info', message: statMsg }));
  },
  async handleEquipInfo({ ws, playerName }) {
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    let msg = '[장비 정보]\n';
    function getOptionStr(item) {
      if (!item) return '';
      let opts = [];
      if (item.atk) opts.push(`+공 ${item.atk}`);
      if (item.str) opts.push(`+str ${item.str}`);
      if (item.dex) opts.push(`+dex ${item.dex}`);
      if (item.def) opts.push(`+def ${item.def}`);
      return opts.length ? opts.join(', ') : '';
    }
    if (player.equipWeapon) {
      const opt = getOptionStr(player.equipWeapon);
      msg += `무기: ${player.equipWeapon.name}` + (opt ? ` (${opt})` : '') + '\n';
    } else {
      msg += '무기: 없음\n';
    }
    if (player.equipArmor) {
      const opt = getOptionStr(player.equipArmor);
      msg += `방어구: ${player.equipArmor.name}` + (opt ? ` (${opt})` : '') + '\n';
    } else {
      msg += '방어구: 없음\n';
    }
    ws.send(JSON.stringify({ type: 'system', subtype: 'info', message: msg }));
  },
  async handleShop({ ws, playerName, getRoom, SHOP_ITEMS, MAP_SIZE, VILLAGE_POS, message }) {
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    const { x, y } = player.position;
    const room = getRoom(player.world, x, y);
    if (room.type !== 'village') {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '상점은 마을에서만 이용할 수 있습니다.' }));
      return;
    }
    // 명령어 파싱: /상점 [카테고리] [페이지]
    const args = message ? message.trim().split(' ').slice(1) : [];
    const categories = Object.keys(SHOP_ITEMS);
    if (args.length === 0 || !categories.includes(args[0])) {
      // 카테고리 안내
      let msg = '[상점 카테고리]\n';
      categories.forEach(cat => {
        msg += `- ${cat}: /상점 ${cat} 1\n`;
      });
      msg += '\n구매: /구매 아이템명 (예: /구매 나무검)';
      msg += '\n판매: /상점판매';
      msg += '\n※ 물약류(소모품/잡화)는 /구매 아이템명 갯수 (예: /구매 소형 물약 10), /판매 아이템명 갯수 (예: /판매 소형 물약 10) 으로 여러 개 구매/판매할 수 있습니다.';
      ws.send(JSON.stringify({ type: 'system', subtype: 'info', message: msg }));
      return;
    }
    const cat = args[0];
    const page = Math.max(1, parseInt(args[1] || '1', 10));
    const itemsPerPage = 7;
    const items = SHOP_ITEMS[cat] || [];
    const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
    const pageItems = items.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    let msg = `[${cat} 상점 ${page}페이지/${totalPages}]\n`;
    pageItems.forEach((item, idx) => {
      let statStr = '';
      if (item.atk) statStr += ` 공격력+${item.atk}`;
      if (item.def) statStr += ` 방어력+${item.def}`;
      if (item.str) statStr += ` 힘+${item.str}`;
      if (item.dex) statStr += ` 민첩+${item.dex}`;
      if (item.perUse && item.total) statStr += ` 1회 ${item.perUse} 회복 / 총 ${item.total}`;
      statStr = statStr.trim();
      msg += `  ${idx + 1}. ${item.name.padEnd(8, ' ')} ${String(item.price).padEnd(5, ' ')}G  - ${item.desc}`;
      if (statStr) msg += ` [${statStr}]`;
      msg += '\n';
    });
    msg += `\n페이지: /상점 ${cat} [페이지번호]`;
    msg += '\n구매: /구매 아이템명 (예: /구매 나무검)';
    msg += '\n판매: /상점판매';
    msg += '\n※ 물약류(소모품/잡화)는 /구매 아이템명 갯수 (예: /구매 소형 물약 10), /판매 아이템명 갯수 (예: /판매 소형 물약 10) 으로 여러 개 구매/판매할 수 있습니다.';
    ws.send(JSON.stringify({ type: 'system', subtype: 'info', message: msg }));
  },
  // /상점판매 [페이지]
  async handleShopSell({ ws, playerName, getRoom, SHOP_ITEMS, message }) {
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    const { x, y } = player.position;
    const room = getRoom(player.world, x, y);
    if (room.type !== 'village') {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '상점은 마을에서만 이용할 수 있습니다.' }));
      return;
    }
    const args = message ? message.trim().split(' ').slice(1) : [];
    const page = Math.max(1, parseInt(args[0] || '1', 10));
    // 인벤토리 내 판매 가능한 아이템만 필터링
    const ISLAND_DROP_ITEMS = [
      '플레임소드', '플레임아머', '서리검', '서리갑옷',
      '용의 검', '용의 갑옷', '암흑검', '암흑갑옷',
      '천공의 갑옷', '천공의 검'
    ];
    const sellable = player.inventory.filter(invItem => {
      if (ISLAND_DROP_ITEMS.includes(invItem.name)) return true;
      return invItem.shopSell === true && typeof invItem.price === 'number';
    });
    const itemsPerPage = 7;
    const totalPages = Math.max(1, Math.ceil(sellable.length / itemsPerPage));
    const pageItems = sellable.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    let msg = `[판매 가능한 아이템 ${page}페이지/${totalPages}]\n`;
    pageItems.forEach((item, idx) => {
      msg += `  ${idx + 1}. ${item.name} (${item.count || 1}개)\n`;
    });
    if (sellable.length === 0) msg += '판매 가능한 아이템이 없습니다.\n';
    msg += `\n페이지: /상점판매 [페이지번호]`;
    msg += '\n판매: /판매 아이템명 (예: /판매 나무검)';
    ws.send(JSON.stringify({ type: 'system', subtype: 'info', message: msg }));
  },
  async handleClose({ ws, playerName, wss, sendPlayerList, broadcast, sendRoomInfoToAllInRoom, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS }) {
    if (playerName && PlayerManager.getPlayer(playerName)) {
      const prevWorld = PlayerManager.getPlayer(playerName).world;
      const prevX = PlayerManager.getPlayer(playerName).position.x;
      const prevY = PlayerManager.getPlayer(playerName).position.y;
      PlayerManager.removePlayer(playerName);
      sendPlayerList(wss, PlayerManager.getAllPlayers());
      broadcast(wss, { type: 'system', subtype: 'event', message: `${playerName}님이 퇴장했습니다.` });
      sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), prevWorld, prevX, prevY, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
    }
    ws.close();
  },
  async handleEnterPyramid({ ws, playerName, getRoom, getPlayersInRoom, RoomManager, sendRoomInfo, sendInventory, sendCharacterInfo }) {
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    const { x, y } = player.position;
    // 피라미드 입구 좌표와 월드5(사막)인지 확인
    if (player.world === 5 && x === 5 && y === 2) {
      RoomManager.removePlayerFromRoom(playerName, player.world, x, y);
      player.world = 6; // 피라미드 내부 월드
      player.position = { x: 0, y: 0 };
      RoomManager.addPlayerToRoom(playerName, player.world, 0, 0);
      sendRoomInfo(player, getRoom, getPlayersInRoom, 15, { x: 0, y: 0 });
      sendInventory(player);
      sendCharacterInfo(player);
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '피라미드 내부로 입장합니다!' }));
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '여기는 피라미드 입구가 아닙니다.' }));
    }
  },
  async handleExitPyramid({ ws, playerName, getRoom, getPlayersInRoom, RoomManager, sendRoomInfo, sendInventory, sendCharacterInfo }) {
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    const { x, y } = player.position;
    // 피라미드 내부 출구(월드6, 0,0)인지 확인
    if (player.world === 6 && x === 0 && y === 0) {
      RoomManager.removePlayerFromRoom(playerName, player.world, x, y);
      player.world = 5; // 사막 월드
      player.position = { x: 5, y: 2 };
      RoomManager.addPlayerToRoom(playerName, player.world, 5, 2);
      sendRoomInfo(player, getRoom, getPlayersInRoom, 7, { x: 5, y: 2 });
      sendInventory(player);
      sendCharacterInfo(player);
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '사막(피라미드 입구)로 나갑니다!' }));
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '여기는 피라미드 출구가 아닙니다.' }));
    }
  }
};

module.exports = PlayerGameService; 