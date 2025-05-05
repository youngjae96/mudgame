import React, { useEffect } from 'react';
import styled from 'styled-components';

const COLORS = {
  info: '#7ecfff',
  success: '#7effa9',
  error: '#ff7e7e',
  warning: '#ffe066',
};

const AlertWrapper = styled.div`
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 220px;
  max-width: 400px;
  padding: 14px 28px;
  border-radius: 10px;
  background: ${({ type }) => COLORS[type] || COLORS.info};
  color: #181c24;
  font-weight: bold;
  font-size: 1.08rem;
  box-shadow: 0 2px 12px #0006;
  z-index: 2000;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CloseButton = styled.button`
  margin-left: 16px;
  background: none;
  border: none;
  color: #181c24;
  font-weight: bold;
  cursor: pointer;
  font-size: 1.1rem;
`;

/**
 * 공통 Alert(알림) 컴포넌트
 * @param {object} props - 컴포넌트 props
 * @param {string} props.message - 알림 메시지
 * @param {'info'|'success'|'error'|'warning'} [props.type='info'] - 알림 타입
 * @param {function} [props.onClose] - 닫기 핸들러
 * @param {number} [props.autoHideDuration=2500] - 자동 사라짐(ms)
 * @param {object} [props.style] - 인라인 스타일
 * @returns {JSX.Element}
 */
function Alert({ message, type = 'info', onClose, autoHideDuration = 2500, style = {} }) {
  useEffect(() => {
    if (!autoHideDuration) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, autoHideDuration);
    return () => clearTimeout(timer);
  }, [autoHideDuration, onClose]);

  return (
    <AlertWrapper type={type} style={style} role="alert" onClick={onClose}>
      {message}
      <CloseButton
        onClick={e => { e.stopPropagation(); onClose?.(); }}
        aria-label="닫기"
      >
        ×
      </CloseButton>
    </AlertWrapper>
  );
}

export default React.memo(Alert); 