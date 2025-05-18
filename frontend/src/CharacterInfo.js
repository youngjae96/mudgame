import React from 'react';
import styled from 'styled-components';

const CharacterInfoWrapper = styled.div`
  background: #232837;
  border-radius: 10px;
  padding: 14px 10px 10px 10px;
  margin-bottom: 0;
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
  background: none;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
`;
const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.97rem;
  color: #ffe066;
  margin-bottom: 3px;
  font-family: 'Consolas', 'Pretendard', 'Noto Sans KR', Arial, sans-serif;
  align-items: center;
  & span:first-child {
    color: #7ecfff;
    font-weight: bold;
    min-width: 60px;
  }
  & span:last-child {
    color: #fff;
    font-weight: bold;
    text-align: right;
    min-width: 36px;
  }
`;
const GaugeBar = styled.div`
  width: 100%;
  height: 18px;
  background: #23272f;
  border-radius: 8px;
  margin-bottom: 6px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 4px #0002;
`;
const GaugeFill = styled.div`
  height: 100%;
  border-radius: 8px;
  transition: width 0.3s;
`;
const GaugeLabel = styled.div`
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
  text-align: center;
  color: #fff;
  font-size: 0.93rem;
  font-weight: bold;
  line-height: 18px;
  text-shadow: 0 1px 2px #000a;
`;

function CharacterInfo({ name, room, character }) {
  if (!character) return null;
  // 다양한 key에서 장비 정보 추출
  const equipment = character.equipment || character.equip || character.equipped || {};
  const weapon = character.equipWeapon || equipment.weapon || equipment.무기 || character.weapon || character.무기 || null;
  const armor = character.equipArmor || equipment.armor || equipment.방어구 || character.armor || character.방어구 || null;
  const accessory = equipment.accessory || equipment.장신구 || character.accessory || character.장신구 || null;
  const etc = equipment.etc || equipment.기타 || character.etc || character.기타 || null;
  return (
    <CharacterInfoWrapper>
      <CharacterTitle>캐릭터 정보</CharacterTitle>
      <CharacterStats>
        {/* HP 게이지 */}
        <div style={{ marginBottom: 2 }}>
          <GaugeBar>
            <GaugeFill style={{ width: `${(character.hp / character.maxHp) * 100}%`, background: 'linear-gradient(90deg, #ff4e4e 60%, #ffb3b3 100%)' }} />
            <GaugeLabel>HP {character.hp} / {character.maxHp}</GaugeLabel>
          </GaugeBar>
        </div>
        {/* MP 게이지 */}
        <div style={{ marginBottom: 8 }}>
          <GaugeBar>
            <GaugeFill style={{ width: `${(character.mp / character.maxMp) * 100}%`, background: 'linear-gradient(90deg, #2196f3 60%, #7ecfff 100%)' }} />
            <GaugeLabel>MP {character.mp} / {character.maxMp}</GaugeLabel>
          </GaugeBar>
        </div>
        {/* 스탯 정보 */}
        <StatRow><span>힘</span><span>{character.str}</span></StatRow>
        <StatRow><span>민첩</span><span>{character.dex}</span></StatRow>
        <StatRow><span>지능</span><span>{character.int}</span></StatRow>
        <StatRow><span>공격력</span><span>{character.atk}</span></StatRow>
        <StatRow><span>방어력</span><span>{character.def}</span></StatRow>
        {/* 장비 정보 */}
        <StatRow><span>무기</span><span>{weapon ? (weapon.name || weapon) : '없음'}</span></StatRow>
        <StatRow><span>방어구</span><span>{armor ? (armor.name || armor) : '없음'}</span></StatRow>
        {accessory && (
          <StatRow><span>장신구</span><span>{accessory.name || accessory}</span></StatRow>
        )}
        {etc && (
          <StatRow><span>기타</span><span>{etc.name || etc}</span></StatRow>
        )}
      </CharacterStats>
    </CharacterInfoWrapper>
  );
}

export default CharacterInfo; 