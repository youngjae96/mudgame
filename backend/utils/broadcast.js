/**
 * broadcast.js: 서버-클라이언트 메시지/정보 전송 유틸
 * - broadcast: 전체 클라이언트에 메시지 전송
 * - sendPlayerList: 플레이어 목록 전송
 * - sendRoomInfo: 방 정보 전송
 * - sendRoomInfoToAllInRoom: 방에 있는 모든 유저에게 방 정보 전송
 * - sendInventory: 인벤토리 전송
 * - sendCharacterInfo: 캐릭터 정보 전송
 */
const { ROOM_TYPE, MAP_SIZE, ISLAND_VILLAGE_POS } = require('../data/map');
const Player = require('../models/Player');
const MAP_SIZE_CAVE = 30;
const Room = require('./Room');

/**
 * 전체 클라이언트에 메시지 전송
 */
function broadcast(wss, msg) {
  const str = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(str);
    }
  });
}

/**
 * 전체 플레이어 목록 전송
 */
function sendPlayerList(wss, players) {
  broadcast(wss, { type: 'players', list: Object.keys(players) });
}

/**
 * 방 정보(맵, 주변, 플레이어 등) 전송
 */
function sendRoomInfo(player, getRoom, getPlayersInRoom, _MAP_SIZE, VILLAGE_POS) {
  const { x, y } = player.position;
  const world = player.world || 1;
  const room = getRoom(world, x, y);
  if (!room) {
    console.error(`[sendRoomInfo] room not found: world=${world}, x=${x}, y=${y}`);
    return;
  }
  const playerList = getPlayersInRoom(world, x, y);
  // 월드별 맵 크기 결정
  let mapSize = _MAP_SIZE;
  if (world === 3) mapSize = MAP_SIZE_CAVE;
  // 5x5 주변 방 정보
  const half = 2;
  const nearbyRooms = [];
  for (let dy = y - half; dy <= y + half; dy++) {
    for (let dx = x - half; dx <= x + half; dx++) {
      if (dx >= 0 && dx < mapSize && dy >= 0 && dy < mapSize) {
        const r = getRoom(world, dx, dy);
        if (r) nearbyRooms.push({ x: dx, y: dy, type: r.type });
      }
    }
  }
  // 전체 맵 지역 정보 생성
  const regions = [];
  for (let yy = 0; yy < mapSize; yy++) {
    const row = [];
    for (let xx = 0; xx < mapSize; xx++) {
      const r = getRoom(world, xx, yy);
      row.push(r ? r.type : ROOM_TYPE.FIELD);
    }
    regions.push(row);
  }
  player.ws.send(
    JSON.stringify({
      type: 'room',
      room: {
        x, y,
        type: room.type,
        name: room.name,
        description: room.description,
        players: playerList,
        items: room.items,
        monsters: room.monsters
      },
      mapSize: mapSize,
      mapInfo: {
        world,
        ...(world === 1 ? { village: VILLAGE_POS } : {}),
        regions
      },
      nearbyRooms
    })
  );
  if (room.type === ROOM_TYPE.VILLAGE) {
    player.ws.send(
      JSON.stringify({
        type: 'system',
        message: '[마을 명령어 안내]\n/상점 : 상점 이용\n/여관 : 여관 이용(체력/마나 회복)\n/정보 : 내 능력치 확인\n/지도 : 전체맵 보기\n/텔포 : 월드 이동(예: /텔포 무인도, /텔포 마을)'
      })
    );
  }
}

/**
 * 방에 있는 모든 유저에게 방 정보 전송
 */
function sendRoomInfoToAllInRoom(players, world, x, y, getRoom, getPlayersInRoom, _MAP_SIZE, VILLAGE_POS) {
  Object.values(players).forEach((p) => {
    if (p && p.world === world && p.position && p.position.x === x && p.position.y === y) {
      sendRoomInfo(p, getRoom, getPlayersInRoom, _MAP_SIZE, VILLAGE_POS);
    }
  });
}

/**
 * 인벤토리 정보 전송
 */
function sendInventory(player) {
  player.ws.send(
    JSON.stringify({
      type: 'inventory',
      inventory: player.inventory
    })
  );
}

/**
 * 캐릭터(플레이어) 정보 전송
 */
function sendCharacterInfo(player) {
  const info = {
    hp: player.hp,
    maxHp: player.maxHp,
    mp: player.mp,
    maxMp: player.maxMp,
    str: player.str,
    dex: player.dex,
    int: player.int,
    atk: typeof player.getAtk === 'function' ? player.getAtk() : player.atk,
    def: typeof player.getDef === 'function' ? player.getDef() : player.def,
    strExp: player.strExp,
    strExpMax: player.strExpMax,
    dexExp: player.dexExp,
    dexExpMax: player.dexExpMax,
    intExp: player.intExp,
    intExpMax: player.intExpMax,
    gold: player.gold
  };
  player.ws.send(JSON.stringify({ type: 'character', info }));
}

module.exports = { broadcast, sendPlayerList, sendRoomInfo, sendRoomInfoToAllInRoom, sendInventory, sendCharacterInfo, Room }; 