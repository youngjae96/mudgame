// 명령어 핸들러 모듈
// 필요한 의존성은 인자로 주입받도록 설계

const { GuildCommand } = require('./commands/guildCommands');
const { AdminCommand } = require('./commands/adminCommands');
const { GuestbookCommand } = require('./commands/guestbookCommands');
const { ShopCommand, ShopSellCommand } = require('./commands/shopCommands');
const { StatCommand, WhisperCommand } = require('./commands/statCommands');
const { WhoCommand, HelpCommand, GuildChatCommand } = require('./commands/etcCommands');
const { ReturnCommand, RankingCommand, ClanHealCommand } = require('./commands/returnCommands');
const { InnCommand } = require('./commands/innCommands');
const { TeleportCommand } = require('./commands/teleportCommands');
const { BuyCommand, SellCommand, setShopServiceInstance } = require('./commands/buySellCommands');
const PlayerController = require('./controllers/PlayerController');
const { EquipCommand, UnequipCommand, MapCommand, SaveCommand, setPlayerServiceInstance: setPlayerCmdServiceInstance } = require('./commands/playerCommands');

function setupCommands({ shopService, playerService }) {
  setShopServiceInstance(shopService);
  PlayerController.setPlayerServiceInstance(playerService);
  setPlayerCmdServiceInstance(playerService);
}

// 명령어 핸들러 등록 (객체 기반으로 통일)
const commandHandlers = {
  '/정보': new StatCommand(),
  '/귓': new WhisperCommand(),
  '/구매': new BuyCommand(),
  '/판매': new SellCommand(),
  '/장착': new EquipCommand(),
  '/해제': new UnequipCommand(),
  '/장비': new EquipCommand(),
  '/지도': new MapCommand(),
  '/텔포': new TeleportCommand(),
  '/길드': new GuildCommand(),
  '/저장': new SaveCommand(),
  '/도움말': new HelpCommand(),
  '/귀환': new ReturnCommand(),
  '/랭킹': new RankingCommand(),
  '/클랜힐': new ClanHealCommand(),
  '/운영자': new AdminCommand(),
  '/길': new GuildChatCommand(),
  '/여관': new InnCommand(),
  '/누구': new WhoCommand(),
  '/상점': new ShopCommand(),
  '/상점판매': new ShopSellCommand(),
  '/방명록': new GuestbookCommand(),
};

module.exports = {
  setupCommands,
  commandHandlers,
}; 