// 귀환/랭킹/클랜힐 명령어 핸들러 클래스화
const { PlayerManager } = require('../playerManager');
const RoomManager = require('../roomManager');
const { getRoom } = require('../data/map');
const PlayerData = require('../models/PlayerData');
const { sendRoomInfoToAllInRoom } = require('../utils/broadcast');

const returnCooldown = {};
class ReturnCommand {
  async execute({ ws, playerName, PlayerManager, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo }) {
    const now = Date.now();
    if (returnCooldown[playerName] && now - returnCooldown[playerName] < 5000) {
      const left = ((5000 - (now - returnCooldown[playerName])) / 1000).toFixed(1);
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[귀환] 쿨타임: ${left}초 후 다시 사용하세요.` }));
      return;
    }
    returnCooldown[playerName] = now;
    const player = PlayerManager.getPlayer(playerName);
    if (!player) return;
    RoomManager.removePlayerFromRoom(playerName, player.world, player.position.x, player.position.y);
    player.world = 1;
    player.position.x = 4;
    player.position.y = 4;
    RoomManager.addPlayerToRoom(playerName, player.world, player.position.x, player.position.y);
    PlayerManager.addPlayer(playerName, player);
    ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[귀환] 1번 마을(마을 광장)으로 귀환합니다!' }));
    sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
    sendInventory(player);
    sendCharacterInfo(player);
    sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
  }
}

class RankingCommand {
  async execute({ ws, PlayerManager }) {
    try {
      const players = await PlayerData.find({}, 'name str dex int').lean();
      const ranked = players
        .filter(p => p.name !== 'admin')
        .map(p => ({
          name: p.name,
          total: (p.str || 0) + (p.dex || 0) + (p.int || 0),
          str: p.str || 0,
          dex: p.dex || 0,
          int: p.int || 0,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
      if (!ranked.length) {
        ws.send(JSON.stringify({ type: 'system', message: '[랭킹] 랭킹에 등록된 유저가 없습니다.' }));
        return;
      }
      const msg = '[TOP 10 스탯 랭킹]\n' +
        ranked.map((p, i) => `${i + 1}. ${p.name} (힘:${p.str} 민첩:${p.dex} 인트:${p.int})`).join('\n');
      ws.send(JSON.stringify({ type: 'system', message: msg }));
    } catch (err) {
      ws.send(JSON.stringify({ type: 'system', message: '[랭킹] 랭킹 조회 중 오류가 발생했습니다.' }));
    }
  }
}

class ClanHealCommand {
  async execute({ ws, player, battleIntervals }) {
    if (!player.guildName) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '길드에 가입해야 클랜힐을 사용할 수 있습니다.' }));
      return;
    }
    const hasScroll = player.inventory && player.inventory.some(i => i.name === '클랜힐 스크롤');
    if (!hasScroll) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '클랜힐 스크롤이 있어야 클랜힐을 사용할 수 있습니다.' }));
      return;
    }
    if (battleIntervals && battleIntervals[player.name]) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '사냥(자동전투) 중에는 클랜힐을 켤 수 없습니다.' }));
      return;
    }
    if (!player.clanHealOn) {
      player.clanHealOn = true;
      player.clanHealWorld = player.world;
      player.clanHealX = player.position.x;
      player.clanHealY = player.position.y;
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '클랜힐이 활성화되었습니다! (인트 경험치가 오릅니다)' }));
    } else {
      player.clanHealOn = false;
      delete player.clanHealWorld;
      delete player.clanHealX;
      delete player.clanHealY;
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '클랜힐이 비활성화되었습니다.' }));
    }
  }
}

module.exports = { ReturnCommand, RankingCommand, ClanHealCommand }; 