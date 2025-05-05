import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  width: ${({ size }) => size || 40}px;
  height: ${({ size }) => size || 40}px;
  border: ${({ size }) => (size ? size / 8 : 5)}px solid #eee;
  border-top: ${({ size, color }) => `${size ? size / 8 : 5}px solid ${color || '#7ecfff'}`};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: ${({ message }) => (message ? 12 : 0)}px;
`;

const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const LoaderMessage = styled.div`
  color: #7ecfff;
  font-weight: bold;
  font-size: 1.08rem;
`;

/**
 * 공통 Loader(로딩 스피너) 컴포넌트
 * @param {object} props - 컴포넌트 props
 * @param {number} [props.size=40] - 스피너 크기(px)
 * @param {string} [props.color='#7ecfff'] - 스피너 색상
 * @param {string} [props.message] - 하단 메시지
 * @param {object} [props.style] - 인라인 스타일
 * @returns {JSX.Element}
 */
function Loader({ size = 40, color = '#7ecfff', message = '', style = {} }) {
  return (
    <LoaderWrapper style={style}>
      <Spinner size={size} color={color} message={message} />
      {message && <LoaderMessage>{message}</LoaderMessage>}
    </LoaderWrapper>
  );
}

export default React.memo(Loader); 