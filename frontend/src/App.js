import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ChatBox from './ChatBox';
import MiniMap from './MiniMap';
import Inventory from './Inventory';
import PlayerList from './PlayerList';
import CharacterInfo from './CharacterInfo';
import RoomInfo from './RoomInfo';
import RoomItems from './RoomItems';
import RoomMonsters from './RoomMonsters';
import useWebSocket from './useWebSocket';
import { UI_LABELS, MAP_EMOJI } from './constants';
import axios from 'axios';
import AuthForm from './AuthForm';
import MapModal from './MapModal';
import GameMain from './GameMain';
import GameMobileMain from './GameMobileMain';
import { login, register } from './api';
import { UserProvider, useUserContext } from './UserContext';
import { GameStateProvider, useGameStateContext } from './GameStateContext';
import ResponsiveLayout from './layout/ResponsiveLayout';

const WS_URL = 'ws://localhost:4000';

function isMobileDevice() {
  return window.innerWidth <= 700 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function AppInner() {
  const {
    isLoggedIn, login, register, logout, authError,
    loading, setAuthError
  } = useUserContext();
  const [showMap, setShowMap] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const {
    inventory, setInventory,
    character, setCharacter,
    mapInfo, setMapInfo,
    room, setRoom,
    messages, addMessage, clearMessages
  } = useGameStateContext();

  // 서버 연결 끊김 시 로그인 화면으로 복귀
  const handleDisconnect = () => {
    logout();
  };

  const {
    connected,
    name,
    setName,
    input,
    setInput,
    messages: wsMessages,
    players,
    room: wsRoom,
    mapSize,
    inventory: wsInventory,
    mapInfo: wsMapInfo,
    character: wsCharacter,
    chatEndRef,
    handleConnect,
    handleSend,
    handleMove,
    handlePickup,
    handleAttack,
    nearbyRooms,
    ws
  } = useWebSocket(handleDisconnect);

  // 소켓에서 받은 상태를 context로 동기화
  React.useEffect(() => { setInventory(wsInventory); }, [wsInventory]);
  React.useEffect(() => { setCharacter(wsCharacter); }, [wsCharacter]);
  React.useEffect(() => { setMapInfo(wsMapInfo); }, [wsMapInfo]);
  React.useEffect(() => { setRoom(wsRoom); }, [wsRoom]);
  React.useEffect(() => { clearMessages(); wsMessages.forEach(addMessage); }, [wsMessages, addMessage, clearMessages]);

  useEffect(() => {
    window.setShowMap = setShowMap;
    return () => { window.setShowMap = null; };
  }, []);

  // 로그인 후 자동 WebSocket 연결
  useEffect(() => {
    if (isLoggedIn && !connected) {
      handleConnect();
    }
  }, [isLoggedIn, connected, handleConnect]);

  // 모바일/데스크톱 분기
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  useEffect(() => {
    const handleResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isLoggedIn) {
    return (
      <AuthForm
        isLoginMode={isLoginMode}
        setIsLoginMode={setIsLoginMode}
        loginUsername={loginUsername}
        setLoginUsername={setLoginUsername}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        registerUsername={registerUsername}
        setRegisterUsername={setRegisterUsername}
        registerPassword={registerPassword}
        setRegisterPassword={setRegisterPassword}
        handleLogin={() => login(loginUsername, loginPassword)}
        handleRegister={() => register(registerUsername, registerPassword)}
        authError={authError}
        loading={loading}
      />
    );
  }

  // 방 아이템 UI 분리
  const renderRoomItems = () => <RoomItems room={room} onPickup={handlePickup} />;
  // 방 몬스터 UI 분리
  const renderRoomMonsters = () => <RoomMonsters room={room} onAttack={handleAttack} />;

  return (
    <>
      {showMap && !isMobile && <MapModal mapSize={mapSize} mapInfo={mapInfo} onClose={() => setShowMap(false)} />}
      <ResponsiveLayout
        isMobile={isMobile}
        desktop={
          <div className="container">
            <GameMain
              connected={connected}
              handleLogout={logout}
              room={room}
              mapSize={mapSize}
              mapInfo={mapInfo}
              handleMove={handleMove}
              nearbyRooms={nearbyRooms}
              messages={messages}
              chatEndRef={chatEndRef}
              handleSend={handleSend}
              input={input}
              setInput={setInput}
              UI_LABELS={UI_LABELS}
              players={players}
              name={name}
              character={character}
              inventory={inventory}
              handlePickup={handlePickup}
              handleAttack={handleAttack}
            />
          </div>
        }
        mobile={
          <div className="mobile-root">
            <GameMobileMain
              room={room}
              mapSize={mapSize}
              mapInfo={mapInfo}
              handleMove={handleMove}
              nearbyRooms={nearbyRooms}
              messages={messages}
              chatEndRef={chatEndRef}
              handleSend={handleSend}
              input={input}
              setInput={setInput}
              UI_LABELS={UI_LABELS}
              name={name}
              character={character}
              inventory={inventory}
              handlePickup={handlePickup}
              handleAttack={handleAttack}
              handleLogout={logout}
            />
          </div>
        }
      />
    </>
  );
}

function App() {
  return (
    <GameStateProvider>
      <UserProvider>
        <AppInner />
      </UserProvider>
    </GameStateProvider>
  );
}

export default App; 