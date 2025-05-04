import React from 'react';

function RoomInfo({ room, renderRoomItems, renderRoomMonsters }) {
  return (
    <div className="room-info">
      <div className="room-name">{room.name}</div>
      <div className="room-desc">{room.description}</div>
      <div className="room-players">
        <b>이 방의 플레이어:</b> {room.players.join(', ')}
      </div>
      <div className="room-items-title">이 방의 아이템</div>
      {renderRoomItems()}
      <div className="room-monsters-title">이 방의 몬스터</div>
      {renderRoomMonsters()}
    </div>
  );
}

export default React.memo(RoomInfo); 