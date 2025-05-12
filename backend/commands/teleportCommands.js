// 텔레포트 명령어 핸들러 분리
const { ISLAND_VILLAGE_POS, ISLAND2_VILLAGE_POS } = require('../data/map');
const RoomManager = require('../roomManager');
const { PlayerManager } = require('../playerManager');
const { sendRoomInfoToAllInRoom } = require('../utils/broadcast');

function handleTeleportCommand({ ws, playerName, message, players, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo }) {
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
  } else {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[텔레포트] 지원하지 않는 지역입니다. (예: /텔포 무인도, /텔포 마을)' }));
  }
}

module.exports = {
  handleTeleportCommand,
}; 