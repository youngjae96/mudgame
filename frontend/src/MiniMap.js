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
  const emojiMap = MAP_EMOJI;
  const regions = mapInfo?.regions || [];
  const sizeY = regions.length;
  const sizeX = regions[0]?.length || 0;
  const grid = useMemo(() => {
    const rows = [];
    for (let y = room.y - half; y <= room.y + half; y++) {
      const row = [];
      for (let x = room.x - half; x <= room.x + half; x++) {
        const isCurrent = room.x === x && room.y === y;
        const isNeighbor =
          (Math.abs(room.x - x) === 1 && room.y === y) ||
          (Math.abs(room.y - y) === 1 && room.x === x);
        let cellType = undefined;
        if (y >= 0 && y < sizeY && x >= 0 && x < sizeX) {
          cellType = regions[y][x];
        }
        row.push(
          <MinimapCell
            key={x}
            $cellType={cellType}
            $isCurrent={isCurrent}
            $isNeighbor={isNeighbor}
            onClick={() => isNeighbor && onMove(x, y)}
            title={cellType ? `(${x + 1}, ${y + 1})${cellType === 'village' ? ' - 마을' : ''}` : ''}
            style={cellType ? undefined : { background: 'transparent', border: 'none', cursor: 'default' }}
          >
            {cellType ? (isCurrent ? '●' : (emojiMap[cellType] || '')) : ''}
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
  }, [room, mapInfo, nearbyRooms, world, onMove, emojiMap, regions, sizeX, sizeY]);

  return <MinimapWrapper>{grid}</MinimapWrapper>;
}

export default MiniMap; 