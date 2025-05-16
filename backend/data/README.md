# 게임 데이터 구조 가이드

## 몬스터 데이터 (예: monsters/island.json)
- name: 몬스터 이름 (string, 필수)
- maxHp: 최대 HP (number, 필수)
- atk: 공격력 (number, 필수)
- def: 방어력 (number, 필수)
- gold: 드랍 골드 (number, 필수)
- dropItems: 드랍 아이템 이름 배열 (string[], 필수)
- dropRates: 드랍 확률 배열 (number[], 필수, 0~1)

### 몬스터 예시
```
{
  "name": "해변의 크랩킹",
  "maxHp": 220,
  "atk": 45,
  "def": 28,
  "gold": 58,
  "dropItems": ["플레임소드"],
  "dropRates": [0.1]
}
```

## 아이템 데이터 (예: items/items.json)
- name: 아이템 이름 (string, 필수)
- type: 아이템 타입 (weapon/armor/consumable 등, string, 필수)
- price: 상점 가격 (number, 필수)
- atk/def: 공격력/방어력 (number, 옵션)
- desc: 설명 (string, 옵션)

### 아이템 예시
```
{
  "name": "플레임소드",
  "type": "weapon",
  "atk": 20,
  "price": 1000,
  "desc": "불꽃이 깃든 검"
}
``` 