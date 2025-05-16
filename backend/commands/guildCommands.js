// 길드 명령어 핸들러 클래스화
const Guild = require('../models/Guild');
const { PlayerManager } = require('../playerManager');
const User = require('../models/User');

class GuildCommand {
  async execute({ ws, playerName, message, players }) {
    const args = message.trim().split(' ');
    const subcmd = args[1];
    if (!subcmd) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[길드] 사용법: /길드 <생성|가입|수락|탈퇴|추방|공지|정보|목록|해체(길드장)|위임|가입방식|신청목록>\n- /길드 위임 [유저명]: 길드장 권한을 다른 길드원에게 위임 (길드장만, 1분 쿨타임)\n- /길드 가입방식 [자유가입|승인제]: 길드장이 길드 가입방식을 변경' }));
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
      const guild = new Guild({ name: guildName, master: playerName, members: [playerName], joinType: 'free' });
      await guild.save();
      const playerObj = PlayerManager.getPlayer(playerName);
      if (playerObj) playerObj.guildName = guildName;
      ws.send(JSON.stringify({ type: 'system', message: `[길드] '${guildName}' 길드가 생성되었습니다!` }));
      return;
    }
    if (subcmd === '목록') {
      const guilds = await Guild.find({}, 'name master members joinType');
      if (!guilds.length) {
        ws.send(JSON.stringify({ type: 'system', message: '[길드] 생성된 길드가 없습니다.' }));
        return;
      }
      const list = guilds.map(g => `• ${g.name} (길드장: ${g.master}, 인원: ${g.members.length}/20, 가입방식: ${g.joinType === 'approval' ? '승인제' : '자유가입'})`).join('\n');
      ws.send(JSON.stringify({ type: 'system', message: `[길드 목록]\n${list}` }));
      return;
    }
    if (subcmd === '정보') {
      const guild = await Guild.findOne({ members: playerName });
      if (!guild) {
        ws.send(JSON.stringify({ type: 'system', message: '[길드] 소속된 길드가 없습니다.' }));
        return;
      }
      // 길드원별 마지막 접속 시간 조회
      const members = guild.members;
      const users = await User.find({ username: { $in: members } });
      // username -> lastLoginAt 매핑
      const lastLoginMap = {};
      users.forEach(u => {
        lastLoginMap[u.username] = u.lastLoginAt;
      });
      // 한국시간 기준 상대적 시간 포맷 함수
      function formatLastLogin(date) {
        if (!date) return '-';
        const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // KST
        const d = new Date(date.getTime() + 9 * 60 * 60 * 1000); // KST
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);
        if (diffMin < 5) return '방금 접속';
        if (diffMin < 60) return `${diffMin}분 전`;
        if (diffHour < 24) return `${diffHour}시간 전`;
        if (diffDay === 1) return '어제';
        if (diffDay < 7) return `${diffDay}일 전`;
        return '오래됨';
      }
      const memberList = members.map(name => {
        const isOnline = !!PlayerManager.getPlayer(name);
        if (isOnline) return `${name} (접속중)`;
        const last = lastLoginMap[name];
        return `${name} (${formatLastLogin(last)})`;
      }).join(', ');
      // 클랜힐 정보 추가
      // 현재 클랜힐 사용 중인 유저 목록
      const onlinePlayers = PlayerManager.getAllPlayers();
      const clanHealers = guild.members.filter(name => onlinePlayers[name] && onlinePlayers[name].clanHealOn);
      // 총 회복량: 현재 클랜힐 on인 유저들의 회복량 합산
      const totalHealAmount = clanHealers.reduce((sum, name) => {
        const p = onlinePlayers[name];
        if (!p) return sum;
        const healAmount = 1 + Math.floor((p.int || 0) / 5);
        return sum + healAmount;
      }, 0);
      ws.send(JSON.stringify({
        type: 'system',
        message: `[길드 정보]\n이름: ${guild.name}\n길드장: ${guild.master}\n인원: ${guild.members.length}/20\n가입방식: ${guild.joinType === 'approval' ? '승인제' : '자유가입'}\n멤버: ${memberList}\n공지: ${guild.notice || '(없음)'}\n---\n[클랜힐 정보]\n현재 사용 중: ${clanHealers.length ? clanHealers.join(', ') : '없음'}\n총 회복량: ${totalHealAmount}`
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
      if (guild.members.length >= 20) {
        ws.send(JSON.stringify({ type: 'system', message: '[길드] 최대 인원(20명) 초과로 가입할 수 없습니다.' }));
        return;
      }
      if (guild.joinType === 'approval') {
        if (!guild.joinRequests.includes(playerName)) guild.joinRequests.push(playerName);
        await guild.save();
        ws.send(JSON.stringify({ type: 'system', message: '[길드] 가입 신청이 완료되었습니다. 길드장의 승인을 기다려주세요.' }));
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
      // 이미 다른 길드에 소속되어 있는지 체크
      const already = await Guild.findOne({ members: targetName });
      if (already && already.name !== guild.name) {
        ws.send(JSON.stringify({ type: 'system', message: '[길드] 이미 다른 길드에 소속되어 있습니다.' }));
        // 신청 목록에서 제거
        guild.joinRequests = guild.joinRequests.filter(n => n !== targetName);
        await guild.save();
        return;
      }
      if (guild.members.length >= 20) {
        ws.send(JSON.stringify({ type: 'system', message: '[길드] 최대 인원(20명) 초과로 더 이상 수락할 수 없습니다.' }));
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
    if (subcmd === '위임') {
      const targetName = args[2];
      if (!targetName) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 위임할 유저명을 입력하세요.' }));
        return;
      }
      const guild = await Guild.findOne({ master: playerName });
      if (!guild) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 길드장만 위임이 가능합니다.' }));
        return;
      }
      if (!guild.members.includes(targetName)) {
        ws.send(JSON.stringify({ type: 'system', message: '[길드] 해당 유저는 길드 멤버가 아닙니다.' }));
        return;
      }
      // 1분 쿨타임 체크
      const now = Date.now();
      const last = guild.lastMasterChange ? new Date(guild.lastMasterChange).getTime() : 0;
      if (now - last < 60 * 1000) {
        const left = Math.ceil((60 * 1000 - (now - last)) / 1000);
        ws.send(JSON.stringify({ type: 'system', message: `[길드] 위임 쿨타임이 ${left}초 남았습니다.` }));
        return;
      }
      guild.master = targetName;
      guild.lastMasterChange = new Date();
      await guild.save();
      ws.send(JSON.stringify({ type: 'system', message: `[길드] 길드장이 ${targetName}님으로 위임되었습니다.` }));
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
    if (subcmd === '가입방식') {
      const typeArg = args[2];
      if (!typeArg || !['자유가입', '승인제', 'free', 'approval'].includes(typeArg)) {
        ws.send(JSON.stringify({ type: 'system', message: '[길드] 가입방식은 "자유가입" 또는 "승인제"로 설정할 수 있습니다.' }));
        return;
      }
      const guild = await Guild.findOne({ master: playerName });
      if (!guild) {
        ws.send(JSON.stringify({ type: 'system', message: '[길드] 길드장만 가입방식 변경이 가능합니다.' }));
        return;
      }
      const newType = (typeArg === '승인제' || typeArg === 'approval') ? 'approval' : 'free';
      guild.joinType = newType;
      await guild.save();
      ws.send(JSON.stringify({ type: 'system', message: `[길드] 가입방식이 "${newType === 'approval' ? '승인제' : '자유가입'}"으로 변경되었습니다.` }));
      return;
    }
    if (subcmd === '신청목록') {
      const guild = await Guild.findOne({ master: playerName });
      if (!guild) {
        ws.send(JSON.stringify({ type: 'system', message: '[길드] 길드장만 신청목록을 볼 수 있습니다.' }));
        return;
      }
      if (guild.joinType !== 'approval') {
        ws.send(JSON.stringify({ type: 'system', message: '[길드] 승인제 길드만 신청목록을 볼 수 있습니다.' }));
        return;
      }
      if (!guild.joinRequests || guild.joinRequests.length === 0) {
        ws.send(JSON.stringify({ type: 'system', message: '[길드] 가입 신청자가 없습니다.' }));
        return;
      }
      ws.send(JSON.stringify({ type: 'system', message: `[길드] 가입 신청자 목록: ${guild.joinRequests.join(', ')}` }));
      return;
    }
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 지원하지 않는 서브명령어입니다.' }));
  }
}

module.exports = { GuildCommand }; 