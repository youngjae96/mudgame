// Player: 게임 내 플레이어 상태와 행동(로직)만 담당하는 도메인 모델
// DB 저장/불러오기, 네트워크(ws)는 서비스/유틸에서만 다루도록 할 것
// atk, def는 '기본값'만 저장하며, 실제 전투/표시에는 getAtk/getDef만 사용할 것
// 앞으로 스킬, 퀘스트, 파티 등은 별도 클래스로 분리 권장

const { VILLAGE_POS } = require('../data/map');
const { ITEM_NAME_MONGHWA, ITEM_TYPE } = require('../data/items');
const { calcNextStatExp } = require('../utils/expUtils');

class Player {
  constructor(name, ws) {
    this.name = name;
    this.ws = ws; // 네트워크 소켓(게임 내 상태와 분리 가능)
    this.world = 1; // 현재 월드(1: 기본, 2: 무인도)
    this.position = { ...VILLAGE_POS };
    this.inventory = [];
    this.hp = 30;
    this.maxHp = 30;
    this.mp = 10;
    this.maxMp = 10;
    this.str = 5;
    this.dex = 5;
    this.int = 5;
    this.atk = 3; // '기본값'만 저장, 실제 전투/표시는 getAtk() 사용
    this.def = 1; // '기본값'만 저장, 실제 전투/표시는 getDef() 사용
    this.strExp = 0;
    this.strExpMax = 10;
    this.dexExp = 0;
    this.dexExpMax = 10;
    this.intExp = 0;
    this.intExpMax = 10;
    this.gold = 100;
    this.equipWeapon = null;
    this.equipArmor = null;
  }

  gainStrExp(amount = 1) {
    this.strExp += amount;
    while (this.strExp >= this.strExpMax) {
      this.strExp -= this.strExpMax;
      this.str++;
      this.strExpMax = calcNextStatExp(this.strExpMax);
      this.maxHp += 2;
    }
  }

  gainDexExp(amount = 1) {
    this.dexExp += amount;
    while (this.dexExp >= this.dexExpMax) {
      this.dexExp -= this.dexExpMax;
      this.dex++;
      this.dexExpMax = calcNextStatExp(this.dexExpMax);
      this.maxHp += 1;
    }
  }

  gainIntExp(amount = 1) {
    this.intExp += amount;
    while (this.intExp >= this.intExpMax) {
      this.intExp -= this.intExpMax;
      this.int++;
      this.intExpMax = calcNextStatExp(this.intExpMax);
      this.maxMp += 2;
    }
  }

  equipItem(item) {
    if (item.type === ITEM_TYPE.WEAPON) {
      this.equipWeapon = item;
    } else if (item.type === ITEM_TYPE.ARMOR) {
      this.equipArmor = item;
    }
  }

  unequipItem(type) {
    if (type === ITEM_TYPE.WEAPON) {
      this.equipWeapon = null;
    } else if (type === ITEM_TYPE.ARMOR) {
      this.equipArmor = null;
    }
  }

  // 실제 전투/표시에는 getAtk()만 사용할 것
  getAtk() {
    if (this.equipWeapon && this.equipWeapon.name === ITEM_NAME_MONGHWA) {
      return 0;
    }
    let base = 2 + this.str * 1.5 + this.dex * 0.5;
    if (this.equipWeapon) {
      base += this.equipWeapon.atk || 0;
      base += (this.equipWeapon.str || 0) * 1.5;
      base += (this.equipWeapon.dex || 0) * 0.5;
    }
    return Math.floor(base);
  }

  // 실제 전투/표시에는 getDef()만 사용할 것
  getDef() {
    let base = 1 + this.dex * 1.2 + this.str * 0.3;
    if (this.equipArmor) {
      base += this.equipArmor.def || 0;
      base += (this.equipArmor.dex || 0) * 1.2;
      base += (this.equipArmor.str || 0) * 0.3;
    }
    return Math.floor(base);
  }

  autoUsePotion() {
    if (this.hp > 0 && this.hp < this.maxHp) {
      const potionIdx = this.inventory.findIndex(
        (item) => item.type === ITEM_TYPE.CONSUMABLE && item.perUse && item.total > 0
      );
      if (potionIdx !== -1) {
        const potion = this.inventory[potionIdx];
        const needHeal = this.maxHp - this.hp;
        const healAmount = Math.min(potion.perUse, potion.total, needHeal);
        this.hp = Math.min(this.maxHp, this.hp + healAmount);
        potion.total -= healAmount;
        if (potion.total <= 0) {
          this.inventory.splice(potionIdx, 1);
        }
        return { name: potion.name, healAmount, left: Math.max(0, potion.total) };
      }
    }
    return null;
  }
}

module.exports = Player; 