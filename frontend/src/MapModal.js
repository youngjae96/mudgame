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
  @media (max-width: 600px) {
    overflow: auto;
    max-width: 96vw;
    max-height: 80vh;
  }
`;
const MinimapRow = styled.div`
  display: flex;
  gap: 2px;
`;
const MinimapCell = styled.div`
  width: ${({ $isCave }) => $isCave ? '16px' : '32px'};
  height: ${({ $isCave }) => $isCave ? '16px' : '32px'};
  @media (max-width: 600px) {
    width: ${({ $isCave }) => $isCave ? '10px' : '18px'};
    height: ${({ $isCave }) => $isCave ? '10px' : '18px'};
    font-size: ${({ $isCave }) => $isCave ? '0.6rem' : '0.9rem'};
  }
  background: ${({ $cellType, $isCave, $caveZone }) => {
    if ($isCave) {
      if ($caveZone === 'entrance') return '#b3d8ff'; // 밝은 파랑(입구)
      if ($caveZone === 'middle') return '#444c5c';   // 진한 남색/회색(중간)
      if ($caveZone === 'deep') return '#ffe066';     // 금색(심층)
    }
    if ($cellType === 'field') return '#b6e388';
    if ($cellType === 'forest') return '#4e944f';
    if ($cellType === 'cave') return '#888';
    if ($cellType === 'village') return '#ffe066';
    if ($cellType === 'desert') return '#f7d488'; // 사막 노랑
    if ($cellType === 'oasis') return '#7ed6df'; // 오아시스 파랑
    if ($cellType === 'rock') return '#b2bec3';  // 바위 회색
    if ($cellType === 'desertcave') return '#e17055'; // 사막동굴 주황
    return '#181c24';
  }};
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $isCave, $caveZone }) => $isCave && $caveZone === 'deep' ? '#b8860b' : $isCave && $caveZone === 'middle' ? '#ffe066' : '#181c24'};
  cursor: default;
  border: 2px solid ${({ $isCave, $caveZone }) => {
    if ($isCave) {
      if ($caveZone === 'entrance') return '#7ecfff';
      if ($caveZone === 'middle') return '#222a3a';
      if ($caveZone === 'deep') return '#b8860b';
    }
    return 'transparent';
  }};
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
  const isCave = mapInfo?.world === 3;
  const regions = mapInfo?.regions || [];
  const sizeY = regions.length;
  const sizeX = regions[0]?.length || 0;
  const grid = [];
  for (let y = 0; y < sizeY; y++) {
    const row = [];
    for (let x = 0; x < sizeX; x++) {
      let cellType = regions[y][x] || 'field';
      let caveZone = null;
      if (isCave) {
        if (y <= 9) caveZone = 'entrance';
        else if (y <= 19) caveZone = 'middle';
        else caveZone = 'deep';
      }
      row.push(
        <MinimapCell
          key={x}
          $cellType={cellType}
          $isCave={isCave}
          $caveZone={caveZone}
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