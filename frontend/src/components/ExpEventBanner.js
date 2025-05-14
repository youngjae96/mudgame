import React from 'react';
import styled from 'styled-components';

const Banner = styled.div`
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1200;
  background: linear-gradient(90deg, #ffe066 70%, #ffb347 100%);
  color: #232837;
  font-weight: bold;
  font-size: 1.13rem;
  padding: 12px 32px;
  border-radius: 16px;
  box-shadow: 0 2px 16px #0003;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 90vw;
  min-width: 180px;
  @media (max-width: 600px) {
    top: 64px;
    font-size: 1.01rem;
    padding: 10px 8vw;
    border-radius: 12px;
  }
  ${({ $mobile }) => $mobile && `
    position: absolute;
    top: 8px;
    right: 8px;
    left: auto;
    transform: none;
    z-index: 20;
    font-size: 0.98rem;
    padding: 8px 14px;
    border-radius: 12px;
    min-width: 120px;
    max-width: 60vw;
    box-shadow: 0 2px 8px #0002;
    background: linear-gradient(90deg, #ffe066 80%, #ffb347 100%);
    text-align: right;
    line-height: 1.4;
  `}
`;

export default function ExpEventBanner({ children, $mobile }) {
  return <Banner $mobile={$mobile}>
    <span role="img" aria-label="fire">🔥</span>
    {children}
  </Banner>;
} 