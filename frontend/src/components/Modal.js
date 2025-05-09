import React, { useEffect } from 'react';
import styled from 'styled-components';

const ModalBg = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.55);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background: #23293a;
  border-radius: 16px;
  box-shadow: 0 4px 32px #000a;
  padding: 32px;
  min-width: 420px;
  min-height: 420px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  @media (max-width: 600px) {
    min-width: 0;
    max-width: 98vw;
    min-height: 0;
    max-height: 90vh;
    padding: 4vw 2vw;
    box-sizing: border-box;
  }
`;

const ModalClose = styled.button`
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

/**
 * 공통 Modal(모달) 컴포넌트
 * @param {object} props - 컴포넌트 props
 * @param {boolean} [props.open=true] - 모달 표시 여부
 * @param {function} props.onClose - 닫기(배경/ESC/버튼 클릭) 핸들러
 * @param {string} [props.title] - 모달 상단 제목
 * @param {React.ReactNode} props.children - 모달 내부 내용
 * @param {object} [props.style] - 모달 배경 스타일
 * @param {object} [props.contentStyle] - 모달 컨텐츠 영역 스타일
 * @returns {JSX.Element|null}
 */
function Modal({ open = true, onClose, title, children, style = {}, contentStyle = {} }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <ModalBg style={style} onClick={onClose}>
      <ModalContent style={contentStyle} onClick={e => e.stopPropagation()}>
        <ModalClose onClick={onClose} aria-label="닫기">×</ModalClose>
        {title && <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: 16 }}>{title}</div>}
        {children}
      </ModalContent>
    </ModalBg>
  );
}

export default React.memo(Modal); 