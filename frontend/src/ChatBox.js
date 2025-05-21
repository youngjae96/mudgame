import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { MESSAGE_TYPES, MESSAGE_SUBTYPES } from './constants';

const ChatBoxWrapper = styled.div`
  flex: 1;
  background: #181c24;
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  margin-bottom: 12px;
  font-size: 1.05rem;
  box-shadow: 0 2px 8px #0004;
  overflow-x: auto;
  word-break: break-all;
  /* 스크롤바 커스텀 */
  scrollbar-width: thin;
  scrollbar-color: #7ecfff #23272f;
  &::-webkit-scrollbar {
    width: 8px;
    background: #23272f;
    border-radius: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(120deg, #7ecfff 60%, #4fa3e3 100%);
    border-radius: 8px;
    min-height: 40px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #4fa3e3;
  }
  @media (max-width: 600px) {
    height: 100%;
    min-height: 0;
    max-height: 100%;
    overflow-y: auto;
    padding: 8px 4px 0 4px;
    margin-bottom: 0;
    font-size: 1.12rem;
  }
`;
const SystemMsg = styled.div`
  color: #7ecfff;
  font-style: italic;
  margin-bottom: 4px;
`;
const StatMsg = styled.pre`
  background: #232837;
  color: #ffe066;
  font-family: 'Consolas', 'Pretendard', 'Noto Sans KR', Arial, sans-serif;
  border-radius: 8px;
  padding: 10px 16px;
  margin: 10px 0;
  font-size: 1.02rem;
  box-shadow: 0 2px 8px #0002;
  white-space: pre-wrap;
`;
const ChatMsg = styled.div`
  margin-bottom: 4px;
`;
const GlobalChatMsg = styled.div`
  margin-bottom: 4px;
  color: #ffb347;
  font-weight: bold;
`;
const LocalChatMsg = styled.div`
  margin-bottom: 4px;
  color: #fff;
`;
const BattleMsg = styled.div`
  margin-bottom: 4px;
  font-weight: bold;
  ${({ subtype }) => subtype === 'attack' && 'color: #ff7e7e;'}
  ${({ subtype }) => subtype === 'counter' && 'color: #7ecfff;'}
  ${({ subtype }) => subtype === 'kill' && 'color: #ffe066;'}
  ${({ subtype }) => subtype === 'death' && 'color: #ff4e4e;'}
  ${({ subtype }) => subtype === 'heal' && 'color: #7effa9;'}
`;
const HPBar = styled.div`
  height: 14px;
  border-radius: 7px;
  background: #333;
  margin: 6px 0 2px 0;
  width: 100%;
  max-width: 160px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
`;
const HPFill = styled.div`
  height: 100%;
  border-radius: 7px;
  background: ${({ color }) => color || '#7ecfff'};
  width: ${({ percent }) => percent || 0}%;
  transition: width 0.3s;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
`;
const HPLabel = styled.div`
  width: 100%;
  text-align: center;
  font-size: 0.92rem;
  color: #fff;
  font-weight: bold;
  z-index: 2;
  position: relative;
  text-shadow: 0 1px 2px #000a;
  pointer-events: none;
`;
const NoticeMsg = styled.div`
  color: #fff200;
  background: #d32f2f;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 8px;
  margin-bottom: 6px;
  box-shadow: 0 0 12px #fff200, 0 0 2px #d32f2f;
  font-size: 1.08rem;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 8px #000a, 0 0 4px #fff200;
`;
const WhisperMsg = styled.div`
  margin-bottom: 4px;
  color: #2ecc40;
  font-weight: bold;
`;
const GuildChatMsg = styled.div`
  margin-bottom: 4px;
  color: #ff66cc;
  font-weight: bold;
`;
const ExpEventBanner = styled.div`
  width: 100%;
  background: linear-gradient(90deg, #ff9800 60%, #ffd54f 100%);
  color: #fff;
  font-weight: bold;
  text-align: center;
  padding: 7px 0 6px 0;
  font-size: 1.08rem;
  letter-spacing: 1px;
  border-radius: 8px 8px 0 0;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px #0002;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  @media (max-width: 600px) {
    font-size: 1.13rem;
    padding: 8px 0 7px 0;
    margin-bottom: 6px;
  }
`;

function getBattleIcon(subtype) {
  switch (subtype) {
    case 'attack': return '⚔️';
    case 'counter': return '🛡️';
    case 'kill': return '💀';
    case 'death': return '⚠️';
    case 'heal': return '❤️';
    default: return '';
  }
}

function StatMessage({ msg }) {
  return <StatMsg>{msg.message || msg.text}</StatMsg>;
}
function SystemMessage({ msg }) {
  let message = msg.message || '';
  if (typeof message === 'object') {
    message = JSON.stringify(message);
  }
  if (
    msg.subtype === 'error' &&
    typeof message === 'string' &&
    message.includes('획득했습니다!')
  ) {
    return <NoticeMsg>{message.split('\n').map((line, idx) => (<React.Fragment key={idx}>{line}<br /></React.Fragment>))}</NoticeMsg>;
  }
  if (msg.subtype === 'error') {
    return <SystemMsg>{message.split('\n').map((line, idx) => (<React.Fragment key={idx}>{line}<br /></React.Fragment>))}</SystemMsg>;
  }
  if (typeof message === 'string' && message.startsWith('[공지]')) {
    return <NoticeMsg>{message.split('\n').map((line, idx) => (<React.Fragment key={idx}>{line}<br /></React.Fragment>))}</NoticeMsg>;
  }
  if (msg.subtype === 'alert') {
    return <div style={{ color: '#ff3333', fontWeight: 'bold' }}>{message.split('\n').map((line, idx) => (<React.Fragment key={idx}>{line}<br /></React.Fragment>))}</div>;
  }
  return <SystemMsg>{message.split('\n').map((line, idx) => (<React.Fragment key={idx}>{line}<br /></React.Fragment>))}</SystemMsg>;
}
function GlobalChatMessage({ msg }) {
  return <GlobalChatMsg><span>[전체] <b>{msg.name}</b>: {msg.message}</span></GlobalChatMsg>;
}
function LocalChatMessage({ msg }) {
  return <LocalChatMsg><span>[지역] <b>{msg.name}</b>: {msg.message}</span></LocalChatMsg>;
}
function BattleMessage({ msg }) {
  const icon = getBattleIcon(msg.subtype);
  let detail = null;
  let text = msg.text;
  if (typeof text === 'object') {
    text = JSON.stringify(text);
  }
  switch (msg.subtype) {
    case 'attack':
      detail = <>{msg.actor}의 {icon} {msg.target} 공격! (피해: {msg.value})</>;
      break;
    case 'counter':
      detail = <>{msg.actor}의 {icon} {msg.target} 반격! (피해: {msg.value})</>;
      break;
    case 'kill':
      detail = <>{msg.actor}가 {msg.target}을(를) 처치! {msg.gold ? ` (골드: ${msg.gold}G)` : ''}</>;
      break;
    case 'death':
      detail = <>{icon} {text}</>;
      break;
    case 'exp':
      detail = <>{text}</>;
      break;
    default:
      detail = <>{text}</>;
  }
  return (
    <BattleMsg subtype={msg.subtype}>
      {detail}
      {msg.monsterHp !== undefined && msg.monsterMaxHp !== undefined && (
        <HPBar>
          <HPFill color="#ff7e7e" percent={Math.round((msg.monsterHp / msg.monsterMaxHp) * 100)} />
          <HPLabel>몬스터 HP: {msg.monsterHp} / {msg.monsterMaxHp}</HPLabel>
        </HPBar>
      )}
      {msg.playerHp !== undefined && msg.playerMaxHp !== undefined && (
        <HPBar>
          <HPFill color="#7ecfff" percent={Math.round((msg.playerHp / msg.playerMaxHp) * 100)} />
          <HPLabel>내 HP: {msg.playerHp} / {msg.playerMaxHp}</HPLabel>
        </HPBar>
      )}
    </BattleMsg>
  );
}
function DefaultChatMessage({ msg }) {
  let content = msg.message || msg.text || '';
  if (typeof content === 'object') {
    content = JSON.stringify(content);
  }
  return <ChatMsg>{msg.type === 'chat' ? <b>{msg.name}: </b> : null}{content.toString().split('\n').map((line, idx) => (<React.Fragment key={idx}>{line}<br /></React.Fragment>))}</ChatMsg>;
}
function GuildChatMessage({ msg }) {
  return <GuildChatMsg><span>[길드] <b>{msg.name}</b>: {msg.message}</span></GuildChatMsg>;
}

function getMessageComponent(msg, i) {
  switch (msg.type) {
    case MESSAGE_TYPES.STAT:
      return <StatMessage key={i} msg={msg} />;
    case MESSAGE_TYPES.SYSTEM:
      return <SystemMessage key={i} msg={msg} />;
    case MESSAGE_TYPES.CHAT:
      if (msg.chatType === 'global') return <GlobalChatMessage key={i} msg={msg} />;
      if (msg.chatType === 'local') return <LocalChatMessage key={i} msg={msg} />;
      if (msg.chatType === 'guild') return <GuildChatMessage key={i} msg={msg} />;
      if (msg.chatType === 'whisper') return <WhisperMsg key={i}><span><b>{msg.name}</b>: {msg.message}</span></WhisperMsg>;
      return <DefaultChatMessage key={i} msg={msg} />;
    case MESSAGE_TYPES.BATTLE:
      return <BattleMessage key={i} msg={msg} />;
    default:
      return <DefaultChatMessage key={i} msg={msg} />;
  }
}

/**
 * 채팅 메시지 박스 컴포넌트
 * @param {object} props - 컴포넌트 props
 * @param {Array} props.messages - 채팅 메시지 목록
 * @param {React.RefObject} props.chatEndRef - 채팅 끝 참조 객체
 * @param {boolean} props.expEventActive - 경험치 이벤트 활성 여부
 * @returns {JSX.Element}
 */
function ChatBox({ messages, chatEndRef, expEventActive }) {
  const wrapperRef = useRef(null);

  // 최대 100개 메시지만 유지
  const MAX_MESSAGES = 100;
  const flatMessages = Array.isArray(messages) ? messages.flat(Infinity).slice(-MAX_MESSAGES) : [];

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollTop = wrapperRef.current.scrollHeight - wrapperRef.current.clientHeight;
    }
  }, [flatMessages]);

  return (
    <ChatBoxWrapper ref={wrapperRef}>
      {expEventActive && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            background: 'linear-gradient(90deg, #ffe066 70%, #ffb347 100%)',
            color: '#232837',
            fontWeight: 'bold',
            fontSize: '0.98rem',
            padding: '4px 0',
            textAlign: 'center',
            zIndex: 10,
            borderRadius: '8px 8px 0 0',
            letterSpacing: 0.2,
            whiteSpace: 'normal',
          }}
        >
          <span role="img" aria-label="fire">🔥</span>
          경험치 +20% 주말이벤트 중!
          <span role="img" aria-label="fire">🔥</span>
        </div>
      )}
      {flatMessages.map((msg, i) => getMessageComponent(msg, i))}
    </ChatBoxWrapper>
  );
}

export function ChatOnlyBox({ messages, tab, setTab }) {
  const boxRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const MAX_MESSAGES = 100;
  // 길드탭일 때는 필터 없이 전체, 나머지는 기존대로
  const filtered = Array.isArray(messages)
    ? (tab === 'guild'
        ? messages.slice(-MAX_MESSAGES)
        : messages.filter(msg => msg.type === 'chat' && (
            (tab === 'all' && msg.chatType === 'global') ||
            (tab === 'local' && msg.chatType === 'local') ||
            (tab === 'whisper' && msg.chatType === 'whisper')
          )).slice(-MAX_MESSAGES)
      )
    : [];
  // 스크롤 이벤트 핸들러
  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 2) {
      setAutoScroll(true);
    } else {
      setAutoScroll(false);
    }
  };
  useEffect(() => {
    if (boxRef.current) {
      const el = boxRef.current;
      if (el.scrollHeight - el.scrollTop - el.clientHeight > 2) {
        setAutoScroll(false);
      }
    }
    if (autoScroll && boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight - boxRef.current.clientHeight;
    }
  }, [filtered, autoScroll]);
  return (
    <div style={{ background: '#181c24', borderRadius: 8, padding: 12, marginBottom: 12, boxShadow: '0 2px 8px #0004' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, justifyContent: 'center' }}>
        <button onClick={() => setTab('all')} style={{ background: tab === 'all' ? '#7ecfff' : '#232837', color: tab === 'all' ? '#232837' : '#7ecfff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 'bold', fontSize: '1.01rem', cursor: 'pointer', transition: 'all 0.15s' }}>전체</button>
        <button onClick={() => setTab('local')} style={{ background: tab === 'local' ? '#7ecfff' : '#232837', color: tab === 'local' ? '#232837' : '#7ecfff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 'bold', fontSize: '1.01rem', cursor: 'pointer', transition: 'all 0.15s' }}>지역</button>
        <button onClick={() => setTab('guild')} style={{ background: tab === 'guild' ? '#7ecfff' : '#232837', color: tab === 'guild' ? '#232837' : '#7ecfff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 'bold', fontSize: '1.01rem', cursor: 'pointer', transition: 'all 0.15s' }}>길드</button>
        <button onClick={() => setTab('whisper')} style={{ background: tab === 'whisper' ? '#7ecfff' : '#232837', color: tab === 'whisper' ? '#232837' : '#7ecfff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 'bold', fontSize: '1.01rem', cursor: 'pointer', transition: 'all 0.15s' }}>귓속말</button>
        <button onClick={() => setTab('battle')} style={{ background: tab === 'battle' ? '#7ecfff' : '#232837', color: tab === 'battle' ? '#232837' : '#7ecfff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 'bold', fontSize: '1.01rem', cursor: 'pointer', transition: 'all 0.15s' }}>전투로그</button>
      </div>
      <div ref={boxRef} className="patchnote-scroll" style={{ maxHeight: 130, minHeight: 60, overflowY: 'auto', fontSize: '1.01rem', background: 'none', padding: 0, margin: 0, ...(window.innerWidth <= 600 ? { maxHeight: 160 } : {}) }} onScroll={handleScroll}>
        {filtered.length === 0 && tab !== 'battle' && <div style={{ color: '#888', textAlign: 'center', marginTop: 16 }}>채팅 메시지가 없습니다.</div>}
        {tab === 'battle'
          ? (Array.isArray(messages) ? messages.filter(msg => msg.type === 'battle') : []).map((msg, i) => <BattleMessage key={i} msg={msg} />)
          : filtered.map((msg, i) => (
            <div key={i} style={{ color: msg.chatType === 'whisper' ? '#2ecc40' : (msg.chatType === 'global' ? '#ffb347' : (msg.chatType === 'guild' ? '#ff66cc' : '#fff')), marginBottom: 4 }}>
              <span style={{ fontWeight: 'bold' }}>[{msg.chatType === 'global' ? '전체' : msg.chatType === 'local' ? '지역' : msg.chatType === 'guild' ? '길드' : '귓속말'}] {msg.name}:</span> {msg.message}
            </div>
          ))}
        {tab === 'battle' && (Array.isArray(messages) ? messages.filter(msg => msg.type === 'battle').length === 0 : true) && <div style={{ color: '#888', textAlign: 'center', marginTop: 16 }}>전투 로그가 없습니다.</div>}
      </div>
    </div>
  );
}

export default ChatBox; 