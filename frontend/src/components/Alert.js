import React, { useEffect } from 'react';

const COLORS = {
  info: '#7ecfff',
  success: '#7effa9',
  error: '#ff7e7e',
  warning: '#ffe066',
};

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
    <div
      className={`alert alert-${type}`}
      style={{
        position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        minWidth: 220, maxWidth: 400, padding: '14px 28px', borderRadius: 10,
        background: COLORS[type] || COLORS.info, color: '#181c24',
        fontWeight: 'bold', fontSize: '1.08rem', boxShadow: '0 2px 12px #0006',
        zIndex: 2000, textAlign: 'center', ...style
      }}
      role="alert"
      onClick={onClose}
    >
      {message}
      <button
        style={{ marginLeft: 16, background: 'none', border: 'none', color: '#181c24', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
        onClick={e => { e.stopPropagation(); onClose?.(); }}
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  );
}

export default React.memo(Alert); 