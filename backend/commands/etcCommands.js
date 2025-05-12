// 기타 명령어 핸들러 클래스화
const { PlayerManager } = require('../playerManager');
const Guild = require('../models/Guild');

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
      '/전 <메시지> : 전체 채팅(축약)',
      '<메시지> : 지역 채팅(명령어 없이 입력)',
      '/동 /서 /남 /북 : 방향 이동(오른쪽/왼쪽/아래/위, 또는 맵 터치)',
      '/누구 : 현재 접속중인 플레이어 목록 보기',
      '/장착 <아이템명> : 장비 장착',
      '/해제 무기, /해제 방어구 : 장비 해제',
      '/정보 : 내 능력치 확인',
      '/정보 <닉네임> : 다른 유저 능력치 확인',
      '/귓 <닉네임> <메시지> : 귓속말',
      '/귀환 : 1번 마을(마을 광장)으로 귀환',
      '/장비 : 내 장비 정보',
      '/지도 : 전체 맵 보기',
      '/텔포 <지역> : 월드 이동(예: 무인도, 무인도2, 마을)',
      '/길 <메시지> : 길드 채팅',
      '/길드 <생성|가입|수락|탈퇴|추방|공지|정보|목록|해체(길드장)> ... : 길드 관련 명령어',
      '/랭킹 : TOP 10 스탯 랭킹',
      '/방명록 : 방명록 보기',
      '/도움말 : 명령어 전체 안내',
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