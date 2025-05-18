// 플레이어 관련 명령어 클래스화
let playerServiceInstance = null;

function setPlayerServiceInstance(instance) {
  playerServiceInstance = instance;
}

class EquipCommand {
  async execute(args) {
    return playerServiceInstance.equipItem(args);
  }
}
class UnequipCommand {
  async execute(args) {
    return playerServiceInstance.unequipItem(args);
  }
}
// TODO: handleMapCommand, handleSaveCommand도 같은 방식으로 추가(임시 더미)
class MapCommand {
  async execute(args) {
    if (!playerServiceInstance || typeof playerServiceInstance.handleMapCommand !== 'function') {
      if (args.ws) args.ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '지도 명령어가 구현되어 있지 않습니다.' }));
      return;
    }
    return playerServiceInstance.handleMapCommand(args);
  }
}
class SaveCommand {
  async execute(args) {
    if (!playerServiceInstance || typeof playerServiceInstance.handleSaveCommand !== 'function') {
      if (args.ws) args.ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '저장 명령어가 구현되어 있지 않습니다.' }));
      return;
    }
    return playerServiceInstance.handleSaveCommand(args);
  }
}
class CandyCommand {
  async execute(args) {
    return playerServiceInstance.useCandyItem(args);
  }
}
class CandyBuffStatusCommand {
  async execute(args) {
    const { ws, playerName, players } = args;
    const player = players[playerName];
    if (!player) return;
    const now = Date.now();
    const leftSec = Math.floor((player.expCandyBuffUntil - now) / 1000);
    if (player.expCandyBuffUntil && leftSec > 0) {
      const hour = Math.floor(leftSec / 3600);
      const min = Math.floor((leftSec % 3600) / 60);
      const sec = leftSec % 60;
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `경험치 사탕 버프 남은 시간: ${hour}시간 ${min}분 ${sec}초` }));
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '경험치 사탕 버프가 없습니다.' }));
    }
  }
}

module.exports = {
  setPlayerServiceInstance,
  EquipCommand,
  UnequipCommand,
  MapCommand,
  SaveCommand,
  CandyCommand,
  CandyBuffStatusCommand,
}; 