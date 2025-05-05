// PlayerGameService: 게임 내 실시간 플레이어 관련 로직(이동, 채팅, 명령어, 아이템, 전투 등)

const PlayerGameService = {
  async handleMove({ ws, playerName, dx, dy, PlayerManager, RoomManager, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, MAP_SIZE, VILLAGE_POS, battleIntervals }) {
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
      if (destRoom && destRoom.type === 'cave_wall') {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '두꺼운 암벽이 길을 막고 있습니다.' }));
        return;
      }
      player.position = { x: nx, y: ny };
      await savePlayerData(playerName);
      await sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
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
    } else {
      ws.send(JSON.stringify({ type: 'error', message: '잘못된 좌표입니다.' }));
    }
  },
  async handleChat({ ws, playerName, message, PlayerManager, broadcast, getRoom, getPlayersInRoom, sendPlayerList, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, commandHandlers, SHOP_ITEMS, MAP_SIZE, VILLAGE_POS, battleIntervals, parseChatCommand }) {
    const trimmed = message.trim();
    // 운영자 명령어, /입장, /나가기 등은 server.js에서 분기 처리 후 이관 필요
    // 여기서는 일반 채팅/명령어/이동만 처리
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    const { type: chatType, message: chatMsg, dx, dy } = parseChatCommand(message);
    if (chatType === 'invalid') {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: chatMsg }));
      return;
    }
    if (chatType === 'global') {
      broadcast(ws, { type: 'chat', chatType: 'global', name: playerName, message: chatMsg });
    } else if (chatType === 'move') {
      await this.handleMove({ ws, playerName, dx, dy, PlayerManager, RoomManager: null, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, MAP_SIZE, VILLAGE_POS, battleIntervals });
    } else {
      // 지역채팅
      const { x, y } = player.position;
      Object.values(PlayerManager.getAllPlayers()).forEach((p) => {
        if (p.position && p.position.x === x && p.position.y === y) {
          p.ws.send(JSON.stringify({ type: 'chat', chatType: 'local', name: playerName, message: chatMsg }));
        }
      });
    }
  },
  async handleCommand({ ws, playerName, command, args, PlayerManager, RoomManager, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, broadcast, SHOP_ITEMS, MAP_SIZE, VILLAGE_POS, commandHandlers, sendRoomInfo }) {
    // 명령어 핸들러 위임
    if (commandHandlers[command]) {
      return commandHandlers[command]({
        ws,
        playerName,
        message: args.join(' '),
        players: PlayerManager.getAllPlayers(),
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
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '알 수 없는 명령어입니다.' }));
    }
  },
  async handlePickup({ ws, playerName, itemId, PlayerManager, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendInventory, sendCharacterInfo, MAP_SIZE, VILLAGE_POS }) {
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    const { x, y } = player.position;
    const room = getRoom(player.world, x, y);
    const idx = room.items.findIndex((item) => item.id === itemId);
    if (idx !== -1) {
      const [item] = room.items.splice(idx, 1);
      player.inventory.push(item);
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
  async handleAttack({ ws, playerName, monsterId, PlayerManager, getRoom, getPlayersInRoom, sendRoomInfoToAllInRoom, savePlayerData, sendCharacterInfo, broadcast, processBattle, respawnMonsterWithDeps, MAP_SIZE, VILLAGE_POS }) {
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    const { x, y } = player.position;
    const room = getRoom(player.world, x, y);
    const mIdx = room.monsters.findIndex((m) => m.id === monsterId);
    if (mIdx !== -1) {
      const monster = room.monsters[mIdx];
      const result = processBattle(player, monster, room, VILLAGE_POS);
      await savePlayerData(playerName);
      if (Array.isArray(result.log)) {
        ws.send(JSON.stringify({ type: 'battle', log: result.log }));
      } else {
        ws.send(JSON.stringify({ type: 'battle', log: [result.log] }));
      }
      if (result.monsterDead) {
        Object.values(PlayerManager.getAllPlayers()).forEach((p) => {
          if (p.position && p.position.x === x && p.position.y === y) {
            p.ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `${playerName}님이 ${monster.name}을(를) 처치했습니다!` }));
          }
        });
        respawnMonsterWithDeps(player.world, player.position.x, player.position.y);
      } else if (result.playerDead) {
        await sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
      }
      await sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
      sendCharacterInfo(player);
    } else {
      ws.send(JSON.stringify({ type: 'error', message: '해당 몬스터가 없습니다.' }));
    }
  },
  async handleAutoBattle({ ws, playerName, monsterId, PlayerManager, getRoom, sendRoomInfoToAllInRoom, savePlayerData, sendCharacterInfo, broadcast, processBattle, respawnMonsterWithDeps, battleIntervals, MAP_SIZE, VILLAGE_POS, getPlayersInRoom }) {
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
            if (p.position && p.position.x === x && p.position.y === y) {
              p.ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `${playerName}님이 ${monster.name}을(를) 처치했습니다!` }));
            }
          });
          respawnMonsterWithDeps(player.world, player.position.x, player.position.y);
        }
        if (result.playerDead) {
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
        sendCharacterInfo(player);
      }
    }, 1200);
    ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '자동전투를 시작합니다!' }));
  },
  async handleStat({ ws, playerName, PlayerManager }) {
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    const statMsg =
      `[능력치]\n` +
      `HP  : ${player.hp} / ${player.maxHp}    MP  : ${player.mp} / ${player.maxMp}\n` +
      `STR : ${player.str} (Exp: ${player.strExp}/${player.strExpMax})   DEX: ${player.dex} (Exp: ${player.dexExp}/${player.dexExpMax})   INT: ${player.int} (Exp: ${player.intExp}/${player.intExpMax})\n` +
      `공격력: ${player.getAtk()}   방어력: ${player.getDef()}`;
    ws.send(JSON.stringify({ type: 'system', subtype: 'info', message: statMsg }));
  },
  async handleEquipInfo({ ws, playerName, PlayerManager }) {
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
  async handleShop({ ws, playerName, PlayerManager, getRoom, SHOP_ITEMS, MAP_SIZE, VILLAGE_POS }) {
    const player = PlayerManager.getPlayer(playerName);
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
  },
  async handleClose({ ws, playerName, PlayerManager, wss, sendPlayerList, broadcast, sendRoomInfoToAllInRoom, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS }) {
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
  }
};

module.exports = PlayerGameService; 