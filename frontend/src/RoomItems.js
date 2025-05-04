import React from 'react';
import Button from './components/Button';

function RoomItems({ room, onPickup }) {
  if (!room || !room.items || room.items.length === 0) {
    return <div className="room-items-empty">이 방에는 아이템이 없습니다.</div>;
  }
  return (
    <div className="room-items">
      {room.items.map((item) => (
        <div className="room-item" key={item.id}>
          <div className="item-info">
            <span className="item-name">{item.name}</span>
            <span className="item-desc">{item.description}</span>
          </div>
          <Button className="pickup-btn" onClick={() => onPickup(item.id)}>
            줍기
          </Button>
        </div>
      ))}
    </div>
  );
}

export default React.memo(RoomItems); 