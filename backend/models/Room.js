// Room: 맵 상의 한 칸(공간) 상태만 담당하는 데이터 컨테이너
// 아이템/몬스터 추가/삭제, 이벤트 등은 서비스/유틸/별도 클래스로 분리 권장

class Room {
  constructor(x, y, type, name, description) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.name = name;
    this.description = description;
    this.items = [];
    this.monsters = [];
  }
}

module.exports = Room; 