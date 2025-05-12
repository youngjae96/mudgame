// 상점 명령어 핸들러 분리
const PlayerGameService = require('../services/PlayerGameService');
const { PlayerManager } = require('../playerManager');
const { getRoom } = require('../data/map');
const { SHOP_ITEMS } = require('../data/items');

function handleShopCommand(args) {
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

function handleShopSellCommand(args) {
  return PlayerGameService.handleShopSell({
    ...args,
    PlayerManager,
    getRoom,
    SHOP_ITEMS,
  });
}

module.exports = { handleShopCommand, handleShopSellCommand }; 