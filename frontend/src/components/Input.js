import React from 'react';

/**
 * 공통 Input 컴포넌트
 * @param {object} props - 컴포넌트 props
 * @param {string} props.value - 입력값
 * @param {function} props.onChange - 값 변경 핸들러
 * @param {string} [props.placeholder] - 플레이스홀더 텍스트
 * @param {string} [props.type] - 입력 타입(text, password 등)
 * @param {string} [props.className] - 추가 클래스명
 * @param {object} [props.style] - 인라인 스타일
 * @returns {JSX.Element}
 */
function Input({ value, onChange, placeholder = '', type = 'text', className = '', style = {}, ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`common-input ${className}`}
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        border: 'none',
        background: '#232837',
        color: '#fff',
        fontSize: '1rem',
        ...style
      }}
      {...rest}
    />
  );
}

export default React.memo(Input); 