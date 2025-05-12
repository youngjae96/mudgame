// 능력치/귓속말 명령어 핸들러 분리
const { PlayerManager } = require('../playerManager');

async function handleStatCommand({ ws, playerName, message, players }) {
  const args = message.trim().split(' ');
  const targetName = args[1] || playerName;
  const target = PlayerManager.getPlayer(targetName);
  if (!target) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[정보] 해당 유저가 없습니다: ${targetName}` }));
    return;
  }
  if (target.normalizeHp) target.normalizeHp();
  const weapon = target.equipWeapon || {};
  const armor = target.equipArmor || {};
  const hpBonus = (weapon.hp || 0) + (armor.hp || 0);
  let maxHp = (typeof target.getRealMaxHp === 'function' ? target.getRealMaxHp() : target.maxHp);
  maxHp = Math.floor(maxHp);
  const statMsg =
    `[능력치: ${targetName}]\n` +
    `HP  : ${target.hp} / ${maxHp}    MP  : ${target.mp} / ${target.maxMp}\n` +
    `STR : ${target.str} (Exp: ${Number(target.strExp).toFixed(2)}/${Number(target.strExpMax).toFixed(2)})   DEX: ${target.dex} (Exp: ${Number(target.dexExp).toFixed(2)}/${Number(target.dexExpMax).toFixed(2)})   INT: ${target.int} (Exp: ${Number(target.intExp).toFixed(2)}/${Number(target.intExpMax).toFixed(2)})\n` +
    `공격력: ${target.getAtk ? target.getAtk() : target.atk}   방어력: ${target.getDef ? target.getDef() : target.def}`;
  ws.send(JSON.stringify({ type: 'system', subtype: 'info', message: statMsg }));
}

async function handleWhisperCommand({ ws, playerName, message, players }) {
  const args = message.trim().split(' ');
  const targetName = args[1];
  const msg = args.slice(2).join(' ');
  if (!targetName || !msg) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[귓속말] /귓 닉네임 메시지' }));
    return;
  }
  const target = players[targetName];
  if (!target || !target.ws) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[귓속말] 해당 유저가 없습니다: ${targetName}` }));
    return;
  }
  ws.send(JSON.stringify({ type: 'chat', chatType: 'whisper', name: playerName, message: `[귓→${targetName}] ${msg}` }));
  target.ws.send(JSON.stringify({ type: 'chat', chatType: 'whisper', name: playerName, message: `[귓] ${msg}` }));
}

module.exports = { handleStatCommand, handleWhisperCommand }; 