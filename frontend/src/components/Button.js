import React from 'react';

/**
 * 공통 Button 컴포넌트
 * @param {object} props - 컴포넌트 props
 * @param {React.ReactNode} props.children - 버튼 내부에 표시될 내용
 * @param {function} [props.onClick] - 클릭 이벤트 핸들러
 * @param {boolean} [props.disabled] - 비활성화 여부
 * @param {string} [props.type] - 버튼 타입(button, submit 등)
 * @param {string} [props.className] - 추가 클래스명
 * @param {object} [props.style] - 인라인 스타일
 * @returns {JSX.Element}
 */
function Button({ children, onClick, disabled, type = 'button', className = '', style = {} }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`common-btn ${className}`}
      style={{
        padding: '8px 18px',
        borderRadius: 8,
        border: 'none',
        background: disabled ? '#b3c6e0' : '#7ecfff',
        color: disabled ? '#888' : '#181c24',
        fontWeight: 'bold',
        fontSize: '1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: '0 1px 4px #0002',
        transition: 'background 0.18s, color 0.18s',
        ...style
      }}
    >
      {children}
    </button>
  );
}

export default React.memo(Button); 