import React, { useState } from 'react';
import MiniMap from './MiniMap';
import RoomInfo from './RoomInfo';
import CharacterInfo from './CharacterInfo';
import Inventory from './Inventory';
import ChatBox from './ChatBox';
import Button from './components/Button';
import Input from './components/Input';
import RoomItems from './RoomItems';
import RoomMonsters from './RoomMonsters';

export default function GameMobileMain({
  room, mapSize, mapInfo, handleMove, nearbyRooms,
  messages, chatEndRef, handleSend, input, setInput,
  UI_LABELS, name, character, inventory, handlePickup, handleAttack, handleLogout
}) {
  const [tab, setTab] = useState('map'); // map, info, inv, room

  // 방 아이템/몬스터 렌더 함수
  const renderRoomItems = () => <RoomItems room={room} onPickup={handlePickup} />;
  const renderRoomMonsters = () => <RoomMonsters room={room} onAttack={handleAttack} />;

  return (
    <div className="mobile-root">
      <div className="mobile-header">
        <span className="mobile-title">그리머드RPG</span>
        <Button className="mobile-logout" onClick={handleLogout}>로그아웃</Button>
      </div>
      <div className="mobile-main">
        <div className="mobile-tabs">
          <Button className={tab === 'map' ? 'active' : ''} onClick={() => setTab('map')}>지도</Button>
          <Button className={tab === 'room' ? 'active' : ''} onClick={() => setTab('room')}>방정보</Button>
          <Button className={tab === 'info' ? 'active' : ''} onClick={() => setTab('info')}>내정보</Button>
          <Button className={tab === 'inv' ? 'active' : ''} onClick={() => setTab('inv')}>인벤</Button>
        </div>
        <div className="mobile-content">
          {tab === 'map' && <MiniMap room={room} mapSize={mapSize} mapInfo={mapInfo} onMove={handleMove} nearbyRooms={nearbyRooms} world={mapInfo?.world} />}
          {tab === 'room' && <RoomInfo room={room} renderRoomItems={renderRoomItems} renderRoomMonsters={renderRoomMonsters} />}
          {tab === 'info' && <CharacterInfo name={name} room={room} character={character} />}
          {tab === 'inv' && <Inventory inventory={inventory} gold={character?.gold} />}
        </div>
      </div>
      <div className="mobile-chat">
        <div className="mobile-chat-messages">
          <ChatBox messages={messages} chatEndRef={chatEndRef} />
        </div>
        <form className="mobile-chat-input" onSubmit={handleSend} autoComplete="off">
          <Input
            className="chat-input"
            placeholder={UI_LABELS?.CHAT_PLACEHOLDER || '명령어 또는 채팅 입력...'}
            aria-label="채팅 입력"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <Button className="send-btn" type="submit" aria-label="전송">{UI_LABELS?.SEND || '전송'}</Button>
        </form>
      </div>
    </div>
  );
} 