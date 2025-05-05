const Room = require('../models/Room');
const Monster = require('../models/Monster');
const { FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS, ISLAND_MONSTERS, CAVE_BOSS_MONSTERS } = require('./items');

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

const MAP_SIZE_CAVE = 30;
const CAVE_ZONES = [
  { name: '동굴 입구', type: ROOM_TYPE.CAVE, yStart: 0, yEnd: 9, monsters: CAVE_MONSTERS },
  { name: '동굴 중간', type: ROOM_TYPE.CAVE, yStart: 10, yEnd: 19, monsters: FOREST_MONSTERS },
  { name: '동굴 심층', type: ROOM_TYPE.CAVE, yStart: 20, yEnd: 29, monsters: CAVE_MONSTERS },
];

// 동굴맵(월드3)
const roomsCave = [];
// 강한 몬스터 15종을 5마리씩 3구역에 배치
const bossIdxs = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14];
const bossEntrance = bossIdxs.slice(0,5);
const bossMiddle = bossIdxs.slice(5,10);
bossDeep = bossIdxs.slice(10,15);
let bossEntrancePos = [], bossMiddlePos = [], bossDeepPos = [];
// 입구 구역(0~9층)에서 5개 랜덤 위치 선정
while (bossEntrancePos.length < 5) {
  let x = Math.floor(Math.random() * MAP_SIZE_CAVE);
  let y = Math.floor(Math.random() * 10);
  if (!bossEntrancePos.some(p => p.x === x && p.y === y)) bossEntrancePos.push({x,y});
}
// 중간 구역(10~19층)에서 5개 랜덤 위치 선정
while (bossMiddlePos.length < 5) {
  let x = Math.floor(Math.random() * MAP_SIZE_CAVE);
  let y = 10 + Math.floor(Math.random() * 10);
  if (!bossMiddlePos.some(p => p.x === x && p.y === y)) bossMiddlePos.push({x,y});
}
// 심층 구역(20~29층)에서 5개 랜덤 위치 선정
while (bossDeepPos.length < 5) {
  let x = Math.floor(Math.random() * MAP_SIZE_CAVE);
  let y = 20 + Math.floor(Math.random() * 10);
  if (!bossDeepPos.some(p => p.x === x && p.y === y)) bossDeepPos.push({x,y});
}
let bossEntranceCount = 0, bossMiddleCount = 0, bossDeepCount = 0;
// 각 구역별 추가 몬스터 위치 선정 (보스/벽 제외)
function getRandomMonsterPositions(zoneStart, zoneEnd, count, excludePositions) {
  const positions = [];
  while (positions.length < count) {
    let x = Math.floor(Math.random() * MAP_SIZE_CAVE);
    let y = zoneStart + Math.floor(Math.random() * (zoneEnd - zoneStart + 1));
    if (
      !positions.some(p => p.x === x && p.y === y) &&
      !excludePositions.some(p => p.x === x && p.y === y)
    ) {
      positions.push({ x, y });
    }
  }
  return positions;
}
const extraEntrance = getRandomMonsterPositions(0, 9, 120, bossEntrancePos.concat(bossMiddlePos, bossDeepPos));
const extraMiddle = getRandomMonsterPositions(10, 19, 130, bossEntrancePos.concat(bossMiddlePos, bossDeepPos, extraEntrance));
const extraDeep = getRandomMonsterPositions(20, 29, 140, bossEntrancePos.concat(bossMiddlePos, bossDeepPos, extraEntrance, extraMiddle));
for (let y = 0; y < MAP_SIZE_CAVE; y++) {
  for (let x = 0; x < MAP_SIZE_CAVE; x++) {
    // 보스 위치 여부
    const isBossEntrance = bossEntrancePos.some(p => p.x === x && p.y === y);
    const isBossMiddle = bossMiddlePos.some(p => p.x === x && p.y === y);
    const isBossDeep = bossDeepPos.some(p => p.x === x && p.y === y);
    // 사다리 방: 입구 왼쪽 위 모서리(x=0, y=9)에 고정 배치
    if (x === 0 && y === 9) {
      const room = new Room(x, y, 'ladder', '사다리', '지상으로 올라가는 사다리가 있다. 여기서 "/나가기" 명령어를 입력하면 무인도 동굴 입구로 나갈 수 있습니다.');
      roomsCave.push(room);
      continue;
    }
    // 미로 벽: 20% 확률로 벽 생성 (입구/출구/가장자리/보스 위치 제외)
    let isWall = false;
    if (!isBossEntrance && !isBossMiddle && !isBossDeep && !(x === 0 && y === 0) && !(x === MAP_SIZE_CAVE-1 && y === MAP_SIZE_CAVE-1) && x !== 0 && y !== 0 && x !== MAP_SIZE_CAVE-1 && y !== MAP_SIZE_CAVE-1) {
      if (Math.random() < 0.20) isWall = true;
    }
    if (isWall) {
      const room = new Room(x, y, 'cave_wall', '동굴 벽', '두꺼운 암벽이 길을 막고 있습니다.');
      roomsCave.push(room);
      continue;
    }
    // 강한 몬스터 배치
    let monsters = [];
    if (isBossEntrance) {
      monsters.push(new Monster(CAVE_BOSS_MONSTERS[bossEntrance[bossEntranceCount]], x, y));
      bossEntranceCount++;
    } else if (isBossMiddle) {
      monsters.push(new Monster(CAVE_BOSS_MONSTERS[bossMiddle[bossMiddleCount]], x, y));
      bossMiddleCount++;
    } else if (isBossDeep) {
      monsters.push(new Monster(CAVE_BOSS_MONSTERS[bossDeep[bossDeepCount]], x, y));
      bossDeepCount++;
    } else if (extraEntrance.some(p => p.x === x && p.y === y)) {
      monsters.push(new Monster(CAVE_BOSS_MONSTERS[Math.floor(Math.random()*CAVE_BOSS_MONSTERS.length)], x, y));
    } else if (extraMiddle.some(p => p.x === x && p.y === y)) {
      monsters.push(new Monster(CAVE_BOSS_MONSTERS[Math.floor(Math.random()*CAVE_BOSS_MONSTERS.length)], x, y));
    } else if (extraDeep.some(p => p.x === x && p.y === y)) {
      monsters.push(new Monster(CAVE_MONSTERS[Math.floor(Math.random()*CAVE_MONSTERS.length)], x, y));
    }
    // 구역 결정
    const zone = CAVE_ZONES.find(z => y >= z.yStart && y <= z.yEnd);
    let type = zone.type;
    let name = zone.name;
    let description = `${zone.name} (동굴 ${y+1}층)`;
    const room = new Room(x, y, type, name, description);
    for (const m of monsters) room.monsters.push(m);
    roomsCave.push(room);
  }
}

// 무인도맵(roomsIsland)에서 x=2, y=6 위치를 동굴 입구로 지정
const caveEntrance = roomsIsland.find(r => r.x === 2 && r.y === 6);
if (caveEntrance) {
  caveEntrance.type = 'cave_entrance';
  caveEntrance.name = '동굴 입구';
  caveEntrance.description = '깊고 어두운 동굴로 들어가는 입구입니다. 여기서 "/입장" 명령어를 입력하면 동굴로 들어갈 수 있습니다.';
}

// worlds 객체를 모든 맵 생성 이후에 선언
const worlds = { 1: rooms, 2: roomsIsland, 3: roomsCave };
function getRoom(world, x, y) {
  const arr = worlds[world] || rooms;
  return arr.find(r => r.x === x && r.y === y);
}

module.exports = { MAP_SIZE, VILLAGE_POS, rooms, getRoom, worlds, ISLAND_VILLAGE_POS, ROOM_TYPE }; 