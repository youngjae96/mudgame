import React from 'react';
import styled, { css } from 'styled-components';

const buttonVariants = {
  primary: css`
    background: #7ecfff;
    color: #181c24;
    &:hover { background: #4ec3ff; }
  `,
  secondary: css`
    background: #232837;
    color: #7ecfff;
    &:hover { background: #181c24; color: #fff; }
  `,
  danger: css`
    background: #ff7e7e;
    color: #181c24;
    &:hover { background: #ff4e4e; }
  `,
};

const sizeStyles = {
  md: css`
    padding: 10px 22px;
    font-size: 1rem;
  `,
  sm: css`
    padding: 6px 14px;
    font-size: 0.95rem;
  `,
  lg: css`
    padding: 14px 32px;
    font-size: 1.13rem;
  `,
};

const StyledButton = styled.button`
  border-radius: 8px;
  border: none;
  font-weight: bold;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  box-shadow: 0 1px 4px #0002;
  transition: background 0.18s, color 0.18s;
  ${({ size }) => sizeStyles[size || 'md']}
  ${({ $variant, disabled }) =>
    disabled
      ? css`
          background: #b3c6e0;
          color: #888;
        `
      : buttonVariants[$variant || 'primary']}
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
 * @param {string} [props.size] - 버튼 크기
 * @param {string} [props.variant] - 버튼 변형
 * @returns {JSX.Element}
 */
function Button({ children, onClick, disabled, type = 'button', className = '', style = {}, size = 'md', variant = 'primary', ...rest }) {
  return (
    <StyledButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={style}
      size={size}
      $variant={variant}
      {...rest}
    >
      {children}
    </StyledButton>
  );
}

export default React.memo(Button); 