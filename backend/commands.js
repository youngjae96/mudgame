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
const { handleShopCommand, handleShopSellCommand } = require('./commands/shopCommands');
const { handleStatCommand, handleWhisperCommand } = require('./commands/statCommands');
const { handleWhoCommand, handleHelpCommand, handleGuildChatCommand } = require('./commands/etcCommands');
const { handleReturnCommand, handleRankingCommand, handleClanHealCommand } = require('./commands/returnCommands');
const { handleInnCommand } = require('./commands/innCommands');
const { handleTeleportCommand } = require('./commands/teleportCommands');
const { handleBuyCommand, handleSellCommand, setShopServiceInstance } = require('./commands/buySellCommands');

let shopServiceInstance = null;

function setupCommands({ shopService, playerService }) {
  setShopServiceInstance(shopService);
  PlayerController.setPlayerServiceInstance(playerService);
}

// 명령어 핸들러 등록
const commandHandlers = {
  '/정보': handleStatCommand,
  '/귓': handleWhisperCommand,
  '/구매': handleBuyCommand,
  '/판매': handleSellCommand,
  '/장착': PlayerController.handleEquipCommand,
  '/해제': PlayerController.handleUnequipCommand,
  '/정보': handleStatCommand,
  '/장비': PlayerController.handleEquipCommand,
  '/지도': PlayerController.handleMapCommand,
  '/텔포': handleTeleportCommand,
  '/길드': handleGuildCommand,
  '/저장': PlayerController.handleSaveCommand,
  '/도움말': handleHelpCommand,
  '/구매': handleShopCommand,
  '/판매': handleShopSellCommand,
  '/귀환': handleReturnCommand,
  '/랭킹': handleRankingCommand,
  '/클랜힐': handleClanHealCommand,
  '/운영자': handleAdminCommand,
  '/길': handleGuildChatCommand,
};

module.exports = {
  setupCommands,
  handleBuyCommand,
  handleSellCommand,
  handleEquipCommand: PlayerController.handleEquipCommand,
  handleUnequipCommand: PlayerController.handleUnequipCommand,
  handleTeleportCommand,
  handleInnCommand,
  handleAdminCommand,
  handleGuildCommand,
  handleWhoCommand,
  handleHelpCommand,
  handleShopCommand,
  handleShopSellCommand,
  handleStatCommand,
  handleWhisperCommand,
  handleReturnCommand,
  handleRankingCommand,
  handleClanHealCommand,
  handleGuestbookCommand,
  handleGuildChatCommand,
}; 