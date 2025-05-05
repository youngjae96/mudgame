// PlayerManager: 전체 플레이어를 관리하는 싱글턴
class PlayerManager {
  constructor() {
    this.players = {};
  }
  addPlayer(name, playerObj) {
    this.players[name] = playerObj;
  }
  removePlayer(name) {
    delete this.players[name];
  }
  getPlayer(name) {
    return this.players[name];
  }
  getAllPlayers() {
    return this.players;
  }
}

module.exports = new PlayerManager(); 