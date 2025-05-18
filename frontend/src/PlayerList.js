import React, { useState } from 'react';
import styled from 'styled-components';
import Inventory from './Inventory';
import InventoryPanel from './components/InventoryPanel';

const PlayerListTitle = styled.div`
  font-weight: bold;
  color: #7ecfff;
  margin-bottom: 8px;
  font-size: 1.05rem;
`;
const PlayerUl = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 8px 0;
  max-height: 120px;
  overflow-y: auto;
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
`;
const PlayerLi = styled.li`
  padding: 6px 0 4px 0;
  border-bottom: 1px solid #232837;
  color: #fff;
  font-size: 0.97rem;
`;
const InventoryButton = styled.button`
  margin-top: 12px;
  width: 100%;
  background: #7ecfff;
  color: #181c24;
  border: none;
  border-radius: 8px;
  padding: 8px 0;
  font-weight: bold;
  font-size: 1.05rem;
  cursor: pointer;
  transition: background 0.18s;
  &:hover {
    background: #4fa3e3;
  }
`;
const PlayerListPanel = styled.div`
  background: #181c24;
  border-radius: 12px;
  padding: 16px 10px 14px 10px;
  min-width: 200px;
  max-width: 220px;
  box-shadow: 0 2px 8px #0004;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
  height: auto;
  max-height: 92vh;
  overflow: visible;
`;

function PlayerList({ players, renderCharacterInfo, inventory, gold }) {
  const [showInventory, setShowInventory] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <PlayerListPanel>
      <PlayerListTitle style={{ marginBottom: 10 }}>접속 중인 플레이어 ({players.length}명)</PlayerListTitle>
      <PlayerUl style={{ marginBottom: 14 }}>
        {players.map((p) => (
          <PlayerLi key={p}>{p}</PlayerLi>
        ))}
      </PlayerUl>
      <div style={{ marginBottom: 16 }}>{renderCharacterInfo()}</div>
      <InventoryButton style={{ marginTop: 0 }} onClick={() => setShowInventory(true)}>
        인벤토리 열기
      </InventoryButton>
      <InventoryPanel open={showInventory} onClose={() => setShowInventory(false)} $isMobile={isMobile}>
        <Inventory inventory={inventory} gold={gold} onItemCommandClick={cmd => window.setInput && window.setInput(cmd)} />
      </InventoryPanel>
    </PlayerListPanel>
  );
}

export default PlayerList; 