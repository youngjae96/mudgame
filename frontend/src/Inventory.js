import React from 'react';
import styled from 'styled-components';

const InventoryWrapper = styled.div`
  background: #181c24;
  border-radius: 10px;
  padding: 14px 16px;
  margin-top: 18px;
  box-shadow: 0 2px 8px #0003;
`;
const InventoryTitle = styled.div`
  font-weight: bold;
  color: #7ecfff;
  margin-bottom: 8px;
  font-size: 1.05rem;
`;
const InventoryEmpty = styled.div`
  color: #888;
  font-size: 0.97rem;
`;
const InventoryUl = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 220px;
  overflow-y: auto;
  /* 스크롤바 커스텀 */
  scrollbar-width: thin;
  scrollbar-color: #7ecfff #23272f;
  &::-webkit-scrollbar {
    width: 8px;
    background: #23272f;
    border-radius: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(120deg, #7ecfff 60%, #4fa3e3 100%);
    border-radius: 8px;
    min-height: 40px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #4fa3e3;
  }
`;
const InventoryLi = styled.li`
  padding: 6px 0 4px 0;
  border-bottom: 1px solid #232837;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

function Inventory({ inventory, gold }) {
  // 슬롯(종류) 개수
  const slotCount = inventory ? inventory.length : 0;

  return (
    <InventoryWrapper>
      <InventoryTitle>
        내 인벤토리 <span style={{ color: '#ffe066', fontWeight: 400 }}>({slotCount}/50)</span>
      </InventoryTitle>
      <div style={{ color: '#ffe066', fontWeight: 'bold', marginBottom: 6 }}>골드: {gold} G</div>
      {(!inventory || inventory.length === 0) ? (
        <InventoryEmpty>인벤토리가 비어 있습니다.</InventoryEmpty>
      ) : (
        <InventoryUl>
          {inventory.map((item, idx) => (
            <InventoryLi key={idx}>
              {typeof item === 'string' ? item : (
                <>
                  <span style={{ fontWeight: 'bold', color: '#ffe066' }}>
                    {item.name}
                    {item.type && (item.type.toLowerCase() === 'consumable' || item.type === '잡화') && item.count ? ` x${item.count} (남은 사용: ${item.total})` : ''}
                  </span>
                  {item.desc && <span style={{ color: '#b3c6e0', fontSize: '0.95em' }}>{item.desc}</span>}
                </>
              )}
            </InventoryLi>
          ))}
        </InventoryUl>
      )}
    </InventoryWrapper>
  );
}

export default Inventory; 