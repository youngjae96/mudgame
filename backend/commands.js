// 명령어 핸들러 모듈
// 필요한 의존성은 인자로 주입받도록 설계

const { GuildCommand } = require('./commands/guildCommands');
const { AdminCommand } = require('./commands/adminCommands');
const { ShopCommand, ShopSellCommand } = require('./commands/shopCommands');
const { StatCommand, WhisperCommand } = require('./commands/statCommands');
const { WhoCommand, HelpCommand, GuildChatCommand } = require('./commands/etcCommands');
const { ReturnCommand, RankingCommand, ClanHealCommand } = require('./commands/returnCommands');
const { InnCommand } = require('./commands/innCommands');
const { TeleportCommand, TeleportRandomCommand, TeleportStopCommand } = require('./commands/teleportCommands');
const { BuyCommand, SellCommand, setShopServiceInstance } = require('./commands/buySellCommands');
const PlayerController = require('./controllers/PlayerController');
const { EquipCommand, UnequipCommand, MapCommand, SaveCommand, CandyCommand, CandyBuffStatusCommand, setPlayerServiceInstance: setPlayerCmdServiceInstance } = require('./commands/playerCommands');

function setupCommands({ shopService, playerService }) {
  setShopServiceInstance(shopService);
  PlayerController.setPlayerServiceInstance(playerService);
  setPlayerCmdServiceInstance(playerService);
}

// 명령어 핸들러 등록 (메타데이터 포함)
const commandList = [
  { cmd: '/정보', handler: new StatCommand(), pattern: '/정보 [닉네임]', desc: '내 능력치 또는 다른 유저 능력치 확인' },
  { cmd: '/귓', handler: new WhisperCommand(), pattern: '/귓 [닉네임] [메시지]', desc: '귓속말(비공개 메시지)' },
  { cmd: '/구매', handler: new BuyCommand(), pattern: '/구매 [아이템명] [갯수]', desc: '아이템 구매' },
  { cmd: '/판매', handler: new SellCommand(), pattern: '/판매 [아이템명] [갯수]', desc: '아이템 판매' },
  { cmd: '/장착', handler: new EquipCommand(), pattern: '/장착 [아이템명]', desc: '장비 장착' },
  { cmd: '/해제', handler: new UnequipCommand(), pattern: '/해제 [무기|방어구]', desc: '장비 해제' },
  { cmd: '/장비', handler: new EquipCommand(), pattern: '/장비', desc: '내 장비 정보' },
  { cmd: '/지도', handler: new MapCommand(), pattern: '/지도', desc: '전체 맵 보기' },
  { cmd: '/텔포', handler: new TeleportCommand(), pattern: '/텔포 [지역]', desc: '지역 이동(무인도, 마을 등)' },
  { cmd: '/텔레포트', handler: new TeleportRandomCommand(), pattern: '/텔레포트', desc: '맵 내 랜덤 위치 이동(자동)' },
  { cmd: '/텔레포트중지', handler: new TeleportStopCommand(), pattern: '/텔레포트중지', desc: '텔레포트 자동 이동 중지' },
  { cmd: '/길드', handler: new GuildCommand(), pattern: '/길드 [생성|가입|수락|탈퇴|추방|공지|정보|목록|해체|위임|가입방식|신청목록]', desc: '길드 관련 명령어' },
  { cmd: '/저장', handler: new SaveCommand(), pattern: '/저장', desc: '데이터 저장' },
  { cmd: '/도움말', handler: new HelpCommand(), pattern: '/도움말', desc: '명령어 전체 안내' },
  { cmd: '/귀환', handler: new ReturnCommand(), pattern: '/귀환', desc: '1번 마을로 귀환' },
  { cmd: '/랭킹', handler: new RankingCommand(), pattern: '/랭킹', desc: 'TOP 10 스탯 랭킹' },
  { cmd: '/클랜힐', handler: new ClanHealCommand(), pattern: '/클랜힐', desc: '클랜힐 스크롤 사용' },
  { cmd: '/운영자', handler: new AdminCommand(), pattern: '/운영자 [공지|골드지급|아이템지급|차단|...]', desc: '운영자 명령어' },
  { cmd: '/길', handler: new GuildChatCommand(), pattern: '/길 [메시지]', desc: '길드 채팅' },
  { cmd: '/여관', handler: new InnCommand(), pattern: '/여관', desc: '여관(회복)' },
  { cmd: '/누구', handler: new WhoCommand(), pattern: '/누구', desc: '현재 접속중인 플레이어 목록' },
  { cmd: '/상점', handler: new ShopCommand(), pattern: '/상점 [카테고리] [페이지]', desc: '상점 열기/페이지 이동' },
  { cmd: '/상점판매', handler: new ShopSellCommand(), pattern: '/상점판매 [카테고리] [페이지]', desc: '상점 판매' },
  { cmd: '/사용사탕', handler: new CandyCommand(), pattern: '/사용사탕', desc: '사탕 사용' },
  { cmd: '/사탕', handler: new CandyBuffStatusCommand(), pattern: '/사탕', desc: '사탕 버프 상태' },
];

// 기존 commandHandlers는 자동 생성
const commandHandlers = {};
for (const c of commandList) commandHandlers[c.cmd] = c.handler;

module.exports = {
  setupCommands,
  commandHandlers,
  commandList, // 메타데이터 포함 전체 리스트도 export
}; 