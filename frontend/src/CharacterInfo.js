import React from 'react';

function CharacterInfo({ name, room }) {
  return (
    <div className="character-info">
      <div className="character-title">내 캐릭터</div>
      <div className="character-row"><b>닉네임:</b> {name}</div>
      {room && <>
        <div className="character-row"><b>위치:</b> ({room.x + 1}, {room.y + 1})</div>
        <div className="character-row"><b>현재 방:</b> {room.name}</div>
        <div className="character-row"><b>구역:</b> {room.type === 'village' ? '마을' : room.type === 'field' ? '초원' : '일반'}</div>
      </>}
    </div>
  );
}

export default React.memo(CharacterInfo); 