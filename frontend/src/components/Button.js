import React from 'react';
import styled from 'styled-components';

const StyledButton = styled.button`
  padding: 10px 22px;
  border-radius: 8px;
  border: none;
  background: ${({ disabled }) => (disabled ? '#b3c6e0' : '#7ecfff')};
  color: ${({ disabled }) => (disabled ? '#888' : '#181c24')};
  font-weight: bold;
  font-size: 1rem;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  box-shadow: 0 1px 4px #0002;
  transition: background 0.18s, color 0.18s;
  &:hover {
    background: ${({ disabled }) => (disabled ? '#b3c6e0' : '#4ec3ff')};
  }
`;

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
function Button({ children, onClick, disabled, type = 'button', className = '', style = {}, ...rest }) {
  return (
    <StyledButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </StyledButton>
  );
}

export default React.memo(Button); 