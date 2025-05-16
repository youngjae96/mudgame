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
function sendRoomInfo(player, getRoom, getPlayersInRoom, _MAP_SIZE, VILLAGE_POS, options = {}) {
  const { x, y } = player.position;
  const world = player.world || 1;
  const room = getRoom(world, x, y);
  if (!room) {
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
  let regionSize = mapSize;
  if (world === 5) regionSize = 7;
  for (let yy = 0; yy < regionSize; yy++) {
    const row = [];
    for (let xx = 0; xx < regionSize; xx++) {
      const r = getRoom(world, xx, yy);
      if (r) {
        row.push(r.type);
      }
    }
    if (row.length) regions.push(row);
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
  // 안내 메시지는 입장/갱신 유저에게만 1회 전송 (options.skipGuide가 아니면)
  if (room.type === ROOM_TYPE.VILLAGE && !options.skipGuide) {
    player.ws.send(
      JSON.stringify({
        type: 'system',
        message: '[마을 명령어 안내]\n/상점 : 상점 이용\n/여관 : 여관 이용(체력/마나 회복)\n/텔포 : 월드 이동(예: /텔포 무인도, /텔포 무인도2, /텔포 사막, /텔포 마을)\n/길드 : 길드 명령어 안내(/길드 <생성|가입|수락|탈퇴|추방|공지|정보|목록|해체|채팅|채팅로그> ...)\n/도움말 : 명령어 전체 안내'
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
      // 안내 메시지는 반복 전송 방지 (skipGuide: true)
      sendRoomInfo(p, getRoom, getPlayersInRoom, _MAP_SIZE, VILLAGE_POS, { skipGuide: true });
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
  if (typeof player.normalizeHp === 'function') player.normalizeHp();
  // 장비 옵션 합산
  const weapon = player.equipWeapon || {};
  const armor = player.equipArmor || {};
  const strBonus = (weapon.str || 0) + (armor.str || 0);
  const dexBonus = (weapon.dex || 0) + (armor.dex || 0);
  const intBonus = (weapon.int || 0) + (armor.int || 0);
  const hpBonus = (weapon.hp || 0) + (armor.hp || 0);
  const mpBonus = (weapon.mp || 0) + (armor.mp || 0);
  const realStr = player.str + strBonus;
  const realDex = player.dex + dexBonus;
  const realInt = player.int + intBonus;
  const realMaxHp = (typeof player.getRealMaxHp === 'function' ? player.getRealMaxHp() : player.maxHp);
  const realMaxMp = player.maxMp + mpBonus;
  const info = {
    hp: player.hp,
    maxHp: realMaxHp,
    mp: player.mp,
    maxMp: realMaxMp,
    str: realStr,
    dex: realDex,
    int: realInt,
    atk: typeof player.getAtk === 'function' ? player.getAtk() : player.atk,
    def: typeof player.getDef === 'function' ? player.getDef() : player.def,
    strExp: player.strExp,
    strExpMax: player.strExpMax,
    dexExp: player.dexExp,
    dexExpMax: player.dexExpMax,
    intExp: player.intExp,
    intExpMax: player.intExpMax,
    gold: player.gold,
    equipWeapon: player.equipWeapon || null,
    equipArmor: player.equipArmor || null,
    expEventActive: !!global.expDoubleEvent
  };
  player.ws.send(JSON.stringify({ type: 'character', info }));
}

module.exports = { broadcast, sendPlayerList, sendRoomInfo, sendRoomInfoToAllInRoom, sendInventory, sendCharacterInfo, Room }; 