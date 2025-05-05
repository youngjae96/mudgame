import React, { useState } from 'react';
import MiniMap from './MiniMap';
import RoomInfo from './RoomInfo';
import CharacterInfo from './CharacterInfo';
import ChatBox from './ChatBox';
import Button from './components/Button';
import Input from './components/Input';

const TABS = [
  { key: 'map', label: '맵' },
  { key: 'room', label: '방 정보' },
  { key: 'me', label: '내 정보' },
  { key: 'chat', label: '채팅' },
];

export default function GameMobileMain(props) {
  const [tab, setTab] = useState('map');
  return (
    <div className="mobile-main">
      <div className="mobile-titlebar">
        <span>그리머드RPG</span>
        <Button onClick={props.handleLogout} style={{fontSize:'1rem',padding:'6px 14px'}}>로그아웃</Button>
      </div>
      <div className="mobile-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={tab === t.key ? 'active' : ''}
            onClick={() => setTab(t.key)}
          >{t.label}</button>
        ))}
      </div>
      <div className="mobile-content">
        {tab === 'map' && <MiniMap room={props.room} mapSize={props.mapSize} mapInfo={props.mapInfo} onMove={props.handleMove} nearbyRooms={props.nearbyRooms} world={props.mapInfo?.world} />}
        {tab === 'room' && <RoomInfo room={props.room} renderRoomItems={props.renderRoomItems} renderRoomMonsters={props.renderRoomMonsters} />}
        {tab === 'me' && <CharacterInfo name={props.name} room={props.room} character={props.character} inventory={props.inventory} gold={props.character?.gold} />}
        {tab === 'chat' && <ChatBox messages={props.messages} chatEndRef={props.chatEndRef} />}
      </div>
      <form className="mobile-chat-input" onSubmit={props.handleSend}>
        <Input
          className="chat-input"
          placeholder={props.UI_LABELS?.CHAT_PLACEHOLDER || '명령어 또는 채팅 입력...'}
          aria-label="채팅 입력"
          value={props.input}
          onChange={e => props.setInput(e.target.value)}
        />
        <Button className="send-btn" type="submit" aria-label="전송">{props.UI_LABELS?.SEND || '전송'}</Button>
      </form>
    </div>
  );
} 