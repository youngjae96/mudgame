// 명령어 핸들러 모듈
// 필요한 의존성은 인자로 주입받도록 설계

const { ITEM_TYPE, ITEM_POOL, SHOP_ITEMS } = require('./data/items');
const { ISLAND_VILLAGE_POS, ISLAND2_VILLAGE_POS } = require('./data/map');
const PlayerController = require('./controllers/PlayerController');
const ShopService = require('./services/ShopService');
const { PlayerManager } = require('./playerManager');
const RoomManager = require('./roomManager');
const { sendRoomInfoToAllInRoom, broadcast } = require('./utils/broadcast');
const Guild = require('./models/Guild');
const PlayerGameService = require('./services/PlayerGameService');
const { getRoom } = require('./data/map');
const PlayerData = require('./models/PlayerData');
const { handleAdminCommand } = require('./commands/adminCommands');
const { handleGuildCommand } = require('./commands/guildCommands');
const guestbookCommands = require('./commands/guestbookCommands');
const handleGuestbookCommand = guestbookCommands.handleGuestbookCommand;
const { handleShopCommand, handleShopSellCommand, ShopCommand, ShopSellCommand } = require('./commands/shopCommands');
const { handleStatCommand, handleWhisperCommand } = require('./commands/statCommands');
const { WhoCommand, HelpCommand, GuildChatCommand } = require('./commands/etcCommands');
const { ReturnCommand, RankingCommand, ClanHealCommand } = require('./commands/returnCommands');
const { InnCommand } = require('./commands/innCommands');
const { TeleportCommand } = require('./commands/teleportCommands');
const { BuyCommand, SellCommand, setShopServiceInstance } = require('./commands/buySellCommands');
const { StatCommand, WhisperCommand } = require('./commands/statCommands');
const { GuestbookCommand } = require('./commands/guestbookCommands');
const { GuildCommand } = require('./commands/guildCommands');
const { AdminCommand } = require('./commands/adminCommands');

let shopServiceInstance = null;

function setupCommands({ shopService, playerService }) {
  setShopServiceInstance(shopService);
  PlayerController.setPlayerServiceInstance(playerService);
}

// 명령어 핸들러 등록
const commandHandlers = {
  '/정보': new StatCommand(),
  '/귓': new WhisperCommand(),
  '/구매': new BuyCommand(),
  '/판매': new SellCommand(),
  '/장착': PlayerController.handleEquipCommand,
  '/해제': PlayerController.handleUnequipCommand,
  '/장비': PlayerController.handleEquipCommand,
  '/지도': PlayerController.handleMapCommand,
  '/텔포': new TeleportCommand(),
  '/길드': new GuildCommand(),
  '/저장': PlayerController.handleSaveCommand,
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
  handleBuyCommand: new BuyCommand(),
  handleSellCommand: new SellCommand(),
  handleEquipCommand: PlayerController.handleEquipCommand,
  handleUnequipCommand: PlayerController.handleUnequipCommand,
  handleAdminCommand,
  handleGuildCommand,
  handleWhoCommand: new WhoCommand(),
  handleHelpCommand: new HelpCommand(),
  handleShopCommand,
  handleShopSellCommand,
  handleStatCommand,
  handleWhisperCommand,
  handleReturnCommand: new ReturnCommand(),
  handleRankingCommand: new RankingCommand(),
  handleClanHealCommand: new ClanHealCommand(),
  handleGuestbookCommand,
  handleGuildChatCommand: new GuildChatCommand(),
}; 