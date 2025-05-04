import React from 'react';
import { MAP_EMOJI } from './constants';
import Button from './components/Button';
import Modal from './components/Modal';

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
        <div
          key={x}
          className={`minimap-cell ${cellType}`}
          title={`(${x + 1}, ${y + 1})${cellType === 'village' ? ' - 마을' : ''}`}
        >
          {emojiMap[cellType] || ''}
        </div>
      );
    }
    grid.push(<div className="minimap-row" key={y}>{row}</div>);
  }
  return (
    <Modal open={true} onClose={onClose} title="전체 맵">
      <div className="minimap" style={{ margin: 8 }}>{grid}</div>
    </Modal>
  );
}

export default MapModal; 