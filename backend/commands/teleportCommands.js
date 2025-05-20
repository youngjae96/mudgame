// 텔레포트 명령어 핸들러 클래스화
const { ISLAND_VILLAGE_POS, ISLAND2_VILLAGE_POS } = require('../data/map');
const RoomManager = require('../roomManager');
const { PlayerManager } = require('../playerManager');
const { sendRoomInfo, sendInventory, sendCharacterInfo, sendRoomInfoToAllInRoom } = require('../utils/broadcast');
const getPlayersInRoom = RoomManager.getPlayersInRoom.bind(RoomManager);

// 글로벌 반복 관리 객체
if (!global.teleportIntervals) global.teleportIntervals = {};

class TeleportCommand {
  execute({ ws, playerName, message, players, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo }) {
    const player = players[playerName];
    if (!player) return;
    const args = message.trim().split(' ');
    if (args.length < 2) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[텔레포트] 사용법: /텔포 <지역이름> (예: /텔포 무인도, /텔포 무인도2, /텔포 마을)' }));
      return;
    }
    const dest = args[1];
    if (dest === '무인도2') {
      if (player.world === 1 && player.position.x === 4 && player.position.y === 4) {
        if (player.clanHealOn) {
          player.clanHealOn = false;
          ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '텔레포트로 클랜힐이 비활성화되었습니다.' }));
        }
        RoomManager.removePlayerFromRoom(playerName, player.world, player.position.x, player.position.y);
        player.world = 4;
        player.position = { x: ISLAND2_VILLAGE_POS.x, y: ISLAND2_VILLAGE_POS.y };
        RoomManager.addPlayerToRoom(playerName, player.world, player.position.x, player.position.y);
        PlayerManager.addPlayer(playerName, player);
        ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[텔레포트] 무인도2 오두막으로 이동합니다!' }));
        sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, ISLAND2_VILLAGE_POS);
        sendInventory(player);
        sendCharacterInfo(player);
        sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, ISLAND2_VILLAGE_POS);
      } else {
        ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[텔레포트] 마을 광장에서만 무인도2로 이동할 수 있습니다.' }));
      }
      return;
    }
    if (dest === '무인도') {
      if (player.world === 1 && player.position.x === 4 && player.position.y === 4) {
        if (player.clanHealOn) {
          player.clanHealOn = false;
          ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '텔레포트로 클랜힐이 비활성화되었습니다.' }));
        }
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
      if (player.world === 4 && player.position.x === ISLAND2_VILLAGE_POS.x && player.position.y === ISLAND2_VILLAGE_POS.y) {
        if (player.clanHealOn) {
          player.clanHealOn = false;
          ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '텔레포트로 클랜힐이 비활성화되었습니다.' }));
        }
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
      } else if (player.world === 2 && player.position.x === ISLAND_VILLAGE_POS.x && player.position.y === ISLAND_VILLAGE_POS.y) {
        if (player.clanHealOn) {
          player.clanHealOn = false;
          ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '텔레포트로 클랜힐이 비활성화되었습니다.' }));
        }
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
        ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[텔레포트] 무인도/무인도2 오두막에서만 마을로 이동할 수 있습니다.' }));
      }
      return;
    } else if (dest === '동굴') {
      if (player.world === 2 && player.position.x === 2 && player.position.y === 6) {
        if (player.clanHealOn) {
          player.clanHealOn = false;
          ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '텔레포트로 클랜힐이 비활성화되었습니다.' }));
        }
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
    } else if (dest === '사막') {
      if (player.world === 1 && player.position.x === 4 && player.position.y === 4) {
        if (player.clanHealOn) {
          player.clanHealOn = false;
          ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '텔레포트로 클랜힐이 비활성화되었습니다.' }));
        }
        RoomManager.removePlayerFromRoom(playerName, player.world, player.position.x, player.position.y);
        player.world = 5;
        player.position = { x: 3, y: 3 };
        RoomManager.addPlayerToRoom(playerName, player.world, player.position.x, player.position.y);
        PlayerManager.addPlayer(playerName, player);
        ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[텔레포트] 사막 마을로 이동합니다!' }));
        sendRoomInfo(player, getRoom, getPlayersInRoom, 7, { x: 3, y: 3 });
        sendInventory(player);
        sendCharacterInfo(player);
        sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, 7, { x: 3, y: 3 });
      } else {
        ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[텔레포트] 마을 광장에서만 사막으로 이동할 수 있습니다.' }));
      }
      return;
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[텔레포트] 지원하지 않는 지역입니다. (예: /텔포 무인도, /텔포 마을)' }));
    }
  }
}

class TeleportRandomCommand {
  execute({ ws, playerName, players }) {
    if (!global.teleportIntervals) global.teleportIntervals = {};
    if (!global.lastTeleportTime) global.lastTeleportTime = {};
    const now = Date.now();
    if (global.lastTeleportTime[playerName] && now - global.lastTeleportTime[playerName] < 2000) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '텔레포트는 2초에 한 번만 실행할 수 있습니다.' }));
      return;
    }
    global.lastTeleportTime[playerName] = now;
    if (global.teleportIntervals[playerName]) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '이미 텔레포트 자동 이동이 실행 중입니다. (/텔레포트중지로 중단)' }));
      return;
    }
    const player = players[playerName];
    if (!player) return;
    // 인트 50 미만이면 사용 불가
    if (player.int < 50) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '텔레포트 스크롤은 인트 50 이상만 사용할 수 있습니다.' }));
      return;
    }
    const teleportFn = () => {
      const scrollIdx = player.inventory.findIndex(i => i.name === '텔레포트 스크롤' && (typeof i.count !== 'number' || i.count > 0));
      if (scrollIdx === -1) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '텔레포트 스크롤이 인벤토리에 없습니다. 반복을 중지합니다.' }));
        clearInterval(global.teleportIntervals[playerName]);
        delete global.teleportIntervals[playerName];
        return;
      }
      let MAP_SIZE = 10;
      if (player.world === 3) MAP_SIZE = 30;
      if (player.world === 5) MAP_SIZE = 7;
      const x = Math.floor(Math.random() * MAP_SIZE);
      const y = Math.floor(Math.random() * MAP_SIZE);
      RoomManager.removePlayerFromRoom(playerName, player.world, player.position.x, player.position.y);
      player.position = { x, y };
      RoomManager.addPlayerToRoom(playerName, player.world, x, y);
      const scroll = player.inventory[scrollIdx];
      if (scroll.count) scroll.count -= 1;
      if (typeof player.gainIntExp === 'function') player.gainIntExp(2.5);
      else player.intExp = (player.intExp || 0) + 2.5;
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `텔레포트 스크롤을 사용해 맵 내 랜덤 위치(${x},${y})로 이동했습니다! (인트 경험치 +2.5)` }));
      sendRoomInfo(player, RoomManager.getRoom.bind(RoomManager), getPlayersInRoom, MAP_SIZE, player.position);
      sendInventory(player);
      sendCharacterInfo(player);
    };
    global.teleportIntervals[playerName] = setInterval(teleportFn, 2000);
    ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '텔레포트 자동 이동이 시작되었습니다! (/텔레포트중지로 중단)' }));
  }
}

class TeleportStopCommand {
  execute({ ws, playerName }) {
    if (!global.lastTeleportTime) global.lastTeleportTime = {};
    const now = Date.now();
    if (global.lastTeleportTime[playerName] && now - global.lastTeleportTime[playerName] < 2000) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '텔레포트중지는 2초에 한 번만 실행할 수 있습니다.' }));
      return;
    }
    global.lastTeleportTime[playerName] = now;
    if (global.teleportIntervals && global.teleportIntervals[playerName]) {
      clearInterval(global.teleportIntervals[playerName]);
      delete global.teleportIntervals[playerName];
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '텔레포트 자동 이동이 중지되었습니다.' }));
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '텔레포트 자동 이동이 실행 중이 아닙니다.' }));
    }
  }
}

module.exports = { TeleportCommand, TeleportRandomCommand, TeleportStopCommand }; 