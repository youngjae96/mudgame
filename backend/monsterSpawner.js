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
        if (room.type === ROOM_TYPE.CAVE) pool = CAVE_MONSTERS;
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