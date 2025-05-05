import React from 'react';
import styled, { css } from 'styled-components';

const sizeStyles = {
  md: css`
    padding: 10px 14px;
    font-size: 1rem;
  `,
  sm: css`
    padding: 7px 10px;
    font-size: 0.95rem;
  `,
  lg: css`
    padding: 14px 20px;
    font-size: 1.13rem;
  `,
};

const StyledInput = styled.input`
  border-radius: 8px;
  border: none;
  background: #232837;
  color: #fff;
  outline: none;
  transition: box-shadow 0.18s, border 0.18s;
  ${({ size }) => sizeStyles[size || 'md']}
  &:focus {
    box-shadow: 0 0 0 2px #7ecfff55;
    border: 1.5px solid #7ecfff;
  }
`;

/**
 * 공통 Input 컴포넌트
 * @param {object} props - 컴포넌트 props
 * @param {string} props.value - 입력값
 * @param {function} props.onChange - 값 변경 핸들러
 * @param {string} [props.placeholder] - 플레이스홀더 텍스트
 * @param {string} [props.type] - 입력 타입(text, password 등)
 * @param {string} [props.className] - 추가 클래스명
 * @param {object} [props.style] - 인라인 스타일
 * @param {string} [props.size] - 입력 크기(md, sm, lg)
 * @returns {JSX.Element}
 */
function Input({ value, onChange, placeholder = '', type = 'text', className = '', style = {}, size = 'md', ...rest }) {
  return (
    <StyledInput
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      style={style}
      size={size}
      {...rest}
    />
  );
}

export default React.memo(Input); 