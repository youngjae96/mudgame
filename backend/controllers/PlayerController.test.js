const PlayerController = require('./PlayerController');

describe('PlayerController', () => {
  it('setPlayerServiceInstance/handleEquipCommand/handleUnequipCommand 동작', async () => {
    const mockService = {
      equipItem: jest.fn().mockResolvedValue('장착완료'),
      unequipItem: jest.fn().mockResolvedValue('해제완료')
    };
    PlayerController.setPlayerServiceInstance(mockService);
    const equipResult = await PlayerController.handleEquipCommand({ foo: 1 });
    const unequipResult = await PlayerController.handleUnequipCommand({ bar: 2 });
    expect(mockService.equipItem).toHaveBeenCalledWith({ foo: 1 });
    expect(mockService.unequipItem).toHaveBeenCalledWith({ bar: 2 });
    expect(equipResult).toBe('장착완료');
    expect(unequipResult).toBe('해제완료');
  });
}); 