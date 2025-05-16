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

const FIELD_MONSTERS = [
  { name: '고블린', maxHp: 20, atk: 5, def: 2, gold: 6 },
  { name: '슬라임', maxHp: 15, atk: 3, def: 1, gold: 5 },
  { name: '해골병사', maxHp: 35, atk: 8, def: 4, gold: 10 },
  { name: '오우거', maxHp: 60, atk: 15, def: 7, gold: 15 },
  { name: '드래곤', maxHp: 60, atk: 10, def: 5, gold: 15 }
];
const FOREST_MONSTERS = [
  { name: '숲의 수호자', maxHp: 80, atk: 18, def: 10, gold: 18 },
  { name: '고대 나무정령', maxHp: 100, atk: 15, def: 14, gold: 20 },
  { name: '숲의 늑대왕', maxHp: 70, atk: 22, def: 8, gold: 16 },
  { name: '엘프 전사', maxHp: 60, atk: 20, def: 9, gold: 14 }
];
const CAVE_MONSTERS = [
  { name: '암흑 미노타우로스', maxHp: 130, atk: 28, def: 16, gold: 22 },
  { name: '동굴 리치', maxHp: 110, atk: 32, def: 14, gold: 20 },
  { name: '지하 괴수', maxHp: 150, atk: 25, def: 20, gold: 25 },
  { name: '암석 골렘', maxHp: 120, atk: 22, def: 25, gold: 19 },
];

const ISLAND_MONSTERS = require('./monsters/island.json');

const ISLAND2_MONSTERS = [
  { name: '섬의 수호자', maxHp: 700, atk: 110, def: 60, gold: 160, dropItems: [ITEM_NAME_SKY_ARMOR, ITEM_NAME_SKY_SWORD], dropRates: [0.002, 0.002] },
  { name: '섬의 폭군', maxHp: 750, atk: 120, def: 65, gold: 175, dropItems: [ITEM_NAME_SKY_ARMOR, ITEM_NAME_SKY_SWORD], dropRates: [0.002, 0.002] },
  { name: '섬의 맹독룡', maxHp: 720, atk: 115, def: 62, gold: 168, dropItems: [ITEM_NAME_SKY_ARMOR, ITEM_NAME_SKY_SWORD], dropRates: [0.002, 0.002] },
  { name: '섬의 그림자', maxHp: 780, atk: 125, def: 70, gold: 190, dropItems: [ITEM_NAME_SKY_ARMOR, ITEM_NAME_SKY_SWORD], dropRates: [0.002, 0.002] },
];

const CAVE_BOSS_MONSTERS = [
  { name: '지하 마왕', maxHp: 800, atk: 130, def: 75, gold: 200, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_NAME_IDLE10, ITEM_NAME_IDLE13, ITEM_NAME_IDLE15], dropRates: [0.004, 0.0015, 0.0006, 0.00055, 0.0005] },
  { name: '암흑 드래곤', maxHp: 780, atk: 128, def: 72, gold: 195, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_NAME_IDLE10, ITEM_NAME_IDLE13, ITEM_NAME_IDLE15], dropRates: [0.004, 0.0015, 0.0006, 0.00055, 0.0005] },
  { name: '동굴 히드라', maxHp: 760, atk: 125, def: 70, gold: 190, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_NAME_IDLE10, ITEM_NAME_IDLE13, ITEM_NAME_IDLE15], dropRates: [0.004, 0.0015, 0.0006, 0.00055, 0.0005] },
  { name: '심연의 골렘', maxHp: 740, atk: 122, def: 68, gold: 185, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_NAME_IDLE10, ITEM_NAME_IDLE13, ITEM_NAME_IDLE15], dropRates: [0.004, 0.0015, 0.0006, 0.00055, 0.0005] },
  { name: '지하 괴수왕', maxHp: 720, atk: 120, def: 66, gold: 180, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_NAME_IDLE10, ITEM_NAME_IDLE13, ITEM_NAME_IDLE15], dropRates: [0.004, 0.0015, 0.0006, 0.00055, 0.0005] },
  { name: '암석 거대거미', maxHp: 700, atk: 118, def: 64, gold: 175, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_NAME_IDLE10, ITEM_NAME_IDLE13, ITEM_NAME_IDLE15], dropRates: [0.004, 0.0015, 0.0006, 0.00055, 0.0005] },
  { name: '동굴 망령', maxHp: 780, atk: 126, def: 70, gold: 192, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_NAME_IDLE10, ITEM_NAME_IDLE13, ITEM_NAME_IDLE15], dropRates: [0.004, 0.0015, 0.0006, 0.00055, 0.0005] },
  { name: '지하 불사자', maxHp: 1140, atk: 149, def: 82, gold: 216, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_NAME_IDLE18, ITEM_NAME_IDLE20], dropRates: [0.004, 0.0015, 0.0004, 0.0003] },
  { name: '암흑 리치로드', maxHp: 1110, atk: 145, def: 78, gold: 209, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_NAME_IDLE18, ITEM_NAME_IDLE20], dropRates: [0.004, 0.0015, 0.0004, 0.0003] },
  { name: '동굴 거대뱀', maxHp: 1080, atk: 143, def: 74, gold: 196, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_NAME_IDLE18, ITEM_NAME_IDLE20], dropRates: [0.004, 0.0015, 0.0004, 0.0003] },
  { name: '심연의 박쥐왕', maxHp: 1050, atk: 138, def: 72, gold: 190, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_NAME_IDLE18, ITEM_NAME_IDLE20], dropRates: [0.004, 0.0015, 0.0004, 0.0003] },
  { name: '지하 돌연변이', maxHp: 1140, atk: 152, def: 86, gold: 222, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_NAME_IDLE18, ITEM_NAME_IDLE20], dropRates: [0.004, 0.0015, 0.0004, 0.0003] },
  { name: '암흑 슬라임킹', maxHp: 1170, atk: 155, def: 89, gold: 228, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_NAME_IDLE18, ITEM_NAME_IDLE20], dropRates: [0.004, 0.0015, 0.0004, 0.0003] },
  { name: '동굴 불꽃정령', maxHp: 1080, atk: 144, def: 79, gold: 205, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_NAME_IDLE18, ITEM_NAME_IDLE20], dropRates: [0.004, 0.0015, 0.0004, 0.0003] },
  { name: '심연의 맹독전갈', maxHp: 1110, atk: 148, def: 83, gold: 214, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_NAME_IDLE18, ITEM_NAME_IDLE20], dropRates: [0.004, 0.0015, 0.0004, 0.0003] },
];

const DESERT_MONSTERS = [
  { name: '사막 바실리스크', maxHp: 1300, atk: 170, def: 95, gold: 250 },
  { name: '모래 골렘', maxHp: 1450, atk: 160, def: 110, gold: 270 },
  { name: '사막 스콜피온', maxHp: 1250, atk: 180, def: 90, gold: 240 },
  { name: '모래 유령', maxHp: 1200, atk: 175, def: 100, gold: 260 },
];

// 자동 상점 아이템 분류
const SHOP_ITEMS = {
  [ITEM_TYPE.WEAPON]: ITEM_POOL.filter(item => item.type === ITEM_TYPE.WEAPON && item.shopBuy),
  [ITEM_TYPE.ARMOR]: ITEM_POOL.filter(item => item.type === ITEM_TYPE.ARMOR && item.shopBuy),
  [ITEM_TYPE.CONSUMABLE]: ITEM_POOL.filter(item => item.type === ITEM_TYPE.CONSUMABLE && item.shopBuy),
};

module.exports = { ITEM_POOL, FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS, ISLAND_MONSTERS, CAVE_BOSS_MONSTERS, ISLAND2_MONSTERS, SHOP_ITEMS, ITEM_TYPE, ITEM_NAME_WOOD_SWORD, ITEM_NAME_BRONZE_SWORD, ITEM_NAME_IRON_SWORD, ITEM_NAME_SILVER_SWORD, ITEM_NAME_GOLD_SWORD, ITEM_NAME_MONGHWA, ITEM_NAME_CLOTH_ARMOR, ITEM_NAME_LEATHER_ARMOR, ITEM_NAME_IRON_ARMOR, ITEM_NAME_SILVER_ARMOR, ITEM_NAME_GOLD_ARMOR, ITEM_NAME_FLAME_SWORD, ITEM_NAME_FROST_SWORD, ITEM_NAME_DRAGON_SWORD, ITEM_NAME_DARK_SWORD, ITEM_NAME_SKY_SWORD, ITEM_NAME_FLAME_ARMOR, ITEM_NAME_FROST_ARMOR, ITEM_NAME_DRAGON_ARMOR, ITEM_NAME_DARK_ARMOR, ITEM_NAME_SKY_ARMOR, ITEM_STAT_ATK, ITEM_STAT_DEF, ITEM_STAT_STR, ITEM_STAT_DEX, ITEM_NAME_KKUM, ITEM_NAME_HWAN, ITEM_NAME_YOUNG, DESERT_MONSTERS, ITEM_NAME_SUN_SWORD, ITEM_NAME_DESERT_SWORD, ITEM_NAME_SUN_ARMOR, ITEM_NAME_DESERT_ARMOR }; 