import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
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
import { UI_LABELS } from './constants';
import AuthForm from './AuthForm';
import MapModal from './MapModal';
import GameMain from './GameMain';
import GameMobileMain from './GameMobileMain';
import { UserProvider, useUserContext } from './UserContext';
import { GameStateProvider, useGameStateContext } from './GameStateContext';
import ResponsiveLayout from './layout/ResponsiveLayout';

const Container = styled.div`
  max-width: 1100px;
  margin: 40px auto;
  background: #232837;
  border-radius: 16px;
  box-shadow: 0 4px 24px #0008;
  padding: 32px 24px 24px 24px;
`;

const MobileRoot = styled.div`
  width: 100vw;
  min-height: 100vh;
  background: #181c24;
  display: flex;
  flex-direction: column;
`;

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

  const handleDisconnect = () => { logout(); };

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
    ws,
    notice,
    allMessages,
    chatLogMessages,
    guildChatLogMessages
  } = useWebSocket(handleDisconnect);

  React.useEffect(() => { setInventory(wsInventory); }, [wsInventory]);
  React.useEffect(() => {
    if (wsCharacter && Object.keys(wsCharacter).length > 0) {
      setCharacter(prev => ({ ...prev, ...wsCharacter }));
    }
  }, [wsCharacter]);
  React.useEffect(() => { setMapInfo(wsMapInfo); }, [wsMapInfo]);
  React.useEffect(() => { setRoom(wsRoom); }, [wsRoom]);
  React.useEffect(() => { clearMessages(); (wsMessages || []).forEach(addMessage); }, [wsMessages, addMessage, clearMessages]);

  useEffect(() => {
    window.setShowMap = setShowMap;
    return () => { window.setShowMap = null; };
  }, []);

  useEffect(() => {
    if (isLoggedIn && !connected) {
      handleConnect();
    }
  }, [isLoggedIn, connected, handleConnect]);

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

  const renderRoomItems = () => <RoomItems room={room} onPickup={handlePickup} />;
  const renderRoomMonsters = () => <RoomMonsters room={room} onAttack={handleAttack} />;

  return (
    <>
      {notice && (
        <div style={{ background: '#222', color: '#ffe066', fontWeight: 'bold', padding: '10px', textAlign: 'center', borderRadius: '8px', marginBottom: '10px', fontSize: '1.1em', letterSpacing: '1px' }}>{notice}</div>
      )}
      {showMap && <MapModal mapSize={mapSize} mapInfo={mapInfo} onClose={() => setShowMap(false)} />}
      <ResponsiveLayout
        isMobile={isMobile}
        desktop={
          <Container>
            <GameMain
              connected={connected}
              handleLogout={logout}
              room={room}
              mapSize={mapSize}
              mapInfo={mapInfo}
              handleMove={handleMove}
              nearbyRooms={nearbyRooms}
              allMessages={allMessages}
              chatLogMessages={chatLogMessages}
              guildChatLogMessages={guildChatLogMessages}
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
          </Container>
        }
        mobile={
          <MobileRoot>
            <GameMobileMain
              room={room}
              mapSize={mapSize}
              mapInfo={mapInfo}
              handleMove={handleMove}
              nearbyRooms={nearbyRooms}
              chatLogMessages={chatLogMessages}
              guildChatLogMessages={guildChatLogMessages}
              allMessages={allMessages}
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
          </MobileRoot>
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