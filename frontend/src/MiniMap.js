import React, { useMemo } from 'react';
import { MAP_EMOJI, WORLDS } from './constants';

function MiniMap({ room, mapSize, mapInfo, onMove, nearbyRooms, world }) {
  if (!room) return null;
  const VISIBLE_SIZE = 5;
  const half = Math.floor(VISIBLE_SIZE / 2);
  const startX = Math.max(0, room.x - half);
  const endX = Math.min(mapSize - 1, room.x + half);
  const startY = Math.max(0, room.y - half);
  const endY = Math.min(mapSize - 1, room.y + half);
  const emojiMap = MAP_EMOJI;

  const grid = useMemo(() => {
    const rows = [];
    for (let y = startY; y <= endY; y++) {
      const row = [];
      for (let x = startX; x <= endX; x++) {
        const isCurrent = room.x === x && room.y === y;
        const isNeighbor =
          (Math.abs(room.x - x) === 1 && room.y === y) ||
          (Math.abs(room.y - y) === 1 && room.x === x);
        const found = nearbyRooms.find(r => r.x === x && r.y === y);
        let cellType = 'field';
        if (found) {
          cellType = found.type;
        }
        row.push(
          <div
            key={x}
            className={`minimap-cell ${cellType}${isCurrent ? ' current' : ''}${isNeighbor ? ' neighbor' : ''}${cellType === 'village' ? ' village' : ''}`}
            onClick={() => isNeighbor && onMove(x, y)}
            title={`(${x + 1}, ${y + 1})${cellType === 'village' ? ' - 마을' : ''}`}
          >
            {isCurrent ? '●' : (emojiMap[cellType] || '')}
          </div>
        );
      }
      rows.push(
        <div className="minimap-row" key={y}>
          {row}
        </div>
      );
    }
    return rows;
  }, [room, mapSize, mapInfo, nearbyRooms, world, startX, endX, startY, endY, emojiMap, onMove]);

  return <div className="minimap">{grid}</div>;
}

export default React.memo(MiniMap); 