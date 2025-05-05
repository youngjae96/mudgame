import React from 'react';
import styled from 'styled-components';
import { MAP_EMOJI } from './constants';
import Button from './components/Button';
import Modal from './components/Modal';

const MinimapWrapper = styled.div`
  margin: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  color: #7ecfff;
  cursor: default;
  border: 2px solid transparent;
  transition: border 0.15s, background 0.15s;
`;

/**
 * 전체 맵 모달 컴포넌트
 * @param {object} props - 컴포넌트 props
 * @param {number} props.mapSize - 맵 크기
 * @param {object} props.mapInfo - 맵 정보
 * @param {function} props.onClose - 닫기 핸들러
 * @returns {JSX.Element}
 */
function MapModal({ mapSize, mapInfo, onClose }) {
  const emojiMap = MAP_EMOJI;
  const grid = [];
  for (let y = 0; y < mapSize; y++) {
    const row = [];
    for (let x = 0; x < mapSize; x++) {
      let cellType = mapInfo?.regions?.[y]?.[x] || 'field';
      row.push(
        <MinimapCell
          key={x}
          $cellType={cellType}
          title={`(${x + 1}, ${y + 1})${cellType === 'village' ? ' - 마을' : ''}`}
        >
          {emojiMap[cellType] || ''}
        </MinimapCell>
      );
    }
    grid.push(<MinimapRow key={y}>{row}</MinimapRow>);
  }
  return (
    <Modal open={true} onClose={onClose} title="전체 맵">
      <MinimapWrapper>{grid}</MinimapWrapper>
    </Modal>
  );
}

export default MapModal; 