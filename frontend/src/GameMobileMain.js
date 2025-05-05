import React, { useState } from 'react';
import styled from 'styled-components';
import MiniMap from './MiniMap';
import RoomInfo from './RoomInfo';
import CharacterInfo from './CharacterInfo';
import Inventory from './Inventory';
import ChatBox from './ChatBox';
import Button from './components/Button';
import Input from './components/Input';
import RoomItems from './RoomItems';
import RoomMonsters from './RoomMonsters';

const MobileRoot = styled.div`
  width: 100vw;
  min-height: 100vh;
  background: #181c24;
  display: flex;
  flex-direction: column;
`;
const MobileHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 8px 16px;
  background: #232837;
  border-radius: 0 0 18px 18px;
`;
const MobileTitle = styled.span`
  font-size: 1.3rem;
  font-weight: bold;
  color: #7ecfff;
`;
const MobileMain = styled.div`
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
const MobileTopRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 220px;
  min-height: 0;
  gap: 8px;
  margin-bottom: 4px;
`;
const MobileMapPanel = styled.div`
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  background: #232837;
  border-radius: 10px;
  box-shadow: 0 2px 8px #0002;
  padding: 8px 4px;
  overflow: auto;
  display: flex;
  flex-direction: column;
`;
const MobileRoomPanel = styled.div`
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  background: #232837;
  border-radius: 10px;
  box-shadow: 0 2px 8px #0002;
  padding: 8px 4px;
  overflow: auto;
  display: flex;
  flex-direction: column;
`;
const MobileChat = styled.div`
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #232837;
  border-top: 1px solid #222;
  box-shadow: 0 -2px 8px #0002;
`;
const MobileChatMessages = styled.div`
  flex: 1 1 0;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  padding: 6px 8px 0 8px;
  font-size: 0.98rem;
  background: #232837;
`;
const MobileChatInput = styled.form`
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  background: #232837;
`;
const MobileTabs = styled.div`
  display: flex;
  justify-content: space-around;
  background: #232837;
  border-bottom: 1px solid #222;
`;
const MobileContent = styled.div`
  flex: 0 0 auto;
  min-height: 0;
  overflow: auto;
  padding: 8px 4px 0 4px;
  background: #181c24;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

export default function GameMobileMain({
  room, mapSize, mapInfo, handleMove, nearbyRooms,
  messages, chatEndRef, handleSend, input, setInput,
  UI_LABELS, name, character, inventory, handlePickup, handleAttack, handleLogout
}) {
  const [tab, setTab] = useState('info'); // info, inv

  // 방 아이템/몬스터 렌더 함수
  const renderRoomItems = () => <RoomItems room={room} onPickup={handlePickup} />;
  const renderRoomMonsters = () => <RoomMonsters room={room} onAttack={handleAttack} />;

  return (
    <MobileRoot>
      <MobileHeader>
        <MobileTitle>그리머드RPG</MobileTitle>
        <Button className="mobile-logout" onClick={handleLogout}>로그아웃</Button>
      </MobileHeader>
      <MobileMain>
        <MobileTopRow>
          <MobileMapPanel>
            <MiniMap room={room} mapSize={mapSize} mapInfo={mapInfo} onMove={handleMove} nearbyRooms={nearbyRooms} world={mapInfo?.world} />
          </MobileMapPanel>
          <MobileRoomPanel>
            <RoomInfo room={room} renderRoomItems={renderRoomItems} renderRoomMonsters={renderRoomMonsters} />
          </MobileRoomPanel>
        </MobileTopRow>
        <MobileChat>
          <MobileChatMessages>
            <ChatBox messages={messages} chatEndRef={chatEndRef} />
          </MobileChatMessages>
          <MobileChatInput onSubmit={handleSend} autoComplete="off">
            <Input
              className="chat-input"
              placeholder={UI_LABELS?.CHAT_PLACEHOLDER || '명령어 또는 채팅 입력...'}
              aria-label="채팅 입력"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <Button className="send-btn" type="submit" aria-label="전송">{UI_LABELS?.SEND || '전송'}</Button>
          </MobileChatInput>
        </MobileChat>
        <MobileTabs>
          <Button className={tab === 'info' ? 'active' : ''} onClick={() => setTab('info')}>내정보</Button>
          <Button className={tab === 'inv' ? 'active' : ''} onClick={() => setTab('inv')}>인벤</Button>
        </MobileTabs>
        <MobileContent>
          {tab === 'info' && <CharacterInfo name={name} room={room} character={character} />}
          {tab === 'inv' && <Inventory inventory={inventory} gold={character?.gold} />}
        </MobileContent>
      </MobileMain>
    </MobileRoot>
  );
} 