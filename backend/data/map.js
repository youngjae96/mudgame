const Room = require('../models/Room');
const Monster = require('../models/Monster');
const { FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS, ISLAND_MONSTERS } = require('./items');

const MAP_SIZE = 9;
const VILLAGE_POS = { x: 4, y: 4 };

const ROOM_TYPE = {
  VILLAGE: 'village',
  FOREST: 'forest',
  CAVE: 'cave',
  FIELD: 'field',
  BEACH: 'beach',
  SEA: 'sea',
  JUNGLE: 'jungle',
  VOLCANO: 'volcano',
  ISLANDFIELD: 'islandfield',
};

const FIELD_TYPES = [
  { type: ROOM_TYPE.FIELD, name: '초원 사냥터', description: '푸른 풀밭이 펼쳐진 사냥터입니다. 몬스터가 자주 출몰합니다.' },
  { type: ROOM_TYPE.FOREST, name: '숲 사냥터', description: '울창한 숲, 강한 몬스터가 출몰합니다.' },
  { type: ROOM_TYPE.CAVE, name: '동굴 사냥터', description: '어두운 동굴, 희귀한 몬스터가 있습니다.' }
];

const rooms = [];
for (let y = 0; y < MAP_SIZE; y++) {
  for (let x = 0; x < MAP_SIZE; x++) {
    let type, name, description, monsterChance;
    let monsters = [];
    if (x === VILLAGE_POS.x && y === VILLAGE_POS.y) {
      type = ROOM_TYPE.VILLAGE;
      name = '마을 광장';
      description = '여기는 안전한 마을입니다. 몬스터가 나타나지 않습니다.';
      monsterChance = 0;
    } else if (y <= 2) {
      type = ROOM_TYPE.FOREST;
      name = '숲 사냥터';
      description = '울창한 숲, 강한 몬스터가 출몰합니다.';
      monsterChance = 1;
      if (y === 0 && x === 2) monsters.push(new Monster(FOREST_MONSTERS[0], x, y));
      if (y === 1 && x === 6) monsters.push(new Monster(FOREST_MONSTERS[1], x, y));
      if (y === 2 && x === 4) monsters.push(new Monster(FOREST_MONSTERS[2], x, y));
      if (y === 0 && x === 7) monsters.push(new Monster(FOREST_MONSTERS[3], x, y));
    } else if (y >= 6) {
      type = ROOM_TYPE.CAVE;
      name = '동굴 사냥터';
      description = '어두운 동굴, 희귀한 몬스터가 있습니다.';
      monsterChance = 1;
      if (y === 6 && x === 2) monsters.push(new Monster(CAVE_MONSTERS[0], x, y));
      if (y === 7 && x === 5) monsters.push(new Monster(CAVE_MONSTERS[1], x, y));
      if (y === 8 && x === 4) monsters.push(new Monster(CAVE_MONSTERS[2], x, y));
      if (y === 6 && x === 7) monsters.push(new Monster(CAVE_MONSTERS[3], x, y));
    } else {
      type = ROOM_TYPE.FIELD;
      name = '초원 사냥터';
      description = '푸른 풀밭이 펼쳐진 사냥터입니다. 몬스터가 자주 출몰합니다.';
      monsterChance = 1;
    }
    const room = new Room(x, y, type, name, description);
    for (const m of monsters) room.monsters.push(m);
    if (monsters.length === 0 && monsterChance) {
      let pool = FIELD_MONSTERS;
      if (type === ROOM_TYPE.FOREST) pool = FOREST_MONSTERS;
      if (type === ROOM_TYPE.CAVE) pool = CAVE_MONSTERS;
      const m = new Monster(pool[Math.floor(Math.random() * pool.length)], x, y);
      room.monsters.push(m);
    }
    rooms.push(room);
  }
}

// 무인도 월드(월드2)
const roomsIsland = [];
const ISLAND_VILLAGE_POS = { x: 4, y: 7 };
for (let y = 0; y < MAP_SIZE; y++) {
  for (let x = 0; x < MAP_SIZE; x++) {
    let type, name, description;
    let monsters = [];
    if (x === 0 || x === 8 || y === 0 || y === 8) {
      type = ROOM_TYPE.SEA;
      name = '바다';
      description = '끝없이 펼쳐진 푸른 바다입니다.';
    } else if (x === 1 || x === 7 || y === 1 || y === 7) {
      // 무인도 오두막 고정 배치
      if (x === ISLAND_VILLAGE_POS.x && y === ISLAND_VILLAGE_POS.y) {
        type = ROOM_TYPE.VILLAGE;
        name = '무인도 오두막';
        description = '섬의 유일한 오두막입니다.';
      } else {
        type = ROOM_TYPE.BEACH;
        name = '무인도 해변';
        description = '파도가 밀려오는 고요한 해변입니다.';
        // 해변 몬스터 배치
        if (Math.random() < 0.7) monsters.push(new Monster(ISLAND_MONSTERS[0], x, y));
        if (Math.random() < 0.3) monsters.push(new Monster(ISLAND_MONSTERS[1], x, y));
      }
    } else if (x >= 3 && x <= 5 && y >= 3 && y <= 5) {
      type = ROOM_TYPE.JUNGLE;
      name = '무인도 정글';
      description = '울창한 정글, 야생의 기운이 느껴집니다.';
      // 정글 몬스터 배치
      if (Math.random() < 0.7) monsters.push(new Monster(ISLAND_MONSTERS[2], x, y));
      if (Math.random() < 0.3) monsters.push(new Monster(ISLAND_MONSTERS[3], x, y));
    } else if (x >= 6 && y >= 4 && y <= 6) {
      type = ROOM_TYPE.VOLCANO;
      name = '화산지대';
      description = '뜨거운 용암이 흐르는 위험한 화산지대입니다.';
      // 화산 몬스터 배치
      if (Math.random() < 0.7) monsters.push(new Monster(ISLAND_MONSTERS[4], x, y));
      if (Math.random() < 0.3) monsters.push(new Monster(ISLAND_MONSTERS[5], x, y));
    } else {
      type = ROOM_TYPE.ISLANDFIELD;
      name = '무인도 평지';
      description = '풀과 바람이 어우러진 무인도의 평지입니다.';
      // 평지 몬스터 배치
      if (Math.random() < 0.7) monsters.push(new Monster(ISLAND_MONSTERS[6], x, y));
      if (Math.random() < 0.3) monsters.push(new Monster(ISLAND_MONSTERS[7], x, y));
    }
    const room = new Room(x, y, type, name, description);
    for (const m of monsters) room.monsters.push(m);
    roomsIsland.push(room);
  }
}

const worlds = { 1: rooms, 2: roomsIsland };
function getRoom(world, x, y) {
  const arr = worlds[world] || rooms;
  return arr.find(r => r.x === x && r.y === y);
}

module.exports = { MAP_SIZE, VILLAGE_POS, rooms, getRoom, worlds, ISLAND_VILLAGE_POS, ROOM_TYPE }; 