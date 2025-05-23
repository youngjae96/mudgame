// monsterSpawner.js
const { ROOM_TYPE } = require('./data/map');

function respawnMonster(world, x, y, getRoom, FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS, Monster, getPlayersInRoom, sendRoomInfo, MAP_SIZE, VILLAGE_POS, players) {
  setTimeout(() => {
    const room = getRoom(world, x, y);
    if (room) {
      // hp <= 0인 몬스터는 모두 제거
      room.monsters = room.monsters.filter(m => m.hp > 0);
      if (room.monsters.length === 0) {
        let pool = FIELD_MONSTERS;
        if (room.type === ROOM_TYPE.FOREST) pool = FOREST_MONSTERS;
        if (room.type === ROOM_TYPE.CAVE) {
          if (world === 3) {
            const { CAVE_BOSS_MONSTERS } = require('./data/items');
            pool = CAVE_BOSS_MONSTERS;
          } else {
            pool = CAVE_MONSTERS;
          }
        }
        // 피라미드1/2 내부 방 타입에 대한 pool 지정
        if (
          room.type === 'pyramid' ||
          room.type === 'pyramid_wall' ||
          room.type === 'pyramid2_wall' ||
          room.type === 'pyramid_entrance' ||
          room.type === 'pyramid2_entrance' ||
          room.type === 'pyramid_exit' ||
          room.type === 'pyramid1_exit'
        ) {
          if (world === 6) pool = require('./data/monsters/pyramid.json');
          if (world === 7) pool = require('./data/monsters/pyramid2.json');
        }
        if (room.type !== ROOM_TYPE.VILLAGE) {
          const m = new Monster(pool[Math.floor(Math.random() * pool.length)], x, y);
          room.monsters.push(m);
        }
        const playerNames = getPlayersInRoom(world, x, y);
        playerNames.forEach((name) => sendRoomInfo(players[name], getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS));
      }
    }
  }, 20000);
}
module.exports = { respawnMonster }; 