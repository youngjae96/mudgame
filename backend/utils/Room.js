class Room {
  constructor(x, y, type, name, description, world) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.name = name;
    this.description = description;
    this.world = world;
    this.players = new Set();
    this.items = [];
    this.monsters = [];
  }
  addPlayer(playerName) { this.players.add(playerName); }
  removePlayer(playerName) { this.players.delete(playerName); }
  hasPlayer(playerName) { return this.players.has(playerName); }
  addItem(item) { this.items.push(item); }
  removeItem(itemName) { this.items = this.items.filter(i => i.name !== itemName); }
  addMonster(monster) { this.monsters.push(monster); }
  removeMonster(monsterId) { this.monsters = this.monsters.filter(m => m.id !== monsterId); }
}
module.exports = Room; 