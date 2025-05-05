let playerServiceInstance = null;

const PlayerController = {
  setPlayerServiceInstance(instance) {
    playerServiceInstance = instance;
  },
  handleEquipCommand(args) {
    return playerServiceInstance.equipItem(args);
  },
  handleUnequipCommand(args) {
    return playerServiceInstance.unequipItem(args);
  }
};

module.exports = PlayerController; 