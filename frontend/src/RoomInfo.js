import React from 'react';
import styled from 'styled-components';

const RoomInfoWrapper = styled.div`
  background: #181c24;
  border-radius: 10px;
  padding: 16px 18px;
  margin-top: 8px;
  width: 200px;
  box-shadow: 0 2px 8px #0003;
`;
const RoomName = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: #7ecfff;
  margin-bottom: 6px;
`;
const RoomDesc = styled.div`
  font-size: 0.98rem;
  margin-bottom: 8px;
  color: #b3c6e0;
`;
const RoomPlayers = styled.div`
  font-size: 0.95rem;
  color: #fff;
`;
const RoomItemsTitle = styled.div`
  font-weight: bold;
  margin-top: 14px;
  margin-bottom: 6px;
  color: #7ecfff;
  font-size: 1.02rem;
`;
const RoomMonstersTitle = styled.div`
  font-weight: bold;
  margin-top: 14px;
  margin-bottom: 6px;
  color: #ff7e7e;
  font-size: 1.02rem;
`;

function RoomInfo({ room, renderRoomItems, renderRoomMonsters }) {
  if (!room) return null;
  return (
    <RoomInfoWrapper>
      <RoomName>{room.name}</RoomName>
      <RoomDesc>{room.description}</RoomDesc>
      <RoomPlayers>
        <b>이 방의 플레이어:</b> {room.players.join(', ')}
      </RoomPlayers>
      <RoomItemsTitle>이 방의 아이템</RoomItemsTitle>
      {renderRoomItems()}
      <RoomMonstersTitle>이 방의 몬스터</RoomMonstersTitle>
      {renderRoomMonsters()}
    </RoomInfoWrapper>
  );
}

export default RoomInfo; 