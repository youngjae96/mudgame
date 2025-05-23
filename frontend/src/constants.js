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
  GUILD: 'guild',
};

export const MESSAGE_SUBTYPES = {
  INFO: 'info',
  ERROR: 'error',
  GUIDE: 'guide',
  EVENT: 'event',
};

export const MAP_EMOJI = {
  field: '🌱', forest: '🌲', cave: '🪨', cave_entrance: '🕳️', cave_wall: '🧱', village: '🏠',
  beach: '🏖️', jungle: '🌴', volcano: '🌋', sea: '🌊', islandfield: '🌾',
  desert: '🏜️',    // 사막
  oasis: '🏝️',     // 오아시스(야자수섬)
  rock: '⛰️',      // 바위지대
  desertcave: '🦂', // 사막 동굴(전갈)
  pyramid: '🟫',      // 피라미드 내부
  pyramid_entrance: '🔺', // 피라미드 입구
  pyramid_exit: '🚪', // 피라미드 출구
  pyramid_wall: '🧱', // 피라미드 내부 벽돌 장애물
  pyramid2_entrance: '🌀', // 피라미드2 입구
  pyramid1_exit: '🌀', // 피라미드1 출구(피라미드2에서)
  pyramid2_wall: '🧱', // 피라미드2 내부 벽돌 장애물
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

export const COMMAND_LIST = [
  { cmd: '/정보', desc: '내 능력치 확인' },
  { cmd: '/귓', desc: '귓속말(비공개 메시지)' },
  { cmd: '/구매', desc: '아이템 구매' },
  { cmd: '/판매', desc: '아이템 판매' },
  { cmd: '/장착', desc: '장비 장착' },
  { cmd: '/해제', desc: '장비 해제' },
  { cmd: '/장비', desc: '내 장비 정보' },
  { cmd: '/지도', desc: '전체 맵 보기' },
  { cmd: '/텔포', desc: '지역 이동(무인도, 마을 등)' },
  { cmd: '/텔레포트', desc: '맵 내 랜덤 위치 이동' },
  { cmd: '/길드', desc: '길드 관련 명령어' },
  { cmd: '/저장', desc: '데이터 저장' },
  { cmd: '/도움말', desc: '명령어 전체 안내' },
  { cmd: '/귀환', desc: '1번 마을로 귀환' },
  { cmd: '/랭킹', desc: 'TOP 10 스탯 랭킹' },
  { cmd: '/클랜힐', desc: '클랜힐 스크롤 사용' },
  { cmd: '/길', desc: '길드 채팅' },
  { cmd: '/여관', desc: '여관(회복)' },
  { cmd: '/누구', desc: '현재 접속중인 플레이어 목록' },
  { cmd: '/상점', desc: '상점 열기' },
  { cmd: '/상점판매', desc: '상점 판매' },
  { cmd: '/사용사탕', desc: '사탕 사용' },
  { cmd: '/사탕', desc: '사탕 버프 상태' },
  { cmd: '/상점 무기', desc: '무기 상점 열기' },
  { cmd: '/상점 무기 2', desc: '무기 상점 2페이지 보기' },
  { cmd: '/상점 방어구', desc: '방어구 상점 열기' },
  { cmd: '/상점 방어구 2', desc: '방어구 상점 2페이지 보기' },
  { cmd: '/상점 잡화', desc: '잡화(물약 등) 상점 열기' },
  { cmd: '/상점 잡화 2', desc: '잡화(물약 등) 상점 2페이지 보기' },
  { cmd: '/상점 구매 [아이템명]', desc: '상점에서 아이템을 구매합니다. 예: /상점 구매 나무검' },
  { cmd: '/상점 판매 [아이템명]', desc: '상점에 아이템을 판매합니다. 예: /상점 판매 단검' },
  { cmd: '/상점판매', desc: '상점 판매 목록 보기' },
  { cmd: '/상점판매 무기', desc: '무기 상점에 판매' },
  { cmd: '/상점판매 방어구', desc: '방어구 상점에 판매' },
  { cmd: '/상점판매 잡화', desc: '잡화 상점에 판매' },
  { cmd: '/구매 [아이템명] [갯수]', desc: '아이템 구매. 예: /구매 나무검 1' },
  { cmd: '/판매 [아이템명] [갯수]', desc: '아이템 판매. 예: /판매 나무검 1' },
  { cmd: '/장착 나무검', desc: '무기 장착 예시' },
  { cmd: '/해제 무기', desc: '무기 해제' },
  { cmd: '/해제 방어구', desc: '방어구 해제' },
  { cmd: '/정보 홍길동', desc: '다른 유저 능력치 확인' },
  { cmd: '/귓 홍길동 안녕', desc: '귓속말 예시' },
  { cmd: '/착용 천공의 갑옷', desc: '방어구 착용 예시' },
  { cmd: '/입장', desc: '동굴/피라미드 입장' },
  { cmd: '/나가기', desc: '동굴/피라미드 나가기' },
  { cmd: '/길드 생성', desc: '길드 생성' },
  { cmd: '/길드 가입', desc: '길드 가입' },
  { cmd: '/길드 수락', desc: '길드 가입 수락' },
  { cmd: '/길드 탈퇴', desc: '길드 탈퇴' },
  { cmd: '/길드 추방', desc: '길드원 추방' },
  { cmd: '/길드 공지', desc: '길드 공지 등록' },
  { cmd: '/길드 정보', desc: '길드 정보 확인' },
  { cmd: '/길드 목록', desc: '길드 목록 확인' },
  { cmd: '/길드 해체', desc: '길드 해체(길드장)' },
  { cmd: '/길드 위임', desc: '길드장 권한 위임' },
  { cmd: '/길드 가입방식', desc: '길드 가입방식 변경' },
  { cmd: '/길드 신청목록', desc: '길드 가입 신청목록' },
  { cmd: '/비밀번호변경', desc: '비밀번호 변경 모달 열기' },
  { cmd: '/텔포 무인도', desc: '무인도 등 지역 이동' },
  { cmd: '/텔포 마을', desc: '마을 등 지역 이동' },
  { cmd: '/텔레포트', desc: '맵 내 랜덤 위치로 이동' },
  { cmd: '/클랜힐', desc: '클랜힐 스크롤 사용' },
  { cmd: '/사탕', desc: '사탕 버프 상태 확인' },
  { cmd: '/사용사탕', desc: '사탕 사용' },
  { cmd: '/저장', desc: '데이터 저장' },
  { cmd: '/랭킹', desc: 'TOP 10 스탯 랭킹' },
  { cmd: '/누구', desc: '현재 접속중인 플레이어 목록' },
  { cmd: '/지도', desc: '전체 맵 보기' },
  { cmd: '/장비', desc: '내 장비 정보' },
  { cmd: '/정보', desc: '내 능력치 확인' },
  { cmd: '/귓', desc: '귓속말(비공개 메시지)' },
  { cmd: '/귀환', desc: '1번 마을로 귀환' },
  { cmd: '/전 안녕하세요', desc: '전체 채팅 예시' },
  { cmd: '/동', desc: '오른쪽 이동' },
  { cmd: '/서', desc: '왼쪽 이동' },
  { cmd: '/남', desc: '아래 이동' },
  { cmd: '/북', desc: '위 이동' },
  { cmd: '/게시판', desc: '게시판 열기' },
  { cmd: '/전 <메시지>', desc: '전체 채팅(축약)' },
  { cmd: '<메시지>', desc: '지역 채팅(명령어 없이 입력)' }
]; 