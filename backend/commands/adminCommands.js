// 운영자 명령어 핸들러 클래스화
const { ITEM_POOL, SHOP_ITEMS } = require('../data/items');
const { broadcast } = require('../utils/broadcast');
const { PlayerManager } = require('../playerManager');

class AdminCommand {
  async execute({ ws, playerName, message, players, getRoom, sendInventory, sendCharacterInfo, savePlayerData }) {
    if (playerName !== 'admin') {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 권한이 없습니다. (admin만 사용 가능)' }));
      return;
    }
    const args = message.trim().split(' ');
    if (args.length < 2) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 사용법: /운영자 <공지|골드지급|아이템지급|텔포|서버저장|차단|경험치|경험치해제> ...' }));
      return;
    }
    const subcmd = args[1];
    if (subcmd === '서버저장') {
      const allPlayers = Object.keys(players);
      await Promise.all(allPlayers.map(name => savePlayerData(name).catch(() => {})));
      ws.send(JSON.stringify({ type: 'system', message: '[운영자] 모든 플레이어 데이터가 DB에 저장되었습니다.' }));
      return;
    }
    if (subcmd === '공지') {
      const notice = args.slice(2).join(' ');
      if (notice === '취소') {
        if (typeof global.currentNotice !== 'undefined') global.currentNotice = null;
        if (typeof global.wss !== 'undefined') {
          broadcast(global.wss, { type: 'notice', notice: null });
        }
        ws.send(JSON.stringify({ type: 'system', message: '[운영자] 공지가 해제되었습니다.' }));
        return;
      }
      if (!notice) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 공지할 메시지를 입력하세요. (/운영자 공지 <메시지>)' }));
        return;
      }
      if (typeof global.currentNotice !== 'undefined') global.currentNotice = notice;
      if (typeof global.wss !== 'undefined') {
        broadcast(global.wss, { type: 'notice', notice });
      }
      ws.send(JSON.stringify({ type: 'system', message: '[운영자] 공지가 등록되었습니다.' }));
      return;
    }
    if (subcmd === '골드지급') {
      const target = args[2];
      const amount = parseInt(args[3], 10);
      if (!target || isNaN(amount)) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 사용법: /운영자 골드지급 닉네임 숫자' }));
        return;
      }
      const playerObj = PlayerManager.getPlayer(target);
      if (!playerObj) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 해당 닉네임의 플레이어가 없습니다: ${target}` }));
        return;
      }
      playerObj.gold = (playerObj.gold || 0) + amount;
      if (typeof savePlayerData === 'function') {
        await savePlayerData(target).catch(() => {});
      }
      sendInventory(playerObj);
      ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${target}님에게 골드 ${amount} 지급 완료!` }));
      if (playerObj.ws && playerObj.ws.readyState === 1) {
        playerObj.ws.send(JSON.stringify({ type: 'system', message: `[운영자] 골드 ${amount} 지급되었습니다!` }));
      }
      return;
    }
    if (subcmd === '아이템지급') {
      const target = args[2];
      const itemName = args.slice(3).join(' ');
      if (!target || !itemName) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 사용법: /운영자 아이템지급 닉네임 아이템이름' }));
        return;
      }
      const targetPlayer = players[target];
      if (!targetPlayer) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 해당 닉네임의 플레이어가 없습니다: ${target}` }));
        return;
      }
      const normalize = s => s.replace(/\s/g, '').toLowerCase();
      let item = ITEM_POOL.find(i => normalize(i.name) === normalize(itemName));
      if (!item) {
        for (const cat of Object.keys(SHOP_ITEMS)) {
          item = SHOP_ITEMS[cat].find(i => normalize(i.name) === normalize(itemName));
          if (item) break;
        }
      }
      if (!item) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 해당 이름의 아이템이 없습니다: ${itemName}` }));
        return;
      }
      const addSuccess = targetPlayer.addToInventory({ ...item }, targetPlayer.ws);
      if (!addSuccess) {
        ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${target}님의 인벤토리가 가득 차 지급에 실패했습니다.` }));
        return;
      }
      sendInventory(targetPlayer);
      ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${target}님에게 아이템 '${itemName}' 지급 완료!` }));
      if (targetPlayer.ws && targetPlayer.ws.readyState === 1) {
        targetPlayer.ws.send(JSON.stringify({ type: 'system', message: `[운영자] 아이템 '${itemName}' 지급되었습니다!` }));
      }
      return;
    }
    if (subcmd === '텔포') {
      const target = args[2];
      if (!target) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 사용법: /운영자 텔포 닉네임' }));
        return;
      }
      const targetPlayer = players[target];
      const adminPlayer = players[playerName];
      if (!targetPlayer || !adminPlayer) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 해당 닉네임의 플레이어가 없습니다: ${target}` }));
        return;
      }
      adminPlayer.world = targetPlayer.world;
      adminPlayer.position = { ...targetPlayer.position };
      ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${target}님 위치로 텔레포트 완료!` }));
      if (adminPlayer.ws && adminPlayer.ws.readyState === 1) {
        adminPlayer.ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${target}님 위치로 텔레포트 되었습니다.` }));
      }
      if (typeof global.getRoom === 'function' && typeof global.getPlayersInRoom === 'function') {
        const { MAP_SIZE, VILLAGE_POS } = require('../data/map');
        const { sendRoomInfo } = require('../utils/broadcast');
        sendRoomInfo(adminPlayer, global.getRoom, global.getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
      }
      return;
    }
    if (subcmd === '차단') {
      const target = args[2];
      if (!target) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 사용법: /운영자 차단 닉네임' }));
        return;
      }
      const User = require('../models/User');
      const BannedIp = require('../models/BannedIp');
      try {
        const userDoc = await User.findOneAndUpdate({ username: target }, { banned: true }, { new: true });
        if (!userDoc) {
          ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 해당 닉네임의 유저(User)가 없습니다: ${target}` }));
          return;
        }
        const ips = [userDoc.createdIp, userDoc.lastLoginIp].filter(Boolean);
        for (const ip of ips) {
          if (ip) {
            await BannedIp.findOneAndUpdate({ ip }, { ip }, { upsert: true, new: true });
          }
        }
        const targetPlayer = players[target];
        if (targetPlayer && targetPlayer.ws) {
          targetPlayer.ws.close();
        }
        ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${target}님을 영구 차단(계정+IP) 처리했습니다.` }));
      } catch (err) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 차단 처리 중 오류: ${err.message}` }));
      }
      return;
    }
    if (subcmd === 'ip차단') {
      const targetIp = args[2];
      if (!targetIp) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 사용법: /운영자 ip차단 IP주소' }));
        return;
      }
      const BannedIp = require('../models/BannedIp');
      try {
        await BannedIp.findOneAndUpdate({ ip: targetIp }, { ip: targetIp }, { upsert: true, new: true });
        ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${targetIp} IP를 영구 차단 처리했습니다.` }));
      } catch (err) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] IP 차단 실패: ${err.message}` }));
      }
      return;
    }
    if (subcmd === '경험치') {
      global.expDoubleEvent = true;
      if (typeof global.wss !== 'undefined') {
        broadcast(global.wss, { type: 'notice', notice: '경험치 1.2배 이벤트가 시작되었습니다! (테스트/운영용)' });
        const { PlayerManager } = require('../playerManager');
        const { sendCharacterInfo } = require('../utils/broadcast');
        Object.values(PlayerManager.getAllPlayers()).forEach(p => sendCharacterInfo(p));
      }
      ws.send(JSON.stringify({ type: 'system', message: '[운영자] 경험치 1.2배 이벤트가 시작되었습니다.' }));
      return;
    }
    if (subcmd === '경험치해제') {
      global.expDoubleEvent = false;
      if (typeof global.wss !== 'undefined') {
        broadcast(global.wss, { type: 'notice', notice: '경험치 1.2배 이벤트가 종료되었습니다.' });
        const { PlayerManager } = require('../playerManager');
        const { sendCharacterInfo } = require('../utils/broadcast');
        Object.values(PlayerManager.getAllPlayers()).forEach(p => sendCharacterInfo(p));
      }
      ws.send(JSON.stringify({ type: 'system', message: '[운영자] 경험치 1.2배 이벤트가 종료되었습니다.' }));
      return;
    }
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 지원하지 않는 서브명령어입니다.' }));
  }
}

module.exports = { AdminCommand }; 