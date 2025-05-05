import React from 'react';
import styled from 'styled-components';

const RoomItemsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 6px;
`;
const RoomItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #232837;
  border-radius: 7px;
  padding: 8px 12px;
  box-shadow: 0 1px 4px #0002;
`;
const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;
const ItemName = styled.span`
  font-weight: bold;
  color: #ffe066;
  font-size: 1.01rem;
`;
const ItemDesc = styled.span`
  font-size: 0.93rem;
  color: #b3c6e0;
`;
const PickupBtn = styled.button`
  background: #7ecfff;
  color: #181c24;
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-weight: bold;
  font-size: 0.98rem;
  cursor: pointer;
  transition: background 0.18s;
  &:hover {
    background: #4ec3ff;
  }
`;
const RoomItemsEmpty = styled.div`
  color: #888;
  font-size: 0.97rem;
  margin-bottom: 6px;
`;

function RoomItems({ room, onPickup }) {
  if (!room || !room.items || room.items.length === 0) {
    return <RoomItemsEmpty>이 방에는 아이템이 없습니다.</RoomItemsEmpty>;
  }
  return (
    <RoomItemsWrapper>
      {room.items.map((item, idx) => (
        <RoomItem key={item.id || idx}>
          <ItemInfo>
            <ItemName>{item.name}</ItemName>
            <ItemDesc>{item.description}</ItemDesc>
          </ItemInfo>
          <PickupBtn onClick={() => onPickup(item.id)}>줍기</PickupBtn>
        </RoomItem>
      ))}
    </RoomItemsWrapper>
  );
}

export default RoomItems; 