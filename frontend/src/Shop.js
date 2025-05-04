import React from 'react';
import styled from 'styled-components';
import Button from './components/Button';

const ShopPanel = styled.div`
  position: absolute;
  left: 50%; top: 50%; transform: translate(-50%, -50%);
  background: #232837;
  border-radius: 16px;
  box-shadow: 0 4px 24px #0008;
  padding: 32px 32px 24px 32px;
  min-width: 340px;
  z-index: 100;
`;
const ShopTitle = styled.div`
  font-size: 1.4rem;
  font-weight: bold;
  color: #7ecfff;
  margin-bottom: 18px;
  text-align: center;
`;
const ShopItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #181c24;
  border-radius: 8px;
  padding: 10px 16px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px #0002;
`;

function Shop({ items, onBuy, onClose }) {
  return (
    <ShopPanel>
      <ShopTitle>상점</ShopTitle>
      <Button className="close-btn" onClick={onClose} style={{position: 'absolute', top: 14, right: 18, background: 'none', color: '#aaa', fontSize: '1.3rem', boxShadow: 'none'}}>
        ❌
      </Button>
      {items.map(item => (
        <ShopItem key={item.name}>
          <div>
            <b style={{ color: '#ffe066' }}>{item.name}</b> <span style={{ color: '#7ecfff' }}>{item.price}G</span>
            <div style={{ fontSize: '0.97rem', color: '#b3c6e0', marginTop: 2 }}>{item.desc}</div>
          </div>
          <Button onClick={() => onBuy(item.name)} style={{background: '#7ecfff', color: '#181c24', fontWeight: 'bold', fontSize: '1.01rem', gap: 6}}>
            🛒 구매
          </Button>
        </ShopItem>
      ))}
    </ShopPanel>
  );
}

export default React.memo(Shop); 