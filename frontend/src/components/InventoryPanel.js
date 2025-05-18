import React from 'react';
import styled, { css, keyframes } from 'styled-components';

const slideInRight = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;
const slideInUp = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35);
  z-index: 1200;
  display: flex;
  align-items: ${props => (props.$isMobile ? 'flex-end' : 'center')};
  justify-content: ${props => (props.$isMobile ? 'center' : 'flex-end')};
`;

const Panel = styled.div`
  background: #23293a;
  box-shadow: 0 4px 32px #000a;
  border-radius: 18px 0 0 18px;
  width: 340px;
  max-width: 96vw;
  min-height: 320px;
  max-height: 96vh;
  padding: 24px 18px 18px 18px;
  position: relative;
  animation: ${slideInRight} 0.25s cubic-bezier(0.4,0,0.2,1);
  @media (max-width: 700px) {
    width: 100vw;
    min-height: 0;
    max-height: 70vh;
    border-radius: 18px 18px 0 0;
    padding: 18px 10px 10px 10px;
    animation: ${slideInUp} 0.22s cubic-bezier(0.4,0,0.2,1);
  }
  ${props => props.$isMobile && css`
    width: 100vw;
    min-height: 0;
    max-height: 70vh;
    border-radius: 18px 18px 0 0;
    padding: 18px 10px 10px 10px;
    animation: ${slideInUp} 0.22s cubic-bezier(0.4,0,0.2,1);
  `}
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 16px;
  background: #333;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 10;
`;

function InventoryPanel({ open, onClose, $isMobile, children }) {
  if (!open) return null;
  return (
    <Overlay $isMobile={$isMobile} onClick={onClose}>
      <Panel $isMobile={$isMobile} onClick={e => e.stopPropagation()}>
        <CloseBtn onClick={onClose} aria-label="닫기">×</CloseBtn>
        {children}
      </Panel>
    </Overlay>
  );
}

export default InventoryPanel; 