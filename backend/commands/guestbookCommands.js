// 방명록 명령어 핸들러 클래스화
const Guestbook = require('../models/Guestbook');

const guestbookCooldown = {};
class GuestbookCommand {
  async execute({ ws, playerName, message, players }) {
    const usage = '\n[방명록 사용법]\n/방명록 [페이지] : 방명록 목록(페이지네이션)\n/방명록 내용 : 글쓰기 (200자, 30초 쿨타임)';
    const args = message.trim().split(' ');
    let page = 1;
    let isWrite = false;
    let content = '';
    if (args.length === 1) {
      page = 1;
    } else if (args.length === 2 && /^\d+$/.test(args[1])) {
      page = parseInt(args[1], 10);
    } else {
      isWrite = true;
      content = args.slice(1).join(' ').trim();
    }

    if (!isWrite) {
      const PAGE_SIZE = 10;
      const total = await Guestbook.countDocuments({ type: 'guestbook' });
      const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
      page = Math.max(1, Math.min(page, maxPage));
      const list = await Guestbook.find({ type: 'guestbook' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE);
      let msg = usage + '\n';
      if (!list.length) {
        msg += '[방명록] 등록된 글이 없습니다.';
      } else {
        msg += `[방명록] (페이지 ${page}/${maxPage})\n` + list.map(e => `${e.name}: ${e.message} (${e.createdAt.toLocaleString('ko-KR', { hour12: false })})`).join('\n');
      }
      ws.send(JSON.stringify({ type: 'system', message: msg }));
      return;
    } else {
      if (!content) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: usage + '\n[방명록] 내용을 입력하세요. (/방명록 내용)' }));
        return;
      }
      if (content.length > 200) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: usage + '\n[방명록] 200자 이내로 입력하세요.' }));
        return;
      }
      const now = Date.now();
      if (guestbookCooldown[playerName] && now - guestbookCooldown[playerName] < 30000) {
        const left = ((30000 - (now - guestbookCooldown[playerName])) / 1000).toFixed(1);
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: usage + `\n[방명록] ${left}초 후 다시 작성할 수 있습니다.` }));
        return;
      }
      guestbookCooldown[playerName] = now;
      await Guestbook.create({ name: playerName, message: content });
      ws.send(JSON.stringify({ type: 'system', message: usage + '\n[방명록] 글이 등록되었습니다.' }));
      return;
    }
  }
}

module.exports = { GuestbookCommand }; 