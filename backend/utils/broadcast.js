/**
 * broadcast.js: 서버-클라이언트 메시지/정보 전송 유틸
 * - broadcast: 전체 클라이언트에 메시지 전송
 * - sendPlayerList: 플레이어 목록 전송
 * - sendRoomInfo: 방 정보 전송
 * - sendInventory: 인벤토리 전송
 * - sendCharacterInfo: 캐릭터 정보 전송
 */
const { ROOM_TYPE } = require('../data/map');

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
function sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS) {
  const { x, y } = player.position;
  const world = player.world || 1;
  const room = getRoom(world, x, y);
  const playerList = getPlayersInRoom(x, y);
  // 5x5 주변 방 정보
  const half = 2;
  const nearbyRooms = [];
  for (let dy = y - half; dy <= y + half; dy++) {
    for (let dx = x - half; dx <= x + half; dx++) {
      if (dx >= 0 && dx < MAP_SIZE && dy >= 0 && dy < MAP_SIZE) {
        const r = getRoom(world, dx, dy);
        if (r) nearbyRooms.push({ x: dx, y: dy, type: r.type });
      }
    }
  }
  // 전체 맵 지역 정보 생성
  const regions = [];
  for (let yy = 0; yy < MAP_SIZE; yy++) {
    const row = [];
    for (let xx = 0; xx < MAP_SIZE; xx++) {
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
      mapSize: MAP_SIZE,
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
    atk: player.atk,
    def: player.def,
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

module.exports = { broadcast, sendPlayerList, sendRoomInfo, sendInventory, sendCharacterInfo }; 