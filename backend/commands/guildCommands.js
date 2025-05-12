// 길드 명령어 핸들러 분리
const Guild = require('../models/Guild');
const { PlayerManager } = require('../playerManager');

async function handleGuildCommand({ ws, playerName, message, players }) {
  const args = message.trim().split(' ');
  const subcmd = args[1];
  if (!subcmd) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[길드] 사용법: /길드 <생성|가입|수락|탈퇴|추방|공지|정보|목록|해체(길드장)> ...' }));
    return;
  }
  if (subcmd === '생성') {
    const guildName = args[2];
    if (!guildName) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 생성할 길드 이름을 입력하세요.' }));
      return;
    }
    if (guildName.length > 8) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 길드 이름은 8글자 이하만 가능합니다.' }));
      return;
    }
    const already = await Guild.findOne({ members: playerName });
    if (already) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드] 이미 다른 길드에 소속되어 있습니다. 탈퇴 후 다시 시도하세요.' }));
      return;
    }
    const exists = await Guild.findOne({ name: guildName });
    if (exists) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 이미 존재하는 길드명입니다.' }));
      return;
    }
    const guild = new Guild({ name: guildName, master: playerName, members: [playerName] });
    await guild.save();
    const playerObj = PlayerManager.getPlayer(playerName);
    if (playerObj) playerObj.guildName = guildName;
    ws.send(JSON.stringify({ type: 'system', message: `[길드] '${guildName}' 길드가 생성되었습니다!` }));
    return;
  }
  if (subcmd === '목록') {
    const guilds = await Guild.find({}, 'name master members');
    if (!guilds.length) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드] 생성된 길드가 없습니다.' }));
      return;
    }
    const list = guilds.map(g => `• ${g.name} (길드장: ${g.master}, 인원: ${g.members.length})`).join('\n');
    ws.send(JSON.stringify({ type: 'system', message: `[길드 목록]\n${list}` }));
    return;
  }
  if (subcmd === '정보') {
    const guild = await Guild.findOne({ members: playerName });
    if (!guild) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드] 소속된 길드가 없습니다.' }));
      return;
    }
    const memberList = guild.members.join(', ');
    ws.send(JSON.stringify({
      type: 'system',
      message: `[길드 정보]\n이름: ${guild.name}\n길드장: ${guild.master}\n인원: ${guild.members.length}\n멤버: ${memberList}\n공지: ${guild.notice || '(없음)'}`
    }));
    return;
  }
  if (subcmd === '가입') {
    const guildName = args[2];
    if (!guildName) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 가입할 길드 이름을 입력하세요.' }));
      return;
    }
    const guild = await Guild.findOne({ name: guildName });
    if (!guild) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 해당 이름의 길드가 없습니다.' }));
      return;
    }
    if (guild.members.includes(playerName)) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드] 이미 해당 길드의 멤버입니다.' }));
      return;
    }
    guild.members.push(playerName);
    if (guild.joinRequests && Array.isArray(guild.joinRequests)) {
      guild.joinRequests = guild.joinRequests.filter(n => n !== playerName);
    }
    await guild.save();
    const playerObj = PlayerManager.getPlayer(playerName);
    if (playerObj) playerObj.guildName = guild.name;
    ws.send(JSON.stringify({ type: 'system', message: `[길드] '${guildName}' 길드에 가입되었습니다!` }));
    return;
  }
  if (subcmd === '수락') {
    const targetName = args[2];
    if (!targetName) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 수락할 유저명을 입력하세요.' }));
      return;
    }
    const guild = await Guild.findOne({ master: playerName });
    if (!guild) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 길드장만 가입 수락이 가능합니다.' }));
      return;
    }
    if (!guild.joinRequests.includes(targetName)) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드] 해당 유저는 가입 신청을 하지 않았습니다.' }));
      return;
    }
    if (guild.members.includes(targetName)) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드] 이미 멤버입니다.' }));
      guild.joinRequests = guild.joinRequests.filter(n => n !== targetName);
      await guild.save();
      const targetPlayerObj = PlayerManager.getPlayer(targetName);
      if (targetPlayerObj) targetPlayerObj.guildName = guild.name;
      ws.send(JSON.stringify({ type: 'system', message: `[길드] ${targetName}님의 가입을 수락했습니다.` }));
      return;
    }
    guild.members.push(targetName);
    guild.joinRequests = guild.joinRequests.filter(n => n !== targetName);
    await guild.save();
    const targetPlayerObj = PlayerManager.getPlayer(targetName);
    if (targetPlayerObj) targetPlayerObj.guildName = guild.name;
    ws.send(JSON.stringify({ type: 'system', message: `[길드] ${targetName}님의 가입을 수락했습니다.` }));
    return;
  }
  if (subcmd === '탈퇴') {
    const guild = await Guild.findOne({ members: playerName });
    if (!guild) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드] 소속된 길드가 없습니다.' }));
      return;
    }
    if (guild.master === playerName) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드] 길드장은 탈퇴할 수 없습니다. (길드장 위임/해체 기능은 추후 지원)' }));
      return;
    }
    guild.members = guild.members.filter(n => n !== playerName);
    guild.joinRequests = guild.joinRequests.filter(n => n !== playerName);
    await guild.save();
    const playerObj = PlayerManager.getPlayer(playerName);
    if (playerObj) playerObj.guildName = undefined;
    ws.send(JSON.stringify({ type: 'system', message: '[길드] 길드에서 탈퇴했습니다.' }));
    return;
  }
  if (subcmd === '추방') {
    const targetName = args[2];
    if (!targetName) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 추방할 유저명을 입력하세요.' }));
      return;
    }
    const guild = await Guild.findOne({ master: playerName });
    if (!guild) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 길드장만 추방이 가능합니다.' }));
      return;
    }
    if (!guild.members || !Array.isArray(guild.members)) guild.members = [];
    if (!guild.joinRequests || !Array.isArray(guild.joinRequests)) guild.joinRequests = [];
    if (targetName === playerName) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드] 자신은 추방할 수 없습니다.' }));
      return;
    }
    if (!guild.members.includes(targetName)) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드] 해당 유저는 길드 멤버가 아닙니다.' }));
      return;
    }
    guild.members = guild.members.filter(n => n !== targetName);
    guild.joinRequests = guild.joinRequests.filter(n => n !== targetName);
    await guild.save();
    const targetPlayerObj = PlayerManager.getPlayer(targetName);
    if (targetPlayerObj) targetPlayerObj.guildName = undefined;
    ws.send(JSON.stringify({ type: 'system', message: `[길드] ${targetName}님을 길드에서 추방했습니다.` }));
    return;
  }
  if (subcmd === '공지') {
    const notice = args.slice(2).join(' ');
    if (!notice) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 등록할 공지 내용을 입력하세요.' }));
      return;
    }
    const guild = await Guild.findOne({ master: playerName });
    if (!guild) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 길드장만 공지 등록/수정이 가능합니다.' }));
      return;
    }
    guild.notice = notice;
    await guild.save();
    ws.send(JSON.stringify({ type: 'system', message: '[길드] 공지가 등록/수정되었습니다.' }));
    return;
  }
  if (subcmd === '해체') {
    const guild = await Guild.findOne({ master: playerName });
    if (!guild) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드] 길드장만 해체가 가능합니다.' }));
      return;
    }
    for (const memberName of guild.members) {
      const memberObj = PlayerManager.getPlayer(memberName);
      if (memberObj) memberObj.guildName = undefined;
    }
    await Guild.deleteOne({ _id: guild._id });
    ws.send(JSON.stringify({ type: 'system', message: '[길드] 길드가 해체되었습니다.' }));
    return;
  }
  if (subcmd === '채팅') {
    const msg = args.join(' ').trim();
    if (!msg) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드채팅] 보낼 메시지를 입력하세요.' }));
      return;
    }
    const guild = await Guild.findOne({ members: playerName });
    if (!guild) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드채팅] 소속된 길드가 없습니다.' }));
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
    ws.send(JSON.stringify({ type: 'system', message: '[길드채팅] 메시지가 전송되었습니다.' }));
    return;
  }
  if (subcmd === '로그') {
    const guild = await Guild.findOne({ members: playerName });
    if (!guild || !guild.chatLog.length) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드채팅] 채팅 내역이 없습니다.' }));
      return;
    }
    const log = guild.chatLog.map(c => `[${c.name}] ${c.message}`).join('\n');
    ws.send(JSON.stringify({ type: 'system', message: `[길드채팅 최근 15개]\n${log}` }));
    return;
  }
  ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 지원하지 않는 서브명령어입니다.' }));
}

module.exports = { handleGuildCommand }; 