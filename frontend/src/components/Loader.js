import React from 'react';

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ...style }}>
      <div
        className="loader-spinner"
        style={{
          width: size, height: size, border: `${size/8}px solid #eee`, borderTop: `${size/8}px solid ${color}`,
          borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: message ? 12 : 0
        }}
      />
      {message && <div style={{ color: '#7ecfff', fontWeight: 'bold', fontSize: '1.08rem' }}>{message}</div>}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default React.memo(Loader); 