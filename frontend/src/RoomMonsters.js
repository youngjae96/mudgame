import React from 'react';
import styled from 'styled-components';

const RoomMonstersWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 6px;
`;
const RoomMonster = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #2a2327;
  border-radius: 7px;
  padding: 8px 12px;
  box-shadow: 0 1px 4px #0002;
`;
const MonsterInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;
const MonsterName = styled.span`
  font-weight: bold;
  color: #ff7e7e;
  font-size: 1.01rem;
`;
const MonsterHp = styled.span`
  font-size: 0.93rem;
  color: #ffb3b3;
`;
const AttackBtn = styled.button`
  background: #ff7e7e;
  color: #181c24;
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-weight: bold;
  font-size: 0.98rem;
  cursor: pointer;
  transition: background 0.18s;
  &:hover {
    background: #ff4e4e;
  }
`;
const RoomMonstersEmpty = styled.div`
  color: #888;
  font-size: 0.97rem;
  margin-bottom: 6px;
`;

function RoomMonsters({ room, onAttack }) {
  if (!room || !room.monsters || room.monsters.length === 0) {
    return <RoomMonstersEmpty>이 방에는 몬스터가 없습니다.</RoomMonstersEmpty>;
  }
  return (
    <RoomMonstersWrapper>
      {room.monsters.map((monster, idx) => (
        <RoomMonster key={monster.id || idx}>
          <MonsterInfo>
            <MonsterName>{monster.name}</MonsterName>
            <MonsterHp>HP: {monster.hp} / {monster.maxHp}</MonsterHp>
          </MonsterInfo>
          <AttackBtn onClick={() => onAttack(monster.id)}>공격</AttackBtn>
        </RoomMonster>
      ))}
    </RoomMonstersWrapper>
  );
}

export default RoomMonsters; 