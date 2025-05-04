const PlayerService = require('../services/PlayerService');
const PlayerController = {
  handleEquipCommand(args) {
    return PlayerService.equipItem(args);
  },
  handleUnequipCommand(args) {
    return PlayerService.unequipItem(args);
  }
};

module.exports = PlayerController; 