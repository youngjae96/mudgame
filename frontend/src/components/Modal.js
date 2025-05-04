import React, { useEffect } from 'react';

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
    <div
      className="modal-bg"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.55)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...style
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          background: '#23293a', borderRadius: 16, boxShadow: '0 4px 32px #000a',
          padding: 32, minWidth: 420, minHeight: 420, position: 'relative',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          ...contentStyle
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          className="modal-close"
          style={{
            position: 'absolute', top: 12, right: 16, background: '#333', color: '#fff',
            border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: '1.2rem', cursor: 'pointer', zIndex: 10
          }}
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>
        {title && <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: 16 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

export default React.memo(Modal); 