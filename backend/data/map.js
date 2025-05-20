const Room = require('../utils/Room');
const Monster = require('../models/Monster');
const { FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS, ISLAND_MONSTERS, CAVE_BOSS_MONSTERS, ISLAND2_MONSTERS, DESERT_MONSTERS } = require('./items');
const PYRAMID_MONSTERS = require('./monsters/pyramid.json');
const RoomManager = require('../roomManager');

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
  DESERT: 'desert',
  OASIS: 'oasis',
  ROCK: 'rock',
  DESERTCAVE: 'desertcave',
  PYRAMID: 'pyramid',
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
    const room = new Room(x, y, type, name, description, 1);
    for (const m of monsters) room.monsters.push(m);
    rooms.push(room);
    registerRoomToManager(room, 1);
    if (monsters.length === 0 && monsterChance) {
      let pool = FIELD_MONSTERS;
      if (type === ROOM_TYPE.FOREST) pool = FOREST_MONSTERS;
      if (type === ROOM_TYPE.CAVE) pool = CAVE_MONSTERS;
      const m = new Monster(pool[Math.floor(Math.random() * pool.length)], x, y);
      room.monsters.push(m);
    }
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
    const room = new Room(x, y, type, name, description, 2);
    for (const m of monsters) room.monsters.push(m);
    roomsIsland.push(room);
    registerRoomToManager(room, 2);
  }
}

// 무인도2 월드(월드4)
const roomsIsland2 = [];
const ISLAND2_VILLAGE_POS = { x: 4, y: 7 };
for (let y = 0; y < MAP_SIZE; y++) {
  for (let x = 0; x < MAP_SIZE; x++) {
    let type, name, description;
    let monsters = [];
    if (x === 0 || x === 8 || y === 0 || y === 8) {
      type = ROOM_TYPE.SEA;
      name = '바다';
      description = '끝없이 펼쳐진 푸른 바다입니다.';
    } else if (x === 1 || x === 7 || y === 1 || y === 7) {
      // 무인도2 오두막 고정 배치
      if (x === ISLAND2_VILLAGE_POS.x && y === ISLAND2_VILLAGE_POS.y) {
        type = ROOM_TYPE.VILLAGE;
        name = '무인도2 오두막';
        description = '섬의 유일한 오두막입니다.';
      } else {
        type = ROOM_TYPE.BEACH;
        name = '무인도2 해변';
        description = '파도가 밀려오는 고요한 해변입니다.';
        // 해변 몬스터 배치
        if (Math.random() < 0.7) monsters.push(new Monster(ISLAND2_MONSTERS[0], x, y));
        if (Math.random() < 0.3) monsters.push(new Monster(ISLAND2_MONSTERS[1], x, y));
      }
    } else if (x >= 3 && x <= 5 && y >= 3 && y <= 5) {
      type = ROOM_TYPE.JUNGLE;
      name = '무인도2 정글';
      description = '울창한 정글, 야생의 기운이 느껴집니다.';
      // 정글 몬스터 배치
      if (Math.random() < 0.7) monsters.push(new Monster(ISLAND2_MONSTERS[2], x, y));
      if (Math.random() < 0.3) monsters.push(new Monster(ISLAND2_MONSTERS[3], x, y));
    } else if (x >= 6 && y >= 4 && y <= 6) {
      type = ROOM_TYPE.VOLCANO;
      name = '무인도2 화산지대';
      description = '뜨거운 용암이 흐르는 위험한 화산지대입니다.';
      // 화산 몬스터 배치
      if (Math.random() < 0.7) monsters.push(new Monster(ISLAND2_MONSTERS[1], x, y));
      if (Math.random() < 0.3) monsters.push(new Monster(ISLAND2_MONSTERS[2], x, y));
    } else {
      type = ROOM_TYPE.ISLANDFIELD;
      name = '무인도2 평지';
      description = '풀과 바람이 어우러진 무인도의 평지입니다.';
      // 평지 몬스터 배치
      if (Math.random() < 0.7) monsters.push(new Monster(ISLAND2_MONSTERS[0], x, y));
      if (Math.random() < 0.3) monsters.push(new Monster(ISLAND2_MONSTERS[3], x, y));
    }
    const room = new Room(x, y, type, name, description, 4);
    for (const m of monsters) room.monsters.push(m);
    roomsIsland2.push(room);
    registerRoomToManager(room, 4);
  }
}

const MAP_SIZE_CAVE = 30;
const CAVE_ZONES = [
  { name: '동굴 입구', type: ROOM_TYPE.CAVE, yStart: 0, yEnd: 9, monsters: CAVE_MONSTERS },
  { name: '동굴 중간', type: ROOM_TYPE.CAVE, yStart: 10, yEnd: 19, monsters: CAVE_MONSTERS },
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
      const room = new Room(x, y, 'ladder', '사다리', '지상으로 올라가는 사다리가 있다. 여기서 "/나가기" 명령어를 입력하면 무인도 동굴 입구로 나갈 수 있습니다.', 3);
      roomsCave.push(room);
      registerRoomToManager(room, 3);
      continue;
    }
    // 미로 벽: 20% 확률로 벽 생성 (입구/출구/가장자리/보스 위치 제외)
    let isWall = false;
    if (!isBossEntrance && !isBossMiddle && !isBossDeep && !(x === 0 && y === 0) && !(x === MAP_SIZE_CAVE-1 && y === MAP_SIZE_CAVE-1) && x !== 0 && y !== 0 && x !== MAP_SIZE_CAVE-1 && y !== MAP_SIZE_CAVE-1) {
      if (Math.random() < 0.20) isWall = true;
    }
    if (isWall) {
      const room = new Room(x, y, 'cave_wall', '동굴 벽', '두꺼운 암벽이 길을 막고 있습니다.', 3);
      roomsCave.push(room);
      registerRoomToManager(room, 3);
      continue;
    }
    // 강한 몬스터 배치
    let monsters = [];
    function getRandomCaveMonster() {
      // CAVE_MONSTERS와 CAVE_BOSS_MONSTERS를 합쳐서 랜덤 추출
      const pool = CAVE_MONSTERS.concat(CAVE_BOSS_MONSTERS);
      return pool[Math.floor(Math.random() * pool.length)];
    }
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
      monsters.push(new Monster(getRandomCaveMonster(), x, y));
    } else if (extraMiddle.some(p => p.x === x && p.y === y)) {
      monsters.push(new Monster(getRandomCaveMonster(), x, y));
    } else if (extraDeep.some(p => p.x === x && p.y === y)) {
      monsters.push(new Monster(getRandomCaveMonster(), x, y));
    }
    // 구역 결정
    const zone = CAVE_ZONES.find(z => y >= z.yStart && y <= z.yEnd);
    let type = zone.type;
    let name = zone.name;
    let description = `${zone.name} (동굴 ${y+1}층)`;
    const room = new Room(x, y, type, name, description, 3);
    for (const m of monsters) room.monsters.push(m);
    roomsCave.push(room);
    registerRoomToManager(room, 3);
  }
}

// 무인도맵(roomsIsland)에서 x=2, y=6 위치를 동굴 입구로 지정
const caveEntrance = roomsIsland.find(r => r.x === 2 && r.y === 6);
if (caveEntrance) {
  caveEntrance.type = 'cave_entrance';
  caveEntrance.name = '동굴 입구';
  caveEntrance.description = '깊고 어두운 동굴로 들어가는 입구입니다. 여기서 "/입장" 명령어를 입력하면 동굴로 들어갈 수 있습니다.';
}

// 사막맵(월드5)
const MAP_SIZE_DESERT = 7;
const DESERT_VILLAGE_POS = { x: 3, y: 3 };
const PYRAMID_ENTRANCE_POS = { x: 5, y: 2 };
const roomsDesert = [];
for (let y = 0; y < MAP_SIZE_DESERT; y++) {
  for (let x = 0; x < MAP_SIZE_DESERT; x++) {
    let type, name, description;
    let monsters = [];
    const rand = Math.random();
    if (x === DESERT_VILLAGE_POS.x && y === DESERT_VILLAGE_POS.y) {
      type = ROOM_TYPE.VILLAGE;
      name = '사막 마을';
      description = '사막 한가운데의 작은 오아시스 마을입니다. 야자수와 우물이 보입니다.';
    } else if (x === PYRAMID_ENTRANCE_POS.x && y === PYRAMID_ENTRANCE_POS.y) {
      type = 'pyramid_entrance';
      name = '피라미드 입구';
      description = '고대 피라미드의 입구가 보입니다. "/입장" 명령어로 들어갈 수 있습니다.';
    } else if ((x === 0 || x === MAP_SIZE_DESERT-1 || y === 0 || y === MAP_SIZE_DESERT-1)) {
      type = ROOM_TYPE.DESERT;
      name = '사막 외곽';
      description = '끝없이 펼쳐진 모래 언덕. 바람에 흔들리는 선인장과 바위가 드문드문 보입니다.';
      if (rand < 0.2) description += ' 멀리 해골이 보입니다.';
      if (rand < 0.5) monsters.push(new Monster(DESERT_MONSTERS[Math.floor(Math.random()*DESERT_MONSTERS.length)], x, y));
    } else if (rand < 0.10) {
      type = ROOM_TYPE.OASIS;
      name = '작은 오아시스';
      description = '맑은 물이 고인 오아시스. 야자수와 풀, 새들이 모여듭니다.';
      if (rand < 0.05) description += ' 오아시스에 낙타가 쉬고 있습니다.';
      if (Math.random() < 0.5) monsters.push(new Monster(DESERT_MONSTERS[Math.floor(Math.random()*DESERT_MONSTERS.length)], x, y));
    } else if (rand < 0.18) {
      type = ROOM_TYPE.ROCK;
      name = '바위지대';
      description = '거대한 바위와 돌무더기가 흩어져 있습니다.';
      if (rand < 0.14) description += ' 바위 틈에 작은 선인장이 자랍니다.';
      if (Math.random() < 0.5) monsters.push(new Monster(DESERT_MONSTERS[Math.floor(Math.random()*DESERT_MONSTERS.length)], x, y));
    } else if (rand < 0.23) {
      type = ROOM_TYPE.DESERTCAVE;
      name = '사막 동굴';
      description = '모래 언덕 아래 어둡고 서늘한 동굴 입구가 있습니다.';
      if (rand < 0.25) description += ' 동굴 앞에 해골이 널려 있습니다.';
      if (Math.random() < 0.7) monsters.push(new Monster(DESERT_MONSTERS[Math.floor(Math.random()*DESERT_MONSTERS.length)], x, y));
    } else {
      type = ROOM_TYPE.DESERT;
      name = '사막';
      description = '뜨거운 태양 아래 펼쳐진 사막. 발자국과 선인장이 보입니다.';
      if (rand < 0.4) description += ' 작은 선인장이 자라고 있습니다.';
      if (rand > 0.7) description += ' 멀리 오아시스가 보이는 것 같습니다.';
      if (Math.random() < 0.5) monsters.push(new Monster(DESERT_MONSTERS[Math.floor(Math.random()*DESERT_MONSTERS.length)], x, y));
    }
    const room = new Room(x, y, type, name, description, 5);
    for (const m of monsters) room.monsters.push(m);
    roomsDesert.push(room);
    registerRoomToManager(room, 5);
  }
}

// 피라미드 내부 맵(월드6)
const MAP_SIZE_PYRAMID = 15;
const roomsPyramid = [];
// (5,2)~(0,0)까지 x축→y축 직선 경로를 통로로 지정
const pyramidPath = [];
for (let x = 5; x >= 0; x--) pyramidPath.push([x, 2]);
for (let y = 1; y >= 0; y--) pyramidPath.push([0, y]);
for (let y = 0; y < MAP_SIZE_PYRAMID; y++) {
  for (let x = 0; x < MAP_SIZE_PYRAMID; x++) {
    let type = ROOM_TYPE.PYRAMID;
    let name = '피라미드 내부';
    let description = '고대 피라미드의 미로 같은 내부입니다.';
    let monsters = [];
    // (0,0)은 사막으로 나가는 입구로 지정
    if (x === 0 && y === 0) {
      type = 'pyramid_exit';
      name = '피라미드 출구';
      description = '사막(피라미드 입구)로 나가는 출구입니다. "/나가기" 명령어로 사막으로 나갈 수 있습니다.';
    } else {
      // (5,2)~(0,0) 경로는 통로로 보장, 그 외에만 벽돌 생성
      const isPath = pyramidPath.some(([px, py]) => px === x && py === y);
      if (!isPath && Math.random() < 0.20) {
        type = 'pyramid_wall';
        name = '피라미드 벽';
        description = '두꺼운 벽돌이 길을 막고 있습니다. 통과할 수 없습니다.';
      }
    }
    // 피라미드 전용 몬스터/보스 배치
    if (type === ROOM_TYPE.PYRAMID) {
      // 피라미드 몬스터만 스폰 (20% 확률)
      if (Math.random() < 0.2) {
        monsters.push(new Monster(PYRAMID_MONSTERS[Math.floor(Math.random() * PYRAMID_MONSTERS.length)], x, y));
      }
    }
    const room = new Room(x, y, type, name, description, 6);
    for (const m of monsters) room.monsters.push(m);
    roomsPyramid.push(room);
    registerRoomToManager(room, 6);
  }
}

// worlds 객체를 모든 맵 생성 이후에 선언
const worlds = { 1: rooms, 2: roomsIsland, 3: roomsCave, 4: roomsIsland2, 5: roomsDesert, 6: roomsPyramid };
function getRoom(world, x, y) {
  const arr = worlds[world] || rooms;
  return arr.find(r => r.x === x && r.y === y);
}

// respawnMonster 래퍼 함수: getRoom을 항상 첫 인자로 넘겨줌
function respawnMonsterWithDeps(world, x, y) {
  if (world === 6) {
    // 피라미드 내부는 피라미드 몬스터만 리스폰
    respawnMonster(
      world, x, y,
      getRoom,
      PYRAMID_MONSTERS, PYRAMID_MONSTERS, PYRAMID_MONSTERS, Monster,
      getPlayersInRoom, sendRoomInfo, 15, { x: 0, y: 0 }, PlayerManager.getAllPlayers()
    );
    return;
  }
  // ... 기존 분기 ...
}

// RoomManager에 Room 자동 등록 함수
function registerRoomToManager(room, worldNum) {
  if (!RoomManager.rooms[worldNum]) RoomManager.rooms[worldNum] = {};
  if (!RoomManager.rooms[worldNum][room.x]) RoomManager.rooms[worldNum][room.x] = {};
  RoomManager.rooms[worldNum][room.x][room.y] = room;
}

module.exports = { MAP_SIZE, VILLAGE_POS, rooms, getRoom, worlds, ISLAND_VILLAGE_POS, ROOM_TYPE, roomsIsland2, ISLAND2_VILLAGE_POS }; 