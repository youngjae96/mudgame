import React from 'react';
import styled from 'styled-components';

const CharacterInfoWrapper = styled.div`
  background: #232837;
  border-radius: 10px;
  padding: 14px 16px 10px 16px;
  margin-bottom: 18px;
  box-shadow: 0 2px 8px #0002;
`;
const CharacterTitle = styled.div`
  font-weight: bold;
  color: #7ecfff;
  margin-bottom: 8px;
  font-size: 1.05rem;
`;
const CharacterRow = styled.div`
  font-size: 0.97rem;
  color: #fff;
  margin-bottom: 3px;
  display: flex;
  gap: 6px;
  align-items: center;
`;
const CharacterStats = styled.div`
  margin-top: 10px;
  background: #181c24;
  border-radius: 8px;
  padding: 10px 12px 8px 12px;
  box-shadow: 0 1px 4px #0002;
`;
const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.97rem;
  color: #ffe066;
  margin-bottom: 3px;
  font-family: 'Consolas', 'Pretendard', 'Noto Sans KR', Arial, sans-serif;
  & span:first-child {
    color: #7ecfff;
    font-weight: bold;
    min-width: 60px;
  }
  & span:last-child {
    color: #fff;
    font-weight: bold;
  }
`;

function CharacterInfo({ name, room, character }) {
  if (!character) return null;
  return (
    <CharacterInfoWrapper>
      <CharacterTitle>내 캐릭터</CharacterTitle>
      <CharacterRow>닉네임: <b>{name}</b></CharacterRow>
      <CharacterRow>위치: ({room?.x}, {room?.y})</CharacterRow>
      <CharacterRow>현재 방: {room?.name}</CharacterRow>
      <CharacterRow>구역: {room?.type}</CharacterRow>
      <CharacterStats>
        <StatRow><span>HP</span><span>{character.hp} / {character.maxHp}</span></StatRow>
        <StatRow><span>MP</span><span>{character.mp} / {character.maxMp}</span></StatRow>
        <StatRow><span>공격력</span><span>{character.atk}</span></StatRow>
        <StatRow><span>방어력</span><span>{character.def}</span></StatRow>
        <StatRow><span>민첩</span><span>{character.dex}</span></StatRow>
        <StatRow><span>지능</span><span>{character.int}</span></StatRow>
      </CharacterStats>
    </CharacterInfoWrapper>
  );
}

export default CharacterInfo; 