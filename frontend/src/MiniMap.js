import React, { useMemo } from 'react';
import styled from 'styled-components';
import { MAP_EMOJI, WORLDS } from './constants';

const MinimapWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 18px;
  background: #232837;
  padding: 16px 18px;
  border-radius: 12px;
  box-shadow: 0 2px 8px #0003;
`;
const MinimapRow = styled.div`
  display: flex;
  gap: 2px;
`;
const MinimapCell = styled.div`
  width: 32px;
  height: 32px;
  background: ${({ $cellType }) => {
    if ($cellType === 'field') return '#b6e388';
    if ($cellType === 'forest') return '#4e944f';
    if ($cellType === 'cave') return '#888';
    if ($cellType === 'village') return '#ffe066';
    return '#181c24';
  }};
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: ${({ $isCurrent, $cellType }) => $isCurrent ? ($cellType === 'village' ? '#232837' : '#181c24') : '#7ecfff'};
  cursor: ${({ $isNeighbor }) => $isNeighbor ? 'pointer' : 'default'};
  border: 2px solid ${({ $isCurrent, $isNeighbor }) => $isCurrent ? '#fff' : $isNeighbor ? '#7ecfff' : 'transparent'};
  font-weight: ${({ $isCurrent }) => $isCurrent ? 'bold' : 'normal'};
  background: ${({ $isCurrent, $cellType }) => $isCurrent ? '#7ecfff' : undefined};
  transition: border 0.15s, background 0.15s;
`;

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
          <MinimapCell
            key={x}
            $cellType={cellType}
            $isCurrent={isCurrent}
            $isNeighbor={isNeighbor}
            onClick={() => isNeighbor && onMove(x, y)}
            title={`(${x + 1}, ${y + 1})${cellType === 'village' ? ' - 마을' : ''}`}
          >
            {isCurrent ? '●' : (emojiMap[cellType] || '')}
          </MinimapCell>
        );
      }
      rows.push(
        <MinimapRow key={y}>
          {row}
        </MinimapRow>
      );
    }
    return rows;
  }, [room, mapSize, mapInfo, nearbyRooms, world, startX, endX, startY, endY, emojiMap, onMove]);

  return <MinimapWrapper>{grid}</MinimapWrapper>;
}

export default MiniMap; 