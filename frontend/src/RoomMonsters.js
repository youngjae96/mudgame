import React from 'react';
import Button from './components/Button';

function RoomMonsters({ room, onAttack }) {
  if (!room || !room.monsters || room.monsters.length === 0) {
    return <div className="room-monsters-empty">이 방에는 몬스터가 없습니다.</div>;
  }
  return (
    <div className="room-monsters">
      {room.monsters.map((m) => (
        <div className="room-monster" key={m.id}>
          <div className="monster-info">
            <span className="monster-name">{m.name}</span>
            <span className="monster-hp">HP: {m.hp} / {m.maxHp}</span>
          </div>
          <Button className="attack-btn" onClick={() => onAttack(m.id)}>
            공격
          </Button>
        </div>
      ))}
    </div>
  );
}

export default React.memo(RoomMonsters); 