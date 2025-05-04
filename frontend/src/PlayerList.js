import React from 'react';
import Inventory from './Inventory';

function PlayerList({ players, renderCharacterInfo, inventory, gold }) {
  return (
    <>
      <div className="player-list-title">접속 중인 플레이어</div>
      <ul>
        {players.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {renderCharacterInfo()}
      <Inventory inventory={inventory} gold={gold} />
    </>
  );
}

export default React.memo(PlayerList); 