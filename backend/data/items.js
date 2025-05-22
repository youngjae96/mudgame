const ITEM_NAME_WOOD_SWORD = '나무검';
const ITEM_NAME_BRONZE_SWORD = '청동검';
const ITEM_NAME_IRON_SWORD = '철검';
const ITEM_NAME_SILVER_SWORD = '은검';
const ITEM_NAME_GOLD_SWORD = '금검';
const ITEM_NAME_MONGHWA = '몽환의 검';
const ITEM_NAME_CLOTH_ARMOR = '천갑옷';
const ITEM_NAME_LEATHER_ARMOR = '가죽갑옷';
const ITEM_NAME_IRON_ARMOR = '철갑옷';
const ITEM_NAME_SILVER_ARMOR = '은갑옷';
const ITEM_NAME_GOLD_ARMOR = '금갑옷';
const ITEM_NAME_FLAME_SWORD = '플레임소드';
const ITEM_NAME_FROST_SWORD = '서리검';
const ITEM_NAME_DRAGON_SWORD = '용의 검';
const ITEM_NAME_DARK_SWORD = '암흑검';
const ITEM_NAME_SKY_SWORD = '천공의 검';
const ITEM_NAME_FLAME_ARMOR = '플레임아머';
const ITEM_NAME_FROST_ARMOR = '서리갑옷';
const ITEM_NAME_DRAGON_ARMOR = '용의 갑옷';
const ITEM_NAME_DARK_ARMOR = '암흑갑옷';
const ITEM_NAME_SKY_ARMOR = '천공의 갑옷';
const ITEM_NAME_LARGE_POTION = '대형 물약';
const ITEM_NAME_KKUM = '꿈결의 검';
const ITEM_NAME_HWAN = '환상의 검';
const ITEM_NAME_YOUNG = '영원의 검';
const ITEM_NAME_IDLE10 = '신비의 검';
const ITEM_NAME_IDLE13 = '환영의 검';
const ITEM_NAME_IDLE15 = '몽중의 검';
const ITEM_NAME_IDLE18 = '영겁의 검';
const ITEM_NAME_IDLE20 = '초월의 검';
const ITEM_NAME_SUN_SWORD = '태양의 검';
const ITEM_NAME_DESERT_SWORD = '사막의 검';
const ITEM_NAME_SUN_ARMOR = '태양의 갑옷';
const ITEM_NAME_DESERT_ARMOR = '사막의 갑옷';

const ITEM_TYPE = {
  WEAPON: '무기',
  ARMOR: '방어구',
  CONSUMABLE: '잡화',
};

const ITEM_STAT_ATK = 'atk';
const ITEM_STAT_DEF = 'def';
const ITEM_STAT_STR = 'str';
const ITEM_STAT_DEX = 'dex';

const ITEM_POOL = require('./items/items.json');

const FIELD_MONSTERS = require('./monsters/field.json');
const FOREST_MONSTERS = require('./monsters/forest.json');
const CAVE_MONSTERS = require('./monsters/cave.json');

const ISLAND_MONSTERS = require('./monsters/island.json');

const ISLAND2_MONSTERS = require('./monsters/island2.json');

const CAVE_BOSS_MONSTERS = require('./monsters/cave_boss.json');

const DESERT_MONSTERS = require('./monsters/desert.json');

const PYRAMID_MONSTERS = require('./monsters/pyramid.json');

// 자동 상점 아이템 분류
const SHOP_ITEMS = {
  [ITEM_TYPE.WEAPON]: ITEM_POOL.filter(item => item.type === ITEM_TYPE.WEAPON && item.shopBuy),
  [ITEM_TYPE.ARMOR]: ITEM_POOL.filter(item => item.type === ITEM_TYPE.ARMOR && item.shopBuy),
  [ITEM_TYPE.CONSUMABLE]: ITEM_POOL.filter(item => item.type === ITEM_TYPE.CONSUMABLE && item.shopBuy),
};

module.exports = {
  ITEM_POOL,
  FIELD_MONSTERS,
  FOREST_MONSTERS,
  CAVE_MONSTERS,
  ISLAND_MONSTERS,
  ISLAND2_MONSTERS,
  DESERT_MONSTERS,
  PYRAMID_MONSTERS,
  CAVE_BOSS_MONSTERS,
  SHOP_ITEMS,
  ITEM_TYPE,
  ITEM_NAME_WOOD_SWORD,
  ITEM_NAME_BRONZE_SWORD,
  ITEM_NAME_IRON_SWORD,
  ITEM_NAME_SILVER_SWORD,
  ITEM_NAME_GOLD_SWORD,
  ITEM_NAME_MONGHWA,
  ITEM_NAME_CLOTH_ARMOR,
  ITEM_NAME_LEATHER_ARMOR,
  ITEM_NAME_IRON_ARMOR,
  ITEM_NAME_SILVER_ARMOR,
  ITEM_NAME_GOLD_ARMOR,
  ITEM_NAME_FLAME_SWORD,
  ITEM_NAME_FROST_SWORD,
  ITEM_NAME_DRAGON_SWORD,
  ITEM_NAME_DARK_SWORD,
  ITEM_NAME_SKY_SWORD,
  ITEM_NAME_FLAME_ARMOR,
  ITEM_NAME_FROST_ARMOR,
  ITEM_NAME_DRAGON_ARMOR,
  ITEM_NAME_DARK_ARMOR,
  ITEM_NAME_SKY_ARMOR,
  ITEM_STAT_ATK,
  ITEM_STAT_DEF,
  ITEM_STAT_STR,
  ITEM_STAT_DEX,
  ITEM_NAME_KKUM,
  ITEM_NAME_HWAN,
  ITEM_NAME_YOUNG,
  ITEM_NAME_SUN_SWORD,
  ITEM_NAME_DESERT_SWORD,
  ITEM_NAME_SUN_ARMOR,
  ITEM_NAME_DESERT_ARMOR
}; 