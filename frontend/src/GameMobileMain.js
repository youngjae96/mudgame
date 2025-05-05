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
  height: 100vh;
  min-height: 100vh;
  background: #181c24;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  overflow: hidden;
`;
const MobileHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 10px 18px;
  background: #232837;
  border-radius: 0 0 18px 18px;
  box-shadow: 0 2px 12px #0004;
`;
const MobileTitle = styled.span`
  font-size: 1.25rem;
  font-weight: bold;
  color: #7ecfff;
`;
const MobileMain = styled.div`
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0 auto;
  padding: 0 0 0 0;
  overflow: hidden;
`;
const MobilePanel = styled.div`
  background: #232837;
  border-radius: 10px;
  box-shadow: 0 1px 4px #0002;
  margin: 0 0 4px 0;
  padding: 8px 6px 6px 6px;
  width: 100%;
  overflow: auto;
`;
const MobileMapRoomPanel = styled(MobilePanel)`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  max-height: 170px;
  padding: 6px 4px 4px 4px;
`;
const MobileChat = styled.div`
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #232837;
  border-radius: 10px 10px 0 0;
  box-shadow: 0 -2px 8px #0002;
  margin: 0;
  padding: 0;
`;
const MobileChatMessages = styled.div`
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 8px 0 8px;
  font-size: 1.18rem;
  background: #232837;
`;
const MobileChatInput = styled.form`
  display: flex;
  gap: 10px;
  padding: 10px 8px 10px 8px;
  background: #232837;
`;
const MobileTabs = styled.div`
  display: flex;
  justify-content: space-between;
  background: #232837;
  border-radius: 8px;
  margin: 0 0 2px 0;
  padding: 1px 1px;
  gap: 3px;
`;
const TabButton = styled(Button)`
  flex: 1 1 0;
  border-radius: 6px !important;
  font-size: 0.97rem;
  font-weight: bold;
  background: ${({ $active }) => $active ? '#7ecfff' : '#232837'} !important;
  color: ${({ $active }) => $active ? '#181c24' : '#7ecfff'} !important;
  border: 2px solid ${({ $active }) => $active ? '#7ecfff' : '#232837'};
  box-shadow: none !important;
  transition: background 0.18s, color 0.18s;
  padding: 6px 0 !important;
`;
const MobileContent = styled(MobilePanel)`
  min-height: 90px;
  max-height: 140px;
  overflow-y: auto;
  margin-bottom: 0;
  padding: 6px 4px 4px 4px;
`;

export default function GameMobileMain({
  room, mapSize, mapInfo, handleMove, nearbyRooms,
  messages, chatEndRef, handleSend, input, setInput,
  UI_LABELS, name, character, inventory, handlePickup, handleAttack, handleLogout
}) {
  // 탭 상태: room(방정보), info(내정보), inv(인벤)
  const [tab, setTab] = useState('room'); // 기본값을 'room'으로 변경

  // 방 아이템/몬스터 렌더 함수
  const renderRoomItems = () => <RoomItems room={room} onPickup={handlePickup} />;
  const renderRoomMonsters = () => <RoomMonsters room={room} onAttack={handleAttack} />;

  return (
    <MobileRoot>
      <MobileHeader>
        <MobileTitle>그리머드RPG</MobileTitle>
        <Button className="mobile-logout" onClick={handleLogout} size="sm">로그아웃</Button>
      </MobileHeader>
      <MobileMain>
        <MobileMapRoomPanel>
          <MiniMap room={room} mapSize={mapSize} mapInfo={mapInfo} onMove={handleMove} nearbyRooms={nearbyRooms} world={mapInfo?.world} />
        </MobileMapRoomPanel>
        <MobileTabs>
          <TabButton $active={tab === 'room'} onClick={() => setTab('room')}>방정보</TabButton>
          <TabButton $active={tab === 'info'} onClick={() => setTab('info')}>내정보</TabButton>
          <TabButton $active={tab === 'inv'} onClick={() => setTab('inv')}>인벤</TabButton>
        </MobileTabs>
        <MobileContent>
          {tab === 'room' && <RoomInfo room={room} renderRoomItems={renderRoomItems} renderRoomMonsters={renderRoomMonsters} />}
          {tab === 'info' && <CharacterInfo name={name} room={room} character={character} />}
          {tab === 'inv' && <Inventory inventory={inventory} gold={character?.gold} />}
        </MobileContent>
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
              style={{ fontSize: '1.15rem', padding: '8px 10px' }}
            />
            <Button className="send-btn" type="submit" aria-label="전송" size="md" style={{ fontSize: '1.1rem', padding: '8px 16px' }}>{UI_LABELS?.SEND || '전송'}</Button>
          </MobileChatInput>
        </MobileChat>
      </MobileMain>
    </MobileRoot>
  );
} 