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
      <PlayerListTitle>접속 중인 플레이어</PlayerListTitle>
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