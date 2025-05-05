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
  if (typeof message === 'string' && message.startsWith('[공지]')) {
    return <NoticeMsg>{message.split('\n').map((line, idx) => (<React.Fragment key={idx}>{line}<br /></React.Fragment>))}</NoticeMsg>;
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

function getMessageComponent(msg, i) {
  switch (msg.type) {
    case MESSAGE_TYPES.STAT:
      return <StatMessage key={i} msg={msg} />;
    case MESSAGE_TYPES.SYSTEM:
      return <SystemMessage key={i} msg={msg} />;
    case MESSAGE_TYPES.CHAT:
      if (msg.chatType === 'global') return <GlobalChatMessage key={i} msg={msg} />;
      if (msg.chatType === 'local') return <LocalChatMessage key={i} msg={msg} />;
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
 * @returns {JSX.Element}
 */
function ChatBox({ messages, chatEndRef }) {
  const wrapperRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // 스크롤 이벤트 핸들러
  const handleScroll = (e) => {
    const el = e.target;
    // 스크롤이 거의 맨 아래(2px 오차 허용)면 autoScroll 활성화
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 2) {
      setAutoScroll(true);
    } else {
      setAutoScroll(false);
    }
  };

  useEffect(() => {
    if (autoScroll && wrapperRef.current) {
      wrapperRef.current.scrollTop = wrapperRef.current.scrollHeight - wrapperRef.current.clientHeight;
    }
  }, [messages, autoScroll]);

  useEffect(() => {
    if (chatEndRef && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, chatEndRef]);

  const flatMessages = Array.isArray(messages) ? messages.flat(Infinity) : [];
  return (
    <ChatBoxWrapper ref={wrapperRef} onScroll={handleScroll}>
      {flatMessages.map((msg, i) => getMessageComponent(msg, i))}
      <div ref={chatEndRef} />
    </ChatBoxWrapper>
  );
}

export default ChatBox; 