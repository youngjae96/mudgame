// 기타 명령어 핸들러 클래스화
const { PlayerManager } = require('../playerManager');
const Guild = require('../models/Guild');
const { commandList } = require('../commands');

class WhoCommand {
  async execute({ ws, players }) {
    const names = Object.keys(players);
    if (!names.length) {
      ws.send(JSON.stringify({ type: 'system', message: '[누구] 현재 접속 중인 플레이어가 없습니다.' }));
      return;
    }
    ws.send(JSON.stringify({ type: 'system', message: `[누구] 현재 접속중: ${names.join(', ')}` }));
  }
}

class HelpCommand {
  async execute({ ws }) {
    const msg = [
      '[명령어 안내]',
      ...commandList.map(c => `${c.pattern} : ${c.desc}`)
    ].join('\n');
    ws.send(JSON.stringify({ type: 'system', message: msg }));
  }
}

class GuildChatCommand {
  async execute({ ws, playerName, message, players }) {
    const msg = message.trim().replace(/^\/길\s*/, '');
    if (!msg) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드채팅] 보낼 메시지를 입력하세요.' }));
      return;
    }
    const player = PlayerManager.getPlayer(playerName);
    if (!player || !player.guildName) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드채팅] 길드에 가입해야 길드채팅을 사용할 수 있습니다.' }));
      return;
    }
    const guild = await Guild.findOne({ name: player.guildName });
    if (!guild) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드채팅] 길드 정보를 찾을 수 없습니다.' }));
      return;
    }
    guild.chatLog.push({ name: playerName, message: msg, time: new Date() });
    if (guild.chatLog.length > 100) guild.chatLog = guild.chatLog.slice(-100);
    await guild.save();
    Object.values(PlayerManager.getAllPlayers()).forEach(p => {
      if (p.guildName === guild.name && p.ws && p.ws.readyState === 1) {
        p.ws.send(JSON.stringify({ type: 'chat', chatType: 'guild', name: playerName, message: msg }));
      }
    });
  }
}

module.exports = {
  WhoCommand,
  HelpCommand,
  GuildChatCommand,
}; 