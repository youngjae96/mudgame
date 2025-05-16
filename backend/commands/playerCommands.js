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

module.exports = {
  setPlayerServiceInstance,
  EquipCommand,
  UnequipCommand,
  MapCommand,
  SaveCommand,
}; 