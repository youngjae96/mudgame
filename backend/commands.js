// 명령어 핸들러 모듈
// 필요한 의존성은 인자로 주입받도록 설계

const { ITEM_TYPE } = require('./data/items');
const { ISLAND_VILLAGE_POS } = require('./data/map');
const PlayerController = require('./controllers/PlayerController');
const ShopService = require('./services/ShopService');
const PlayerManager = require('./playerManager');
const RoomManager = require('./roomManager');
const { sendRoomInfoToAllInRoom, broadcast } = require('./utils/broadcast');

let shopServiceInstance = null;

function setupCommands({ shopService, playerService }) {
  shopServiceInstance = shopService;
  PlayerController.setPlayerServiceInstance(playerService);
}

function handleBuyCommand(args) {
  return shopServiceInstance.buyItem(args);
}

function handleSellCommand(args) {
  return shopServiceInstance.sellItem(args);
}

function handleTeleportCommand({ ws, playerName, message, players, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo }) {
  const player = players[playerName];
  if (!player) return;
  const args = message.trim().split(' ');
  if (args.length < 2) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[텔레포트] 사용법: /텔포 <지역이름> (예: /텔포 무인도, /텔포 마을)' }));
    return;
  }
  const dest = args[1];
  if (dest === '무인도') {
    if (player.world === 1 && player.position.x === 4 && player.position.y === 4) {
      RoomManager.removePlayerFromRoom(playerName, player.world, player.position.x, player.position.y);
      player.world = 2;
      player.position = { x: ISLAND_VILLAGE_POS.x, y: ISLAND_VILLAGE_POS.y };
      RoomManager.addPlayerToRoom(playerName, player.world, player.position.x, player.position.y);
      PlayerManager.addPlayer(playerName, player);
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[텔레포트] 무인도 오두막으로 이동합니다!' }));
      sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, { x: ISLAND_VILLAGE_POS.x, y: ISLAND_VILLAGE_POS.y });
      sendInventory(player);
      sendCharacterInfo(player);
      sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, { x: ISLAND_VILLAGE_POS.x, y: ISLAND_VILLAGE_POS.y });
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[텔레포트] 마을 광장에서만 무인도로 이동할 수 있습니다.' }));
    }
    return;
  } else if (dest === '마을') {
    if (player.world === 2 && player.position.x === ISLAND_VILLAGE_POS.x && player.position.y === ISLAND_VILLAGE_POS.y) {
      RoomManager.removePlayerFromRoom(playerName, player.world, player.position.x, player.position.y);
      player.world = 1;
      player.position = { x: 4, y: 4 };
      RoomManager.addPlayerToRoom(playerName, player.world, player.position.x, player.position.y);
      PlayerManager.addPlayer(playerName, player);
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[텔레포트] 마을 광장으로 이동합니다!' }));
      sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, { x: 4, y: 4 });
      sendInventory(player);
      sendCharacterInfo(player);
      sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, { x: 4, y: 4 });
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[텔레포트] 무인도 오두막에서만 마을로 이동할 수 있습니다.' }));
    }
    return;
  } else if (dest === '동굴') {
    if (player.world === 2 && player.position.x === 2 && player.position.y === 6) {
      RoomManager.removePlayerFromRoom(playerName, player.world, player.position.x, player.position.y);
      player.world = 3;
      player.position = { x: 0, y: 0 };
      RoomManager.addPlayerToRoom(playerName, player.world, player.position.x, player.position.y);
      PlayerManager.addPlayer(playerName, player);
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[텔레포트] 동굴로 들어갑니다!' }));
      sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
      sendInventory(player);
      sendCharacterInfo(player);
      sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[텔레포트] 무인도 동굴 입구에서만 동굴로 들어갈 수 있습니다.' }));
    }
    return;
  } else {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[텔레포트] 지원하지 않는 지역입니다. (예: /텔포 무인도, /텔포 마을)' }));
  }
}

function handleInnCommand({ ws, playerName, players, getRoom, savePlayerData, sendInventory, sendCharacterInfo }) {
  const player = players[playerName];
  if (!player) return;
  const { x, y } = player.position;
  const room = getRoom(player.world, x, y);
  if (!room || room.type !== 'village') {
    ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[여관] 마을에서만 이용할 수 있습니다.' }));
    return;
  }
  if (player.hp === player.maxHp && player.mp === player.maxMp) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[여관] 이미 HP/MP가 모두 가득 찼습니다.' }));
    return;
  }
  const INN_PRICE = 50;
  if (player.gold < INN_PRICE) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[여관] 골드가 부족합니다. (필요: ${INN_PRICE}G)` }));
    return;
  }
  player.gold -= INN_PRICE;
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  savePlayerData(playerName).catch(() => {});
  sendInventory(player);
  sendCharacterInfo(player);
  ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `[여관] HP/MP가 모두 회복되었습니다! (-${INN_PRICE}G)` }));
}

function handleAdminCommand({ ws, playerName, message, players, getRoom, sendInventory, sendCharacterInfo, savePlayerData }) {
  // /운영자 <subcmd> ...
  const args = message.trim().split(' ');
  if (args.length < 2) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 사용법: /운영자 <공지|골드지급|아이템지급|텔포|서버저장> ...' }));
    return;
  }
  const subcmd = args[1];
  // /운영자 서버저장: 모든 플레이어 DB 저장
  if (subcmd === '서버저장') {
    const allPlayers = Object.keys(players);
    Promise.all(allPlayers.map(name => savePlayerData(name).catch(() => {})))
      .then(() => {
        ws.send(JSON.stringify({ type: 'system', message: '[운영자] 모든 플레이어 데이터가 DB에 저장되었습니다.' }));
      });
    return;
  }
  // /운영자 공지 메시지
  if (subcmd === '공지') {
    const notice = args.slice(2).join(' ');
    if (!notice) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 공지할 메시지를 입력하세요. (/운영자 공지 <메시지>)' }));
      return;
    }
    if (typeof global.wss !== 'undefined') {
      broadcast(global.wss, { type: 'system', message: `[공지] ${notice}` });
    } else {
      Object.values(players).forEach((p) => {
        if (p.ws && p.ws.readyState === 1) {
          p.ws.send(JSON.stringify({ type: 'system', message: `[공지] ${notice}` }));
        }
      });
    }
    return;
  }
  // /운영자 골드지급 닉네임 숫자
  if (subcmd === '골드지급') {
    const target = args[2];
    const amount = parseInt(args[3], 10);
    if (!target || isNaN(amount)) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 사용법: /운영자 골드지급 닉네임 숫자' }));
      return;
    }
    const targetPlayer = players[target];
    if (!targetPlayer) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 해당 닉네임의 플레이어가 없습니다: ${target}` }));
      return;
    }
    targetPlayer.gold = (targetPlayer.gold || 0) + amount;
    sendInventory(targetPlayer);
    ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${target}님에게 골드 ${amount} 지급 완료!` }));
    if (targetPlayer.ws && targetPlayer.ws.readyState === 1) {
      targetPlayer.ws.send(JSON.stringify({ type: 'system', message: `[운영자] 골드 ${amount} 지급되었습니다!` }));
    }
    return;
  }
  // /운영자 아이템지급 닉네임 아이템이름(띄어쓰기포함)
  if (subcmd === '아이템지급') {
    const target = args[2];
    const itemName = args.slice(3).join(' ');
    if (!target || !itemName) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 사용법: /운영자 아이템지급 닉네임 아이템이름' }));
      return;
    }
    const targetPlayer = players[target];
    if (!targetPlayer) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 해당 닉네임의 플레이어가 없습니다: ${target}` }));
      return;
    }
    // 아이템 풀에서 이름으로 검색
    const { ITEM_POOL } = require('./data/items');
    const item = ITEM_POOL.find(i => i.name === itemName);
    if (!item) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 해당 이름의 아이템이 없습니다: ${itemName}` }));
      return;
    }
    targetPlayer.inventory.push({ ...item });
    sendInventory(targetPlayer);
    ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${target}님에게 아이템 '${itemName}' 지급 완료!` }));
    if (targetPlayer.ws && targetPlayer.ws.readyState === 1) {
      targetPlayer.ws.send(JSON.stringify({ type: 'system', message: `[운영자] 아이템 '${itemName}' 지급되었습니다!` }));
    }
    return;
  }
  // /운영자 텔포 닉네임
  if (subcmd === '텔포') {
    const target = args[2];
    if (!target) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 사용법: /운영자 텔포 닉네임' }));
      return;
    }
    const targetPlayer = players[target];
    const adminPlayer = players[playerName];
    if (!targetPlayer || !adminPlayer) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 해당 닉네임의 플레이어가 없습니다: ${target}` }));
      return;
    }
    // 운영자를 타겟 플레이어 위치로 이동
    adminPlayer.world = targetPlayer.world;
    adminPlayer.position = { ...targetPlayer.position };
    ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${target}님 위치로 텔레포트 완료!` }));
    if (adminPlayer.ws && adminPlayer.ws.readyState === 1) {
      adminPlayer.ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${target}님 위치로 텔레포트 되었습니다.` }));
    }
    // 방 정보 갱신
    if (typeof global.getRoom === 'function' && typeof global.getPlayersInRoom === 'function') {
      const { MAP_SIZE, VILLAGE_POS } = require('./data/map');
      const { sendRoomInfo } = require('./utils/broadcast');
      sendRoomInfo(adminPlayer, global.getRoom, global.getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
    }
    return;
  }
  ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 지원하지 않는 서브명령어입니다.' }));
}

module.exports = {
  setupCommands,
  handleBuyCommand,
  handleSellCommand,
  handleEquipCommand: PlayerController.handleEquipCommand,
  handleUnequipCommand: PlayerController.handleUnequipCommand,
  handleTeleportCommand,
  handleInnCommand,
  handleAdminCommand,
}; 