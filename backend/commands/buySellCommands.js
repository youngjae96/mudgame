// 구매/판매 명령어 핸들러 분리
let shopServiceInstance = null;

function setShopServiceInstance(shopService) {
  shopServiceInstance = shopService;
}

function handleBuyCommand(args) {
  return shopServiceInstance.buyItem(args);
}

function handleSellCommand(args) {
  return shopServiceInstance.sellItem(args);
}

module.exports = {
  setShopServiceInstance,
  handleBuyCommand,
  handleSellCommand,
}; 