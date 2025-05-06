// Monster: 맵 상의 몬스터 상태만 담당하는 데이터 컨테이너
// 전투/AI/이벤트 등은 서비스/유틸/별도 클래스로 분리 권장

class Monster {
  constructor(base, x, y) {
    this.name = base.name;
    this.maxHp = base.maxHp;
    this.hp = base.maxHp;
    this.atk = base.atk || 1;
    this.def = base.def || 0;
    this.gold = base.gold || 0;
    this.id = `${x},${y},m,${Date.now()}-${Math.random()}`;
    if (base.desc) this.desc = base.desc;
    if (base.dropItems) this.dropItems = base.dropItems;
    if (base.dropRates) this.dropRates = base.dropRates;
  }
}

module.exports = Monster; 