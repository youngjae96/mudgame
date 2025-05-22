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
  // 길드별 총 회복량 누적용 맵
  const guildHealMap = {};
  for (const healer of healers) {
    // 길드가 없으면 클랜힐 자동 중단
    if (!healer.guildName) {
      healer.clanHealOn = false;
      delete healer.clanHealWorld;
      delete healer.clanHealX;
      delete healer.clanHealY;
      if (healer.ws && healer.ws.readyState === 1) {
        healer.ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '길드가 없어 클랜힐이 비활성화되었습니다.' }));
      }
      continue;
    }
    // 클랜힐 on한 자리에서만 유지
    if (
      healer.clanHealWorld !== undefined &&
      (healer.world !== healer.clanHealWorld || healer.position.x !== healer.clanHealX || healer.position.y !== healer.clanHealY)
    ) {
      healer.clanHealOn = false;
      delete healer.clanHealWorld;
      delete healer.clanHealX;
      delete healer.clanHealY;
      if (healer.ws && healer.ws.readyState === 1) {
        healer.ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '이동/위치 변경으로 클랜힐이 비활성화되었습니다.' }));
      }
      continue;
    }
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
      const realMaxHp = typeof target.getRealMaxHp === 'function' ? target.getRealMaxHp() : target.maxHp;
      // 실제 회복량이 아니라, 힐러의 회복량을 무조건 합산
      const healed = healAmount;
      target.hp = Math.min(realMaxHp, target.hp + healAmount);
      healedNames.push(target.name);
      if (target.ws && target.ws.readyState === 1) {
        require('./utils/broadcast').sendCharacterInfo(target);
      }
      healer.clanHealTotal = (healer.clanHealTotal || 0) + healed;
      if (healer.guildName && healed > 0) {
        guildHealMap[healer.guildName] = (guildHealMap[healer.guildName] || 0) + healed;
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
    // 인트 경험치: 회복량의 절반만큼 증가
    let intExpAmount = healAmount * 0.5;
    if (typeof healer.gainIntExp === 'function') {
      healer.gainIntExp(intExpAmount);
    } else {
      healer.intExp = (healer.intExp || 0) + intExpAmount;
    }
  }
  // 모든 힐러 처리 후, 길드별로 총 회복량을 한 번에 DB에 반영
  for (const [guildName, totalHealed] of Object.entries(guildHealMap)) {
    await Guild.updateOne(
      { name: guildName },
      { $inc: { clanHealTotal: totalHealed } }
    );
  }
}

module.exports = {
  PlayerManager: new PlayerManager(),
  clanHealTick,
}; 