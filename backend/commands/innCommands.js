// 여관 명령어 핸들러 분리
function handleInnCommand({ ws, playerName, players, getRoom, savePlayerData, sendInventory, sendCharacterInfo }) {
  const player = players[playerName];
  if (!player) return;
  const { x, y } = player.position;
  const room = getRoom(player.world, x, y);
  if (!room || room.type !== 'village') {
    ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[여관] 마을에서만 이용할 수 있습니다.' }));
    return;
  }
  if (player.hp === (player.getRealMaxHp ? player.getRealMaxHp() : player.maxHp) && player.mp === player.maxMp) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[여관] 이미 HP/MP가 모두 가득 찼습니다.' }));
    return;
  }
  const INN_PRICE = 10;
  if (player.gold < INN_PRICE) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[여관] 골드가 부족합니다. (필요: ${INN_PRICE}G)` }));
    return;
  }
  player.gold -= INN_PRICE;
  player.hp = player.getRealMaxHp ? player.getRealMaxHp() : player.maxHp;
  player.mp = player.maxMp;
  savePlayerData(playerName).catch(() => {});
  sendInventory(player);
  sendCharacterInfo(player);
  ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `[여관] HP/MP가 모두 회복되었습니다! (-${INN_PRICE}G)` }));
}

module.exports = {
  handleInnCommand,
}; 