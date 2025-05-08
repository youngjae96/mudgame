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

const ITEM_TYPE = {
  WEAPON: '무기',
  ARMOR: '방어구',
  CONSUMABLE: '잡화',
};

const ITEM_STAT_ATK = 'atk';
const ITEM_STAT_DEF = 'def';
const ITEM_STAT_STR = 'str';
const ITEM_STAT_DEX = 'dex';

const ITEM_POOL = [
  { name: '황금 열쇠', description: '반짝이는 황금 열쇠입니다.' },
  { name: '고대 두루마리', description: '신비한 힘이 깃든 두루마리.' },
  { name: '회복 물약', description: '마시면 체력이 회복됩니다.' },
  { name: '무적검', description: '어드민 전용. 공격력 500.', atk: 500, type: '무기' },
  { name: '무적갑옷', description: '어드민 전용. 방어력 500.', def: 500, type: '방어구' },
  { name: ITEM_NAME_FLAME_SWORD, description: '불꽃의 힘이 깃든 검', atk: 28, str: 4, dex: 2, type: ITEM_TYPE.WEAPON, price: 1500 },
  { name: ITEM_NAME_FLAME_ARMOR, description: '불꽃의 힘이 깃든 갑옷', def: 22, str: 2, dex: 2, type: ITEM_TYPE.ARMOR, price: 1400 },
  { name: ITEM_NAME_FROST_SWORD, description: '얼음의 힘이 깃든 검', atk: 24, str: 2, dex: 4, type: ITEM_TYPE.WEAPON, price: 1600 },
  { name: ITEM_NAME_FROST_ARMOR, description: '얼음의 힘이 깃든 갑옷', def: 18, str: 1, dex: 3, type: ITEM_TYPE.ARMOR, price: 1500 },
  { name: ITEM_NAME_DRAGON_SWORD, description: '드래곤의 힘이 깃든 검', atk: 36, str: 5, dex: 3, type: ITEM_TYPE.WEAPON, price: 2500 },
  { name: ITEM_NAME_DRAGON_ARMOR, description: '드래곤의 힘이 깃든 갑옷', def: 28, str: 3, dex: 2, type: ITEM_TYPE.ARMOR, price: 2600 },
  { name: ITEM_NAME_DARK_SWORD, description: '어둠의 힘이 깃든 검', atk: 32, str: 3, dex: 5, type: ITEM_TYPE.WEAPON, price: 2100 },
  { name: ITEM_NAME_DARK_ARMOR, description: '어둠의 힘이 깃든 갑옷', def: 25, str: 2, dex: 4, type: ITEM_TYPE.ARMOR, price: 2200 },
  { name: ITEM_NAME_LARGE_POTION, type: ITEM_TYPE.CONSUMABLE, perUse: 23, total: 10000, desc: '한 번에 23 회복, 총 10000회 사용 가능', price: 300 },
  { name: ITEM_NAME_MONGHWA, type: ITEM_TYPE.WEAPON, price: 100, desc: '공격해도 몬스터 HP가 깎이지 않음. 스탯 경험치만 오름.', atk: 0 },
  { name: ITEM_NAME_KKUM, type: ITEM_TYPE.WEAPON, price: 20000, desc: '방치형 무기. 힘/민첩 경험치 3% 증가 (상점에서 판매 가능)', atk: 18, str: 2, dex: 2, expBonus: 1.03 },
  { name: ITEM_NAME_HWAN, type: ITEM_TYPE.WEAPON, price: 40000, desc: '방치형 무기. 힘/민첩 경험치 5% 증가 (상점에서 판매 가능)', atk: 22, str: 3, dex: 3, expBonus: 1.05 },
  { name: ITEM_NAME_YOUNG, type: ITEM_TYPE.WEAPON, price: 80000, desc: '방치형 무기. 힘/민첩 경험치 7% 증가 (상점에서 판매 가능)', atk: 26, str: 4, dex: 4, expBonus: 1.07 },
];

const FIELD_MONSTERS = [
  { name: '고블린', maxHp: 20, atk: 5, def: 2, gold: 6 },
  { name: '슬라임', maxHp: 15, atk: 3, def: 1, gold: 5 },
  { name: '해골병사', maxHp: 35, atk: 8, def: 4, gold: 10 },
  { name: '오우거', maxHp: 60, atk: 15, def: 7, gold: 15 },
  { name: '드래곤', maxHp: 120, atk: 25, def: 12, gold: 25 }
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
  { name: '암석 골렘', maxHp: 120, atk: 22, def: 25, gold: 19 }
];

const SHOP_ITEMS = {
  [ITEM_TYPE.WEAPON]: [
    { name: ITEM_NAME_WOOD_SWORD, type: ITEM_TYPE.WEAPON, price: 30, desc: '초보자용 나무로 만든 검', atk: 2 },
    { name: ITEM_NAME_BRONZE_SWORD, type: ITEM_TYPE.WEAPON, price: 80, desc: '튼튼한 청동으로 만든 검', atk: 4 },
    { name: ITEM_NAME_IRON_SWORD, type: ITEM_TYPE.WEAPON, price: 200, desc: '전사들이 애용하는 검', atk: 7, str: 1 },
    { name: ITEM_NAME_SILVER_SWORD, type: ITEM_TYPE.WEAPON, price: 500, desc: '은으로 만든 고급 검', atk: 12, str: 2, dex: 1 },
    { name: ITEM_NAME_GOLD_SWORD, type: ITEM_TYPE.WEAPON, price: 1200, desc: '황금으로 만든 최고의 검', atk: 20, str: 3, dex: 2 },
    { name: ITEM_NAME_MONGHWA, type: ITEM_TYPE.WEAPON, price: 100, desc: '공격해도 몬스터 HP가 깎이지 않음. 스탯 경험치만 오름.', atk: 0 },
    { name: ITEM_NAME_KKUM, type: ITEM_TYPE.WEAPON, price: 20000, desc: '방치형 무기. 힘/민첩 경험치 3% 증가 (상점에서 판매 가능)', atk: 18, str: 2, dex: 2, expBonus: 1.03 },
    { name: ITEM_NAME_HWAN, type: ITEM_TYPE.WEAPON, price: 40000, desc: '방치형 무기. 힘/민첩 경험치 5% 증가 (상점에서 판매 가능)', atk: 22, str: 3, dex: 3, expBonus: 1.05 },
    { name: ITEM_NAME_YOUNG, type: ITEM_TYPE.WEAPON, price: 80000, desc: '방치형 무기. 힘/민첩 경험치 7% 증가 (상점에서 판매 가능)', atk: 26, str: 4, dex: 4, expBonus: 1.07 },
    // { name: ITEM_NAME_FLAME_SWORD, type: ITEM_TYPE.WEAPON, price: 3000, desc: '불꽃의 힘이 깃든 검', atk: 28, str: 4, dex: 2 },
    // { name: ITEM_NAME_FROST_SWORD, type: ITEM_TYPE.WEAPON, price: 3200, desc: '얼음의 힘이 깃든 검', atk: 24, str: 2, dex: 4 },
    // { name: ITEM_NAME_DRAGON_SWORD, type: ITEM_TYPE.WEAPON, price: 5000, desc: '드래곤의 힘이 깃든 검', atk: 36, str: 5, dex: 3 },
    // { name: ITEM_NAME_DARK_SWORD, type: ITEM_TYPE.WEAPON, price: 4200, desc: '어둠의 힘이 깃든 검', atk: 32, str: 3, dex: 5 },
    // { name: ITEM_NAME_SKY_SWORD, type: ITEM_TYPE.WEAPON, price: 8000, desc: '하늘의 힘이 깃든 검', atk: 45, str: 6, dex: 4 },
  ],
  [ITEM_TYPE.ARMOR]: [
    { name: ITEM_NAME_CLOTH_ARMOR, type: ITEM_TYPE.ARMOR, price: 25, desc: '가볍고 저렴한 천으로 만든 갑옷', def: 1 },
    { name: ITEM_NAME_LEATHER_ARMOR, type: ITEM_TYPE.ARMOR, price: 70, desc: '튼튼한 가죽으로 만든 갑옷', def: 3 },
    { name: ITEM_NAME_IRON_ARMOR, type: ITEM_TYPE.ARMOR, price: 180, desc: '무거운 철로 만든 갑옷', def: 6, dex: 1 },
    { name: ITEM_NAME_SILVER_ARMOR, type: ITEM_TYPE.ARMOR, price: 450, desc: '은으로 만든 고급 갑옷', def: 10, dex: 2, str: 1 },
    { name: ITEM_NAME_GOLD_ARMOR, type: ITEM_TYPE.ARMOR, price: 1100, desc: '황금으로 만든 최고의 갑옷', def: 18, dex: 3, str: 2 },
    // { name: ITEM_NAME_FLAME_ARMOR, type: ITEM_TYPE.ARMOR, price: 2800, desc: '불꽃의 힘이 깃든 갑옷', def: 22, str: 2, dex: 2 },
    // { name: ITEM_NAME_FROST_ARMOR, type: ITEM_TYPE.ARMOR, price: 3000, desc: '얼음의 힘이 깃든 갑옷', def: 18, str: 1, dex: 3 },
    // { name: ITEM_NAME_DRAGON_ARMOR, type: ITEM_TYPE.ARMOR, price: 5200, desc: '드래곤의 힘이 깃든 갑옷', def: 28, str: 3, dex: 2 },
    // { name: ITEM_NAME_DARK_ARMOR, type: ITEM_TYPE.ARMOR, price: 4400, desc: '어둠의 힘이 깃든 갑옷', def: 25, str: 2, dex: 4 },
    // { name: ITEM_NAME_SKY_ARMOR, type: ITEM_TYPE.ARMOR, price: 9000, desc: '하늘의 힘이 깃든 갑옷', def: 35, str: 4, dex: 3 },
  ],
  [ITEM_TYPE.CONSUMABLE]: [
    { name: '초소형 물약', type: ITEM_TYPE.CONSUMABLE, price: 10, desc: 'HP 10 회복', total: 500, perUse: 10 },
    { name: '소형 물약', type: ITEM_TYPE.CONSUMABLE, price: 25, desc: 'HP 15 회복', total: 1000, perUse: 15 },
    { name: '중형 물약', type: ITEM_TYPE.CONSUMABLE, price: 60, desc: 'HP 20 회복', total: 2000, perUse: 20 },
    { name: ITEM_NAME_LARGE_POTION, type: ITEM_TYPE.CONSUMABLE, perUse: 23, total: 10000, desc: '한 번에 23 회복, 총 10000회 사용 가능', price: 300 },
    { name: '클랜힐 스크롤', type: ITEM_TYPE.CONSUMABLE, price: 50000, desc: '접속해있는 길드원들의 HP가 회복됩니다. /클랜힐 명령어로 사용 가능' },
  ]
};

const ISLAND_MONSTERS = [
  // 해변(중간~강, 기존의 2~2.5배)
  { name: '해변의 크랩킹', maxHp: 220, atk: 45, def: 28, gold: 50, dropItems: [ITEM_NAME_FLAME_SWORD], dropRates: [1.0] },
  { name: '거대 조개괴수', maxHp: 260, atk: 40, def: 34, gold: 55, dropItems: [ITEM_NAME_FLAME_ARMOR], dropRates: [0.03] },
  // 정글(강~매우강, 기존의 2.5~3배)
  { name: '정글 히드라', maxHp: 420, atk: 70, def: 40, gold: 80, dropItems: [ITEM_NAME_FROST_SWORD], dropRates: [0.02] },
  { name: '맹독 고릴라', maxHp: 320, atk: 60, def: 36, gold: 65, dropItems: [ITEM_NAME_FROST_ARMOR], dropRates: [0.03] },
  // 화산(최상급, 기존의 2.5~3배)
  { name: '화산 드래곤', maxHp: 600, atk: 100, def: 55, gold: 150, dropItems: [ITEM_NAME_DRAGON_SWORD], dropRates: [0.02] },
  { name: '용암 거인', maxHp: 520, atk: 90, def: 70, gold: 130, dropItems: [ITEM_NAME_DRAGON_ARMOR], dropRates: [0.03] },
  // 평지(중~강, 기존의 2~2.5배)
  { name: '무인도 멧돼지', maxHp: 180, atk: 38, def: 22, gold: 40, dropItems: [ITEM_NAME_DARK_SWORD], dropRates: [0.02] },
  { name: '야생 코뿔소', maxHp: 260, atk: 48, def: 30, gold: 48, dropItems: [ITEM_NAME_DARK_ARMOR], dropRates: [0.03] },
];

const CAVE_BOSS_MONSTERS = [
  { name: '지하 마왕', maxHp: 800, atk: 130, def: 75, gold: 200, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG], dropRates: [0.002, 0.00095] },
  { name: '암흑 드래곤', maxHp: 780, atk: 128, def: 72, gold: 195, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG], dropRates: [0.002, 0.00095] },
  { name: '동굴 히드라', maxHp: 760, atk: 125, def: 70, gold: 190, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG], dropRates: [0.002, 0.00095] },
  { name: '심연의 골렘', maxHp: 740, atk: 122, def: 68, gold: 185, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG], dropRates: [0.002, 0.00095] },
  { name: '지하 괴수왕', maxHp: 720, atk: 120, def: 66, gold: 180, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG], dropRates: [0.002, 0.00095] },
  { name: '암석 거대거미', maxHp: 700, atk: 118, def: 64, gold: 175, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG], dropRates: [0.002, 0.00095] },
  { name: '동굴 망령', maxHp: 780, atk: 126, def: 70, gold: 192, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG], dropRates: [0.002, 0.00095] },
  { name: '지하 불사자', maxHp: 760, atk: 124, def: 68, gold: 188, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG], dropRates: [0.002, 0.00095] },
  { name: '암흑 리치로드', maxHp: 740, atk: 121, def: 65, gold: 182, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG], dropRates: [0.002, 0.00095] },
  { name: '동굴 거대뱀', maxHp: 720, atk: 119, def: 62, gold: 170, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG], dropRates: [0.002, 0.00095] },
  { name: '심연의 박쥐왕', maxHp: 700, atk: 115, def: 60, gold: 165, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG], dropRates: [0.002, 0.00095] },
  { name: '지하 돌연변이', maxHp: 760, atk: 127, def: 72, gold: 193, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG], dropRates: [0.002, 0.00095] },
  { name: '암흑 슬라임킹', maxHp: 780, atk: 129, def: 74, gold: 198, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG], dropRates: [0.002, 0.00095] },
  { name: '동굴 불꽃정령', maxHp: 720, atk: 120, def: 66, gold: 178, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG], dropRates: [0.002, 0.00095] },
  { name: '심연의 맹독전갈', maxHp: 740, atk: 123, def: 69, gold: 186, dropItems: [ITEM_NAME_HWAN, ITEM_NAME_YOUNG], dropRates: [0.002, 0.00095] },
];

module.exports = { ITEM_POOL, FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS, ISLAND_MONSTERS, CAVE_BOSS_MONSTERS, SHOP_ITEMS, ITEM_TYPE, ITEM_NAME_WOOD_SWORD, ITEM_NAME_BRONZE_SWORD, ITEM_NAME_IRON_SWORD, ITEM_NAME_SILVER_SWORD, ITEM_NAME_GOLD_SWORD, ITEM_NAME_MONGHWA, ITEM_NAME_CLOTH_ARMOR, ITEM_NAME_LEATHER_ARMOR, ITEM_NAME_IRON_ARMOR, ITEM_NAME_SILVER_ARMOR, ITEM_NAME_GOLD_ARMOR, ITEM_NAME_FLAME_SWORD, ITEM_NAME_FROST_SWORD, ITEM_NAME_DRAGON_SWORD, ITEM_NAME_DARK_SWORD, ITEM_NAME_SKY_SWORD, ITEM_NAME_FLAME_ARMOR, ITEM_NAME_FROST_ARMOR, ITEM_NAME_DRAGON_ARMOR, ITEM_NAME_DARK_ARMOR, ITEM_NAME_SKY_ARMOR, ITEM_STAT_ATK, ITEM_STAT_DEF, ITEM_STAT_STR, ITEM_STAT_DEX, ITEM_NAME_KKUM, ITEM_NAME_HWAN, ITEM_NAME_YOUNG }; 