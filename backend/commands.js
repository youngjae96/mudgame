// 명령어 핸들러 모듈
// 필요한 의존성은 인자로 주입받도록 설계

const { ITEM_TYPE } = require('./data/items');
const { ISLAND_VILLAGE_POS } = require('./data/map');
const PlayerController = require('./controllers/PlayerController');
const ShopService = require('./services/ShopService');
const { PlayerManager } = require('./playerManager');
const RoomManager = require('./roomManager');
const { sendRoomInfoToAllInRoom, broadcast } = require('./utils/broadcast');
const Guild = require('./models/Guild');
const PlayerGameService = require('./services/PlayerGameService');
const { getRoom } = require('./data/map');
const { SHOP_ITEMS } = require('./data/items');
const PlayerData = require('./models/PlayerData');

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
      // 클랜힐 자동 비활성화
      if (player.clanHealOn) {
        player.clanHealOn = false;
        ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '텔레포트로 클랜힐이 비활성화되었습니다.' }));
      }
      RoomManager.removePlayerFromRoom(playerName, player.world, player.position.x, player.position.y);
      player.world = 2;
      player.position = { x: ISLAND_VILLAGE_POS.x, y: ISLAND_VILLAGE_POS.y };
      RoomManager.addPlayerToRoom(playerName, player.world, player.position.x, player.position.y);
      PlayerManager.addPlayer(playerName, player);
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[텔레포트] 무인도 오두막으로 이동합니다!' }));
      sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, { x: ISLAND_VILLAGE_POS.x, y: ISLAND_VILLAGE_POS.y });
      sendInventory(player);
      sendCharacterInfo(player);
      sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, { x: ISLAND_VILLAGE_POS.x, y: ISLAND_VILLAGE_POS.y });
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[텔레포트] 마을 광장에서만 무인도로 이동할 수 있습니다.' }));
    }
    return;
  } else if (dest === '마을') {
    if (player.world === 2 && player.position.x === ISLAND_VILLAGE_POS.x && player.position.y === ISLAND_VILLAGE_POS.y) {
      // 클랜힐 자동 비활성화
      if (player.clanHealOn) {
        player.clanHealOn = false;
        ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '텔레포트로 클랜힐이 비활성화되었습니다.' }));
      }
      RoomManager.removePlayerFromRoom(playerName, player.world, player.position.x, player.position.y);
      player.world = 1;
      player.position = { x: 4, y: 4 };
      RoomManager.addPlayerToRoom(playerName, player.world, player.position.x, player.position.y);
      PlayerManager.addPlayer(playerName, player);
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[텔레포트] 마을 광장으로 이동합니다!' }));
      sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, { x: 4, y: 4 });
      sendInventory(player);
      sendCharacterInfo(player);
      sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, { x: 4, y: 4 });
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[텔레포트] 무인도 오두막에서만 마을로 이동할 수 있습니다.' }));
    }
    return;
  } else if (dest === '동굴') {
    if (player.world === 2 && player.position.x === 2 && player.position.y === 6) {
      // 클랜힐 자동 비활성화
      if (player.clanHealOn) {
        player.clanHealOn = false;
        ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '텔레포트로 클랜힐이 비활성화되었습니다.' }));
      }
      RoomManager.removePlayerFromRoom(playerName, player.world, player.position.x, player.position.y);
      player.world = 3;
      player.position = { x: 0, y: 0 };
      RoomManager.addPlayerToRoom(playerName, player.world, player.position.x, player.position.y);
      PlayerManager.addPlayer(playerName, player);
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[텔레포트] 동굴로 들어갑니다!' }));
      sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
      sendInventory(player);
      sendCharacterInfo(player);
      sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[텔레포트] 무인도 동굴 입구에서만 동굴로 들어갈 수 있습니다.' }));
    }
    return;
  } else {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[텔레포트] 지원하지 않는 지역입니다. (예: /텔포 무인도, /텔포 마을)' }));
  }
}

function handleInnCommand({ ws, playerName, players, getRoom, savePlayerData, sendInventory, sendCharacterInfo }) {
  const player = players[playerName];
  if (!player) return;
  const { x, y } = player.position;
  const room = getRoom(player.world, x, y);
  if (!room || room.type !== 'village') {
    ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[여관] 마을에서만 이용할 수 있습니다.' }));
    return;
  }
  if (player.hp === player.maxHp && player.mp === player.maxMp) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[여관] 이미 HP/MP가 모두 가득 찼습니다.' }));
    return;
  }
  const INN_PRICE = 50;
  if (player.gold < INN_PRICE) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[여관] 골드가 부족합니다. (필요: ${INN_PRICE}G)` }));
    return;
  }
  player.gold -= INN_PRICE;
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  savePlayerData(playerName).catch(() => {});
  sendInventory(player);
  sendCharacterInfo(player);
  ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `[여관] HP/MP가 모두 회복되었습니다! (-${INN_PRICE}G)` }));
}

async function handleAdminCommand({ ws, playerName, message, players, getRoom, sendInventory, sendCharacterInfo, savePlayerData }) {
  // /운영자 <subcmd> ...
  const args = message.trim().split(' ');
  if (args.length < 2) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 사용법: /운영자 <공지|골드지급|아이템지급|텔포|서버저장|차단> ...' }));
    return;
  }
  const subcmd = args[1];
  // /운영자 서버저장: 모든 플레이어 DB 저장
  if (subcmd === '서버저장') {
    const allPlayers = Object.keys(players);
    await Promise.all(allPlayers.map(name => savePlayerData(name).catch(() => {})));
    ws.send(JSON.stringify({ type: 'system', message: '[운영자] 모든 플레이어 데이터가 DB에 저장되었습니다.' }));
    return;
  }
  // /운영자 공지 메시지
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
  // /운영자 골드지급 닉네임 숫자
  if (subcmd === '골드지급') {
    const target = args[2];
    const amount = parseInt(args[3], 10);
    if (!target || isNaN(amount)) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 사용법: /운영자 골드지급 닉네임 숫자' }));
      return;
    }
    const targetPlayer = players[target];
    if (!targetPlayer) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 해당 닉네임의 플레이어가 없습니다: ${target}` }));
      return;
    }
    targetPlayer.gold = (targetPlayer.gold || 0) + amount;
    sendInventory(targetPlayer);
    ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${target}님에게 골드 ${amount} 지급 완료!` }));
    if (targetPlayer.ws && targetPlayer.ws.readyState === 1) {
      targetPlayer.ws.send(JSON.stringify({ type: 'system', message: `[운영자] 골드 ${amount} 지급되었습니다!` }));
    }
    return;
  }
  // /운영자 아이템지급 닉네임 아이템이름(띄어쓰기포함)
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
    // 아이템 풀에서 이름으로 검색
    const { ITEM_POOL } = require('./data/items');
    const item = ITEM_POOL.find(i => i.name === itemName);
    if (!item) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 해당 이름의 아이템이 없습니다: ${itemName}` }));
      return;
    }
    targetPlayer.inventory.push({ ...item });
    sendInventory(targetPlayer);
    ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${target}님에게 아이템 '${itemName}' 지급 완료!` }));
    if (targetPlayer.ws && targetPlayer.ws.readyState === 1) {
      targetPlayer.ws.send(JSON.stringify({ type: 'system', message: `[운영자] 아이템 '${itemName}' 지급되었습니다!` }));
    }
    return;
  }
  // /운영자 텔포 닉네임
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
    // 운영자를 타겟 플레이어 위치로 이동
    adminPlayer.world = targetPlayer.world;
    adminPlayer.position = { ...targetPlayer.position };
    ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${target}님 위치로 텔레포트 완료!` }));
    if (adminPlayer.ws && adminPlayer.ws.readyState === 1) {
      adminPlayer.ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${target}님 위치로 텔레포트 되었습니다.` }));
    }
    // 방 정보 갱신
    if (typeof global.getRoom === 'function' && typeof global.getPlayersInRoom === 'function') {
      const { MAP_SIZE, VILLAGE_POS } = require('./data/map');
      const { sendRoomInfo } = require('./utils/broadcast');
      sendRoomInfo(adminPlayer, global.getRoom, global.getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
    }
    return;
  }
  // /운영자 차단 닉네임: 해당 유저를 영구 차단(로그인/회원가입 불가) + IP도 차단
  if (subcmd === '차단') {
    const target = args[2];
    if (!target) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 사용법: /운영자 차단 닉네임' }));
      return;
    }
    // User 모델에서 차단 처리
    const User = require('./models/User');
    const BannedIp = require('./models/BannedIp');
    try {
      const userDoc = await User.findOneAndUpdate({ username: target }, { banned: true }, { new: true });
      if (!userDoc) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] 해당 닉네임의 유저(User)가 없습니다: ${target}` }));
        return;
      }
      // IP도 차단
      const ips = [userDoc.createdIp, userDoc.lastLoginIp].filter(Boolean);
      for (const ip of ips) {
        if (ip) {
          await BannedIp.findOneAndUpdate({ ip }, { ip }, { upsert: true, new: true });
        }
      }
      // 접속 중이면 강제 접속 종료
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
  // /운영자 ip차단 <IP주소>: 해당 IP를 영구 차단(회원가입/로그인 불가)
  if (subcmd === 'ip차단') {
    const targetIp = args[2];
    if (!targetIp) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 사용법: /운영자 ip차단 IP주소' }));
      return;
    }
    const BannedIp = require('./models/BannedIp');
    try {
      await BannedIp.findOneAndUpdate({ ip: targetIp }, { ip: targetIp }, { upsert: true, new: true });
      ws.send(JSON.stringify({ type: 'system', message: `[운영자] ${targetIp} IP를 영구 차단 처리했습니다.` }));
    } catch (err) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[운영자] IP 차단 실패: ${err.message}` }));
    }
    return;
  }
  ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[운영자] 지원하지 않는 서브명령어입니다.' }));
}

// 길드 명령어 핸들러
async function handleGuildCommand({ ws, playerName, message, players }) {
  // /길드 <subcmd> ...
  const args = message.trim().split(' ');
  const subcmd = args[1];
  if (!subcmd) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '[길드] 사용법: /길드 <생성|가입|수락|탈퇴|추방|공지|정보|목록> ...' }));
    return;
  }
  // /길드 생성 <길드이름>
  if (subcmd === '생성') {
    const guildName = args[2];
    if (!guildName) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 생성할 길드 이름을 입력하세요.' }));
      return;
    }
    // 길드명 8글자 이하 제한
    if (guildName.length > 8) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 길드 이름은 8글자 이하만 가능합니다.' }));
      return;
    }
    // 추가: 이미 길드 소속 여부 체크
    const already = await Guild.findOne({ members: playerName });
    if (already) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드] 이미 다른 길드에 소속되어 있습니다. 탈퇴 후 다시 시도하세요.' }));
      return;
    }
    // GuildService로 분리 예정, 여기선 DB에 중복 체크 및 생성만
    const exists = await Guild.findOne({ name: guildName });
    if (exists) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 이미 존재하는 길드명입니다.' }));
      return;
    }
    const guild = new Guild({ name: guildName, master: playerName, members: [playerName] });
    await guild.save();
    // Player 객체에 guildName 세팅
    const playerObj = PlayerManager.getPlayer(playerName);
    if (playerObj) playerObj.guildName = guildName;
    ws.send(JSON.stringify({ type: 'system', message: `[길드] '${guildName}' 길드가 생성되었습니다!` }));
    return;
  }
  // /길드 목록: 전체 길드 목록 조회
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
  // /길드 정보: 내 길드 정보 확인
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
  // /길드 가입 <길드이름>: 길드 가입 신청
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
    if (guild.joinRequests.includes(playerName)) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드] 이미 가입 신청 중입니다.' }));
      return;
    }
    guild.joinRequests.push(playerName);
    await guild.save();
    ws.send(JSON.stringify({ type: 'system', message: `[길드] '${guildName}' 길드에 가입 신청이 완료되었습니다.` }));
    return;
  }
  // /길드 수락 <유저명>: 길드장이 가입 신청을 수락
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
      // joinRequests에서 제거
      guild.joinRequests = guild.joinRequests.filter(n => n !== targetName);
      await guild.save();
      // Player 객체에 guildName 세팅
      const targetPlayerObj = PlayerManager.getPlayer(targetName);
      if (targetPlayerObj) targetPlayerObj.guildName = guild.name;
      ws.send(JSON.stringify({ type: 'system', message: `[길드] ${targetName}님의 가입을 수락했습니다.` }));
      return;
    }
    guild.members.push(targetName);
    guild.joinRequests = guild.joinRequests.filter(n => n !== targetName);
    await guild.save();
    // Player 객체에 guildName 세팅
    const targetPlayerObj = PlayerManager.getPlayer(targetName);
    if (targetPlayerObj) targetPlayerObj.guildName = guild.name;
    ws.send(JSON.stringify({ type: 'system', message: `[길드] ${targetName}님의 가입을 수락했습니다.` }));
    return;
  }
  // /길드 탈퇴: 내 길드에서 탈퇴
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
    // Player 객체에 guildName 해제
    const playerObj = PlayerManager.getPlayer(playerName);
    if (playerObj) playerObj.guildName = undefined;
    ws.send(JSON.stringify({ type: 'system', message: '[길드] 길드에서 탈퇴했습니다.' }));
    return;
  }
  // /길드 추방 <유저명>: 길드장이 멤버를 강제 탈퇴
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
    // Player 객체에 guildName 해제
    const targetPlayerObj = PlayerManager.getPlayer(targetName);
    if (targetPlayerObj) targetPlayerObj.guildName = undefined;
    ws.send(JSON.stringify({ type: 'system', message: `[길드] ${targetName}님을 길드에서 추방했습니다.` }));
    return;
  }
  // /길드 공지 <내용>: 길드장이 공지 등록/수정
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
  // /길드 해체: 길드장만 길드 삭제
  if (subcmd === '해체') {
    const guild = await Guild.findOne({ master: playerName });
    if (!guild) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드] 길드장만 해체가 가능합니다.' }));
      return;
    }
    // 모든 길드원 Player 객체에 guildName 해제
    for (const memberName of guild.members) {
      const memberObj = PlayerManager.getPlayer(memberName);
      if (memberObj) memberObj.guildName = undefined;
    }
    await Guild.deleteOne({ _id: guild._id });
    ws.send(JSON.stringify({ type: 'system', message: '[길드] 길드가 해체되었습니다.' }));
    return;
  }
  // /길드채팅 <메시지>: 길드 채팅 (최대 15개 저장)
  if (subcmd === '채팅') {
    const chatMsg = args.join(' ').trim();
    if (!chatMsg) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드채팅] 보낼 메시지를 입력하세요.' }));
      return;
    }
    const guild = await Guild.findOne({ members: playerName });
    if (!guild) {
      ws.send(JSON.stringify({ type: 'system', message: '[길드채팅] 소속된 길드가 없습니다.' }));
      return;
    }
    guild.chatLog.push({ name: playerName, message: chatMsg, time: new Date() });
    if (guild.chatLog.length > 15) guild.chatLog = guild.chatLog.slice(-15);
    await guild.save();
    ws.send(JSON.stringify({ type: 'system', message: '[길드채팅] 메시지가 전송되었습니다.' }));
    return;
  }
  // /길드채팅로그: 최근 15개 길드채팅 내역 조회
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
  // TODO: 가입, 수락, 탈퇴, 추방, 공지, 정보, 목록 등 구현
  ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '[길드] 지원하지 않는 서브명령어입니다.' }));
}

// /누구: 현재 접속중인 플레이어 목록
async function handleWhoCommand({ ws, players }) {
  const names = Object.keys(players);
  if (!names.length) {
    ws.send(JSON.stringify({ type: 'system', message: '[누구] 현재 접속 중인 플레이어가 없습니다.' }));
    return;
  }
  ws.send(JSON.stringify({ type: 'system', message: `[누구] 현재 접속중: ${names.join(', ')}` }));
}

// /도움말: 명령어 안내 메시지
async function handleHelpCommand({ ws }) {
  const msg = [
    '[명령어 안내]',
    '/전 <메시지> : 전체 채팅(축약)',
    '<메시지> : 지역 채팅(명령어 없이 입력)',
    '/동 /서 /남 /북 : 방향 이동(오른쪽/왼쪽/아래/위, 또는 맵 터치)',
    '/누구 : 현재 접속중인 플레이어 목록 보기',
    '/구매 <아이템명> : 아이템 구매',
    '/판매 <아이템명> : 아이템 판매',
    '/장착 <아이템명> : 장비 장착',
    '/해제 <아이템명> : 장비 해제',
    '/정보 : 내 능력치 확인',
    '/정보 <닉네임> : 다른 유저 능력치 확인',
    '/귓 <닉네임> <메시지> : 귓속말',
    '/귀환 : 1번 마을(마을 광장)으로 귀환',
    '/장비 : 내 장비 정보',
    '/지도 : 전체 맵 보기',
    '/텔포 <지역> : 월드 이동(예: 무인도, 마을)',
    '/길드 <생성|가입|수락|탈퇴|추방|공지|정보|목록|해체|채팅|채팅로그> ... : 길드 관련 명령어',
    '/랭킹 : TOP 10 스탯 랭킹',
    '/저장 : 내 상태 즉시 저장',
    '/도움말 : 명령어 전체 안내',
  ].join('\n');
  ws.send(JSON.stringify({ type: 'system', message: msg }));
}

function handleShopCommand(args) {
  const SHOP_ITEMS = args.SHOP_ITEMS || {};
  const categories = Object.keys(SHOP_ITEMS);
  if (!categories.length) {
    if (args.ws && typeof args.ws.send === 'function') {
      args.ws.send(JSON.stringify({ type: 'system', subtype: 'info', message: '[상점 카테고리]\n(카테고리가 없습니다)' }));
    }
    return;
  }
  return PlayerGameService.handleShop({
    ...args,
    PlayerManager,
    getRoom,
    SHOP_ITEMS,
  });
}

function handleShopSellCommand(args) {
  return PlayerGameService.handleShopSell({
    ...args,
    PlayerManager,
    getRoom,
    SHOP_ITEMS,
  });
}

// /정보 <닉네임> : 다른 유저 스탯 조회
async function handleStatCommand({ ws, playerName, message, players }) {
  const args = message.trim().split(' ');
  const targetName = args[1] || playerName;
  const target = players[targetName];
  if (!target) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `[정보] 해당 유저가 없습니다: ${targetName}` }));
    return;
  }
  const statMsg =
    `[능력치: ${targetName}]\n` +
    `HP  : ${target.hp} / ${target.maxHp}    MP  : ${target.mp} / ${target.maxMp}\n` +
    `STR : ${target.str} (Exp: ${Number(target.strExp).toFixed(2)}/${Number(target.strExpMax).toFixed(2)})   DEX: ${target.dex} (Exp: ${Number(target.dexExp).toFixed(2)}/${Number(target.dexExpMax).toFixed(2)})   INT: ${target.int} (Exp: ${Number(target.intExp).toFixed(2)}/${Number(target.intExpMax).toFixed(2)})\n` +
    `공격력: ${target.getAtk ? target.getAtk() : target.atk}   방어력: ${target.getDef ? target.getDef() : target.def}`;
  ws.send(JSON.stringify({ type: 'system', subtype: 'info', message: statMsg }));
}

// /귓 <닉네임> <메시지> : 귓속말
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
  // 보내는 사람에게도 알림
  ws.send(JSON.stringify({ type: 'chat', chatType: 'whisper', name: playerName, message: `[귓→${targetName}] ${msg}` }));
  // 받는 사람에게 전달
  target.ws.send(JSON.stringify({ type: 'chat', chatType: 'whisper', name: playerName, message: `[귓] ${msg}` }));
}

// /귀환: 1번 마을(마을 광장)로 즉시 이동
async function handleReturnCommand({ ws, playerName, PlayerManager, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo }) {
  const player = PlayerManager.getPlayer(playerName);
  if (!player) return;
  console.log(`[귀환] BEFORE: name=${playerName}, world=${player.world}, pos=(${player.position.x},${player.position.y})`);
  // 마을로 이동
  RoomManager.removePlayerFromRoom(playerName, player.world, player.position.x, player.position.y);
  console.log(`[귀환] AFTER REMOVE: name=${playerName}, world=${player.world}, pos=(${player.position.x},${player.position.y})`);
  player.world = 1;
  player.position.x = 4;
  player.position.y = 4;
  RoomManager.addPlayerToRoom(playerName, player.world, player.position.x, player.position.y);
  console.log(`[귀환] AFTER ADD: name=${playerName}, world=${player.world}, pos=(${player.position.x},${player.position.y})`);
  PlayerManager.addPlayer(playerName, player); // 상태 갱신
  ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: '[귀환] 1번 마을(마을 광장)으로 귀환합니다!' }));
  sendRoomInfo(player, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
  sendInventory(player);
  sendCharacterInfo(player);
  // 강제 동기화: 이동 후 방 정보 전체 갱신
  sendRoomInfoToAllInRoom(PlayerManager.getAllPlayers(), player.world, player.position.x, player.position.y, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS);
}

// /랭킹: 힘+민첩+지능 합산 Top 10 랭킹
async function handleRankingCommand({ ws }) {
  try {
    // 모든 유저의 name, str, dex, int만 조회
    const players = await PlayerData.find({}, 'name str dex int').lean();
    const ranked = players
      .map(p => ({
        name: p.name,
        total: (p.str || 0) + (p.dex || 0) + (p.int || 0),
        str: p.str || 0,
        dex: p.dex || 0,
        int: p.int || 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    if (!ranked.length) {
      ws.send(JSON.stringify({ type: 'system', message: '[랭킹] 랭킹에 등록된 유저가 없습니다.' }));
      return;
    }
    const msg = '[TOP 10 스탯 랭킹]\n' +
      ranked.map((p, i) => `${i + 1}. ${p.name} (힘:${p.str} 민첩:${p.dex} 인트:${p.int})`).join('\n');
    ws.send(JSON.stringify({ type: 'system', message: msg }));
  } catch (err) {
    ws.send(JSON.stringify({ type: 'system', message: '[랭킹] 랭킹 조회 중 오류가 발생했습니다.' }));
  }
}

// /클랜힐: 클랜힐 ON/OFF 토글 (클랜힐 스크롤 보유 시만 가능)
async function handleClanHealCommand({ ws, player }) {
  const hasScroll = player.inventory && player.inventory.some(i => i.name === '클랜힐 스크롤');
  if (!hasScroll) {
    ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '클랜힐 스크롤이 있어야 클랜힐을 사용할 수 있습니다.' }));
    return;
  }
  player.clanHealOn = !player.clanHealOn;
  ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: player.clanHealOn ? '클랜힐이 활성화되었습니다! (인트 경험치가 오릅니다)' : '클랜힐이 비활성화되었습니다.' }));
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
}; 