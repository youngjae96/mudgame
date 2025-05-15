/**
 * expUtils.js: 경험치/골드 계산 유틸
 * - calcNextStatExp: 다음 스탯 경험치 요구량 계산
 * - calcExpBonus: 골드 기반 경험치 보너스 계산
 * - calcGoldDrop: 몬스터 골드 드랍량 계산
 */

const EXP_BONUS_MIN = 1.00;

/**
 * 다음 스탯 경험치 요구량 계산
 */
function calcNextStatExp(prev) {
  return Math.floor(prev * 1.16 + 5);
}

/**
 * 골드 기반 경험치 보너스 계산 (루트 증가, 상한선 없음)
 * 골드 5: 1.05, 골드 25: 1.28, 골드 100: 2.05, 골드 400: 3.33 등
 */
function calcExpBonus(monsterGold) {
  if (!monsterGold || monsterGold <= 0) return EXP_BONUS_MIN;
  return Number((EXP_BONUS_MIN + Math.sqrt(monsterGold) / 18).toFixed(3));
}

/**
 * 몬스터 골드 드랍량 계산
 */
function calcGoldDrop(monster) {
  if (!monster || !monster.gold) return 0;
  const min = Math.floor(monster.gold * 0.7);
  const max = Math.floor(monster.gold * 1.3);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = { calcExpBonus, calcGoldDrop, calcNextStatExp, EXP_BONUS_MIN }; 