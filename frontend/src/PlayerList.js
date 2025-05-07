import React from 'react';
import styled from 'styled-components';
import Inventory from './Inventory';

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
  max-height: 180px;
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

function PlayerList({ players, renderCharacterInfo, inventory, gold }) {
  return (
    <>
      <PlayerListTitle>접속 중인 플레이어 ({players.length}명)</PlayerListTitle>
      <PlayerUl>
        {players.map((p) => (
          <PlayerLi key={p}>{p}</PlayerLi>
        ))}
      </PlayerUl>
      {renderCharacterInfo()}
      <Inventory inventory={inventory} gold={gold} />
    </>
  );
}

export default PlayerList; 