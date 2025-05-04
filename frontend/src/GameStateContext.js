import React, { createContext, useContext, useState } from 'react';

const GameStateContext = createContext();

export function GameStateProvider({ children }) {
  const [inventory, setInventory] = useState([]);
  const [character, setCharacter] = useState(null); // { hp, maxHp, gold, ... }
  const [mapInfo, setMapInfo] = useState(null); // { regions, world, ... }
  const [room, setRoom] = useState(null); // { x, y, type, monsters, ... }
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 상태 갱신 함수 예시 (API/소켓 이벤트에서 호출)
  const updateInventory = (inv) => setInventory(inv);
  const updateCharacter = (char) => setCharacter(char);
  const updateMapInfo = (info) => setMapInfo(info);
  const updateRoom = (r) => setRoom(r);
  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);
  const clearMessages = () => setMessages([]);

  return (
    <GameStateContext.Provider value={{
      inventory, setInventory: updateInventory,
      character, setCharacter: updateCharacter,
      mapInfo, setMapInfo: updateMapInfo,
      room, setRoom: updateRoom,
      messages, addMessage, clearMessages,
      loading, setLoading,
      error, setError
    }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameStateContext() {
  return useContext(GameStateContext);
} 