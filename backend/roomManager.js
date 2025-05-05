const Room = require('./utils/Room');

// RoomManager: 방(월드, x, y)별로 플레이어/아이템/몬스터를 관리
class RoomManager {
  constructor() {
    // rooms[world][x][y] = Room
    this.rooms = {};
  }
  getRoom(world, x, y) {
    if (!this.rooms[world]) this.rooms[world] = {};
    if (!this.rooms[world][x]) this.rooms[world][x] = {};
    if (!this.rooms[world][x][y]) this.rooms[world][x][y] = new Room(x, y, undefined, undefined, undefined, world);
    return this.rooms[world][x][y];
  }
  addPlayerToRoom(playerName, world, x, y) {
    this.getRoom(world, x, y).addPlayer(playerName);
  }
  removePlayerFromRoom(playerName, world, x, y) {
    this.getRoom(world, x, y).removePlayer(playerName);
  }
  getPlayersInRoom(world, x, y) {
    return Array.from(this.getRoom(world, x, y).players);
  }
}

module.exports = new RoomManager(); 