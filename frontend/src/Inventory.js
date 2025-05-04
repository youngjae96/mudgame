import React from 'react';

function Inventory({ inventory, gold }) {
  return (
    <div className="inventory">
      <div className="inventory-title">내 인벤토리</div>
      <div className="inventory-gold">골드: {gold ?? 100} G</div>
      {inventory.length === 0 ? (
        <div className="inventory-empty">획득한 아이템이 없습니다.</div>
      ) : (
        <ul>
          {inventory.map((item, idx) => (
            <li key={item.id || idx}>
              <span className="item-name">{item.name}</span>
              <span className="item-desc">{item.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default React.memo(Inventory); 