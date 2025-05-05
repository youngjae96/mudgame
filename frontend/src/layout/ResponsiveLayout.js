import React from 'react';

/**
 * ResponsiveLayout: 모바일/데스크톱 분기 및 공통 레이아웃 래퍼
 * @param {boolean} isMobile - 모바일 여부
 * @param {React.ReactNode} desktop - 데스크톱 레이아웃
 * @param {React.ReactNode} mobile - 모바일 레이아웃
 */
export default function ResponsiveLayout({ isMobile, desktop, mobile }) {
  return isMobile ? mobile : desktop;
} 