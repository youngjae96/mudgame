/**
 * ShopController: REST API용 상점 컨트롤러
 * - getItems: 상점 아이템 목록 반환
 */
const { SHOP_ITEMS } = require('../data/items');

const ShopController = {
  /**
   * 상점 아이템 목록 반환
   */
  getItems(req, res) {
    res.json({ success: true, items: SHOP_ITEMS });
  }
};

module.exports = ShopController; 