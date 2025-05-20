// Player: 게임 내 플레이어 상태와 행동(로직)만 담당하는 도메인 모델
// DB 저장/불러오기, 네트워크(ws)는 서비스/유틸에서만 다루도록 할 것
// atk, def는 '기본값'만 저장하며, 실제 전투/표시에는 getAtk/getDef만 사용할 것
// 앞으로 스킬, 퀘스트, 파티 등은 별도 클래스로 분리 권장

const { VILLAGE_POS } = require('../data/map');
const { ITEM_NAME_MONGHWA, ITEM_NAME_KKUM, ITEM_NAME_HWAN, ITEM_NAME_YOUNG, ITEM_TYPE, ITEM_NAME_IDLE10, ITEM_NAME_IDLE13, ITEM_NAME_IDLE15, ITEM_NAME_IDLE18, ITEM_NAME_IDLE20 } = require('../data/items');
const { calcNextStatExp } = require('../utils/expUtils');

class Player {
  constructor(name, ws) {
    this.name = name;
    this.ws = ws; // 네트워크 소켓(게임 내 상태와 분리 가능)
    this.world = 1; // 현재 월드(1: 기본, 2: 무인도)
    this.position = { ...VILLAGE_POS };
    this.inventory = [];
    this.hp = 30;
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
    // 채팅 쿨타임
    this.lastGlobalChat = 0;
    this.lastLocalChat = 0;
    // 클랜힐 누적 회복량
    this.clanHealTotal = 0;
    this.expCandyBuffUntil = 0; // 사탕 경험치 버프 만료 시간(타임스탬프)
  }

  // 모든 경험치 보너스를 곱해서 반환 (type: 'str'|'dex'|'int', extra: 임시 보너스)
  getExpBonus(type = '', extra = 1) {
    let bonus = 1;
    if (this.equipWeapon && this.equipWeapon.expBonus) bonus *= this.equipWeapon.expBonus;
    if (extra && typeof extra === 'number') bonus *= extra;
    if (global && global.EVENT_EXP_BONUS) bonus *= global.EVENT_EXP_BONUS;
    const candyActive = this.expCandyBuffUntil && Date.now() < this.expCandyBuffUntil;
    if (candyActive) bonus *= 1.1;
    return bonus;
  }

  // 통합 경험치 증가 함수
  gainStatExp(type, amount = 1, extraBonus = 1) {
    const realAmount = amount * this.getExpBonus(type, extraBonus);
    if (type === 'str') return this.gainStrExp(realAmount);
    if (type === 'dex') return this.gainDexExp(realAmount);
    if (type === 'int') return this.gainIntExp(realAmount);
  }

  gainStrExp(amount = 1, extraBonus = 1) {
    const weaponBonus = this.equipWeapon && this.equipWeapon.expBonus ? this.equipWeapon.expBonus : 1;
    const eventBonus = global && global.EVENT_EXP_BONUS ? global.EVENT_EXP_BONUS : 1;
    const candyActive = this.expCandyBuffUntil && Date.now() < this.expCandyBuffUntil;
    const candyBonus = candyActive ? 1.1 : 1;
    const realAmount = amount * weaponBonus * eventBonus * candyBonus * (extraBonus || 1);
    this.strExp += realAmount;
    let levelUp = 0;
    while (this.strExp >= this.strExpMax) {
      this.strExp -= this.strExpMax;
      this.str++;
      levelUp++;
      this.strExpMax = calcNextStatExp(this.strExpMax);
    }
    if (levelUp > 0) {
      console.log(`[LEVEL UP] str +${levelUp} (현재 str: ${this.str})`);
    }
  }

  gainDexExp(amount = 1, extraBonus = 1) {
    const weaponBonus = this.equipWeapon && this.equipWeapon.expBonus ? this.equipWeapon.expBonus : 1;
    const eventBonus = global && global.EVENT_EXP_BONUS ? global.EVENT_EXP_BONUS : 1;
    const candyActive = this.expCandyBuffUntil && Date.now() < this.expCandyBuffUntil;
    const candyBonus = candyActive ? 1.1 : 1;
    const realAmount = amount * weaponBonus * eventBonus * candyBonus * (extraBonus || 1);
    this.dexExp += realAmount;
    let levelUp = 0;
    while (this.dexExp >= this.dexExpMax) {
      this.dexExp -= this.dexExpMax;
      this.dex++;
      levelUp++;
      this.dexExpMax = calcNextStatExp(this.dexExpMax);
    }
    if (levelUp > 0) {
      console.log(`[LEVEL UP] dex +${levelUp} (현재 dex: ${this.dex})`);
    }
  }

  gainIntExp(amount = 1, extraBonus = 1) {
    const weaponBonus = this.equipWeapon && this.equipWeapon.expBonus ? this.equipWeapon.expBonus : 1;
    const eventBonus = global && global.EVENT_EXP_BONUS ? global.EVENT_EXP_BONUS : 1;
    const candyActive = this.expCandyBuffUntil && Date.now() < this.expCandyBuffUntil;
    const candyBonus = candyActive ? 1.1 : 1;
    const realAmount = amount * weaponBonus * eventBonus * candyBonus * (extraBonus || 1);
    this.intExp += realAmount;
    let levelUp = 0;
    while (this.intExp >= this.intExpMax) {
      this.intExp -= this.intExpMax;
      this.int++;
      levelUp++;
      this.intExpMax = calcNextStatExp(this.intExpMax);
    }
    if (levelUp > 0) {
      console.log(`[LEVEL UP] int +${levelUp} (현재 int: ${this.int})`);
    }
  }

  equipItem(item) {
    if (item.type === ITEM_TYPE.WEAPON) {
      this.equipWeapon = item;
    } else if (item.type === ITEM_TYPE.ARMOR) {
      this.equipArmor = item;
    }
    this.hp = Math.min(this.hp, this.getRealMaxHp());
  }

  unequipItem(type) {
    if (type === ITEM_TYPE.WEAPON) {
      this.equipWeapon = null;
    } else if (type === ITEM_TYPE.ARMOR) {
      this.equipArmor = null;
    }
    this.hp = Math.min(this.hp, this.getRealMaxHp());
  }

  // 실제 전투/표시에는 getAtk()만 사용할 것
  getAtk() {
    // 방치형 무기: atk 0이고 expBonus가 있으면 무조건 공격력 0
    if (
      this.equipWeapon &&
      this.equipWeapon.atk === 0 &&
      this.equipWeapon.expBonus
    ) {
      return 0;
    }
    let base = 2 + this.str * 1.5 + this.dex * 0.5 + this.int * 0.45;
    if (this.equipWeapon) {
      base += this.equipWeapon.atk || 0;
      base += (this.equipWeapon.str || 0) * 1.5;
      base += (this.equipWeapon.dex || 0) * 0.5;
    }
    return Math.floor(base);
  }

  // 실제 전투/표시에는 getDef()만 사용할 것
  getDef() {
    let base = 1 + this.dex * 1.2 + this.str * 0.3 + this.int * 0.35;
    if (this.equipArmor) {
      base += this.equipArmor.def || 0;
      base += (this.equipArmor.dex || 0) * 1.2;
      base += (this.equipArmor.str || 0) * 0.3;
    }
    return Math.floor(base);
  }

  getRealMaxHp() {
    const weapon = this.equipWeapon || {};
    const armor = this.equipArmor || {};
    const hpBonus = (weapon.hp || 0) + (armor.hp || 0);
    let base = 30 + this.str * 2 + this.dex * 1 + this.int * 0.5 + hpBonus;
    return Math.floor(base);
  }

  autoUsePotion() {
    const maxHp = this.getRealMaxHp();
    if (this.hp > 0 && this.hp < maxHp) {
      const potionIdx = this.inventory.findIndex(
        (item) => item.type === ITEM_TYPE.CONSUMABLE && item.perUse && item.total > 0
      );
      if (potionIdx !== -1) {
        const potion = this.inventory[potionIdx];
        const needHeal = maxHp - this.hp;
        const healAmount = Math.min(potion.perUse, potion.total, needHeal);
        this.hp = Math.min(maxHp, this.hp + healAmount);
        potion.total -= healAmount;
        this.syncPotionCount();
        if (potion.total <= 0) {
          this.inventory.splice(potionIdx, 1);
        }
        this.removeEmptyPotions();
        return { name: potion.name, healAmount, left: Math.max(0, potion.total) };
      }
    }
    this.removeEmptyPotions();
    return null;
  }

  syncPotionCount() {
    const { ITEM_POOL } = require('../data/items');
    this.inventory.forEach(item => {
      if (
        (item.type === ITEM_TYPE.CONSUMABLE || item.type === '잡화' || (item.type && item.type.toLowerCase() === 'consumable')) &&
        item.total !== undefined && item.name
      ) {
        const ref = Array.isArray(ITEM_POOL) ? ITEM_POOL.find(i => i.name === item.name) : null;
        if (ref && ref.total) {
          item.count = Math.max(0, Math.ceil(item.total / ref.total));
        }
      }
    });
  }

  removeEmptyPotions() {
    this.inventory = this.inventory.filter(
      (item) => !(item.type === ITEM_TYPE.CONSUMABLE && item.total !== undefined && item.total <= 0)
    );
  }

  addToInventory(item, ws) {
    // 사탕만 스택 처리
    if (item.name === '사탕') {
      const existing = this.inventory.find(i => i.name === '사탕');
      if (existing) {
        existing.count = (existing.count || 1) + (item.count || 1);
        return true;
      }
      item.count = item.count || 1;
      this.inventory.push({ ...item });
      return true;
    }
    // 중첩 소모품(잡화/consumable)일 경우 count 50개 제한
    if ((item.type === ITEM_TYPE.CONSUMABLE || item.type === '잡화' || (item.type && item.type.toLowerCase() === 'consumable')) && item.name) {
      const existing = this.inventory.find(i => i.name === item.name && (i.type === ITEM_TYPE.CONSUMABLE || i.type === '잡화' || (i.type && i.type.toLowerCase() === 'consumable')));
      if (existing) {
        const curCount = existing.count || 1;
        if (curCount >= 50) {
          if (ws) {
            ws.send(
              JSON.stringify({
                type: 'system',
                subtype: 'error',
                message: `${item.name}은(는) 최대 50개까지만 보유할 수 있습니다.`
              })
            );
          }
          return false;
        }
      }
    }
    if (this.inventory.length >= 50) {
      if (ws) {
        ws.send(
          JSON.stringify({
            type: 'system',
            subtype: 'error',
            message: '인벤토리는 최대 50개까지만 보관할 수 있습니다.'
          })
        );
      }
      return false;
    }
    this.inventory.push({ ...item });
    return true;
  }

  // 인벤토리 내 모든 무기의 expBonus를 곱해서 반환 → 장착한 무기만 적용
  getTotalExpBonus() {
    return this.equipWeapon && this.equipWeapon.expBonus ? this.equipWeapon.expBonus : 1;
  }

  normalizeHp() {
    const maxHp = this.getRealMaxHp();
    if (this.hp > maxHp) this.hp = maxHp;
  }
}

module.exports = Player; 