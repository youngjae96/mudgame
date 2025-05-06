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

// 클랜힐 효과 주기적 적용 (중복 허용)
async function clanHealTick(PlayerManager, Guild) {
  const allPlayers = PlayerManager.getAllPlayers();
  // 길드 정보 실시간 동기화 (매 tick마다)
  for (const player of Object.values(allPlayers)) {
    const guild = await Guild.findOne({ members: player.name });
    if (guild) {
      player.guildName = guild.name;
    } else {
      player.guildName = undefined;
    }
  }
  // clanHealOn인 유저 목록
  const healers = Object.values(allPlayers).filter(p => p.clanHealOn);
  if (!healers.length) return;
  // 각 힐러별로 길드원(자기 포함)에게 회복 적용
  for (const healer of healers) {
    let targets = [healer];
    // 길드가 있으면 길드원 전체(접속 중인 유저만)
    if (healer.guildName) {
      const guild = await Guild.findOne({ name: healer.guildName });
      if (guild && Array.isArray(guild.members)) {
        targets = guild.members
          .map(name => allPlayers[name])
          .filter(Boolean);
      }
    }
    // 회복량 계산: 1 + Math.floor(healer.int / 5) (인트 5마다 1씩 증가)
    const healAmount = 1 + Math.floor((healer.int || 0) / 5);
    const healedNames = [];
    for (const target of targets) {
      if (target.hp < target.maxHp) {
        target.hp = Math.min(target.maxHp, target.hp + healAmount);
        healedNames.push(target.name);
        // HP가 변한 유저에게 캐릭터 정보 실시간 전송
        if (target.ws && target.ws.readyState === 1) {
          require('./utils/broadcast').sendCharacterInfo(target);
        }
      }
    }
    // 힐러 본인에게만 안내 메시지 전송
    if (healer.ws && healer.ws.readyState === 1) {
      healer.ws.send(JSON.stringify({
        type: 'system',
        subtype: 'event',
        message: `클랜힐: ${healAmount} 회복 | 대상: ${targets.map(t => t.name).join(', ')} | 힐러: ${healer.name}`
      }));
    }
    // 인트 경험치 소량 증가
    if (typeof healer.gainIntExp === 'function') {
      healer.gainIntExp(1.3);
    } else {
      healer.intExp = (healer.intExp || 0) + 1.3;
    }
  }
}

module.exports = {
  PlayerManager: new PlayerManager(),
  clanHealTick,
}; 