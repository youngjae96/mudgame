// 구매/판매 명령어 핸들러 클래스화
let shopServiceInstance = null;

function setShopServiceInstance(shopService) {
  shopServiceInstance = shopService;
}

class BuyCommand {
  execute(args) {
    return shopServiceInstance.buyItem(args);
  }
}

class SellCommand {
  execute(args) {
    return shopServiceInstance.sellItem(args);
  }
}

module.exports = {
  setShopServiceInstance,
  BuyCommand,
  SellCommand,
}; 