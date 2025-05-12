// 상점 명령어 핸들러 클래스화
const PlayerGameService = require('../services/PlayerGameService');
const { PlayerManager } = require('../playerManager');
const { getRoom } = require('../data/map');
const { SHOP_ITEMS } = require('../data/items');

class ShopCommand {
  async execute(args) {
    const SHOP_ITEMS_ARG = args.SHOP_ITEMS || SHOP_ITEMS;
    const categories = Object.keys(SHOP_ITEMS_ARG);
    if (!categories.length) {
      if (args.ws && typeof args.ws.send === 'function') {
        args.ws.send(JSON.stringify({ type: 'system', subtype: 'info', message: '[상점 카테고리]\n(카테고리가 없습니다)' }));
      }
      return;
    }
    return PlayerGameService.handleShop({
      ...args,
      PlayerManager,
      getRoom,
      SHOP_ITEMS: SHOP_ITEMS_ARG,
    });
  }
}

class ShopSellCommand {
  async execute(args) {
    return PlayerGameService.handleShopSell({
      ...args,
      PlayerManager,
      getRoom,
      SHOP_ITEMS,
    });
  }
}

module.exports = { ShopCommand, ShopSellCommand }; 