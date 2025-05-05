// 명령어 핸들러 모듈
// 필요한 의존성은 인자로 주입받도록 설계

const { ITEM_TYPE } = require('./data/items');
const { ISLAND_VILLAGE_POS } = require('./data/map');
const PlayerController = require('./controllers/PlayerController');
const ShopService = require('./services/ShopService');

let shopServiceInstance = null;

function setupCommands({ shopService, playerService }) {
  shopServiceInstance = shopService;
  PlayerController.setPlayerServiceInstance(playerService);
}

function handleBuyCommand(args) {
  return shopServiceInstance.buyItem(args);
}

function handleSellCommand(args) {
  return shopServiceInstance.sellItem(args);
}

function handleTeleportCommand({ ws, playerName, message, players, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo }) {
  const player = players[playerName];
  if (!player) return;
  const args = message.trim().split(' ');
  if (args.length < 2) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[텔레포트] 사용법: /텔포 <지역이름> (예: /텔포 무인도, /텔포 마을)' }));
    return;
  }
  const dest = args[1];
  if (dest === '무인도') {
    if (player.world === 1 && player.position.x === 4 && player.position.y === 4) {
      player.world = 2;
      player.position = { x: 0, y: 4 };
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[텔레포트] 무인도 해변으로 이동합니다!' }));
      sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, { x: 0, y: 4 });
      sendInventory(player);
      sendCharacterInfo(player);
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[텔레포트] 마을 광장에서만 무인도로 이동할 수 있습니다.' }));
    }
  } else if (dest === '마을') {
    const { ISLAND_VILLAGE_POS } = require('./data/map');
    if (player.world === 2 && player.position.x === ISLAND_VILLAGE_POS.x && player.position.y === ISLAND_VILLAGE_POS.y) {
      player.world = 1;
      player.position = { x: 4, y: 4 };
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[텔레포트] 마을 광장으로 이동합니다!' }));
      sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, { x: 4, y: 4 });
      sendInventory(player);
      sendCharacterInfo(player);
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[텔레포트] 무인도 오두막에서만 마을로 이동할 수 있습니다.' }));
    }
  } else if (dest === '동굴') {
    if (player.world === 2 && player.position.x === 2 && player.position.y === 6) {
      player.world = 3;
      player.position = { x: 0, y: 0 };
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[텔레포트] 동굴로 들어갑니다!' }));
      sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
      sendInventory(player);
      sendCharacterInfo(player);
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[텔레포트] 무인도 동굴 입구에서만 동굴로 들어갈 수 있습니다.' }));
    }
    return;
  } else {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[텔레포트] 지원하지 않는 지역입니다. (예: /텔포 무인도, /텔포 마을)' }));
  }
}

module.exports = {
  setupCommands,
  handleBuyCommand,
  handleSellCommand,
  handleEquipCommand: PlayerController.handleEquipCommand,
  handleUnequipCommand: PlayerController.handleUnequipCommand,
  handleTeleportCommand,
}; 