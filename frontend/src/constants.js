export const COMMANDS = {
  INFO: '/정보',
  SHOP: '/상점',
  SHOP_SELL: '/상점판매',
  INN: '/여관',
  BUY: '/구매',
  SELL: '/판매',
  EQUIP: '/착용',
  UNEQUIP: '/해제',
  MAP: '/지도',
  GLOBAL: ['/전'],
  LOCAL: ['/지역', '/지'],
  HELP: ['/도움말', '/help'],
};

export const SYSTEM_MESSAGES = {
  DISCONNECTED: '서버와 연결이 끊어졌습니다.',
  SHOP_GUIDE: '[상점 명령어 안내] /상점 [카테고리] [페이지], /상점판매 [페이지], /구매 아이템명, /판매 아이템명',
  INN_GUIDE: '[여관] 체력과 마나를 모두 회복할 수 있습니다. (추후 구현 예정)',
  CHAT_GUIDE: '[채팅 명령어 안내] /전 전체채팅, /동/서/남/북 : 방향 이동, /지역 지역채팅, /지 지역채팅(기본)',
  INVALID_COMMAND: '[알림] 지원하지 않는 명령어입니다.',
  // 필요시 추가
};

export const UI_LABELS = {
  CHAT_PLACEHOLDER: '명령어 또는 채팅 입력...',
  SEND: '전송',
  SHOP_TITLE: '상점',
  BUY: '구매',
  CLOSE: '닫기',
};

export const MESSAGE_TYPES = {
  CHAT: 'chat',
  SYSTEM: 'system',
  BATTLE: 'battle',
  STAT: 'stat',
};

export const MESSAGE_SUBTYPES = {
  INFO: 'info',
  ERROR: 'error',
  GUIDE: 'guide',
  EVENT: 'event',
};

export const MAP_EMOJI = {
  field: '🌱', forest: '🌲', cave: '🪨', cave_entrance: '🕳️', cave_wall: '🧱', village: '🏠',
  beach: '🏖️', jungle: '🌴', volcano: '🌋', sea: '🌊', islandfield: '🌾'
};

export const WORLDS = {
  MAIN: 1,
  ISLAND: 2,
};

export const HELP_COMMANDS = [
  '/전 <메시지> : 전체 채팅(축약)',
  '/동/서/남/북 : 방향 이동',
  '/지역 지역채팅',
  '/지 지역채팅(기본)',
];

export const CHAT_GUIDE = '[채팅 명령어 안내] /전 전체채팅, /동/서/남/북 : 방향 이동, /지역 지역채팅, /지 지역채팅(기본)'; 