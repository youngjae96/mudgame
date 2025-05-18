import React, { useState, useMemo } from 'react';
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
  width: 100%;
  border-radius: 8px 0 0 8px;
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
 * @param {array} [props.commandList] - 추천 명령어 리스트
 * @returns {JSX.Element}
 */
function Input({ value, onChange, placeholder = '', type = 'text', className = '', style = {}, size = 'md', commandList = [], ...rest }) {
  const [focused, setFocused] = useState(false);
  // 추천 명령어 필터링
  const suggestions = useMemo(() => {
    if (!focused || !value || !value.startsWith('/')) return [];
    const v = value.toLowerCase();
    if (v === '/') {
      // /만 입력 시 '/귀환', '/정보', '/해제', '/전', '<메시지>'만 추천
      return commandList.filter(c =>
        c.cmd.startsWith('/귀환') ||
        c.cmd.startsWith('/정보') ||
        c.cmd.startsWith('/해제') ||
        c.cmd.startsWith('/전') ||
        c.cmd.startsWith('<메시지>')
      ).slice(0, 5);
    }
    return commandList.filter(c => c.cmd.toLowerCase().includes(v)).slice(0, 5);
  }, [value, commandList, focused]);

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <StyledInput
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        style={style}
        size={size}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        autoComplete="off"
        {...rest}
      />
      {suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            zIndex: 20,
            background: '#232837',
            borderRadius: 8,
            marginTop: window.innerWidth <= 600 ? undefined : 2,
            marginBottom: window.innerWidth <= 600 ? 2 : undefined,
            boxShadow: '0 2px 8px #0002',
            padding: '6px 0',
            fontSize: '0.98rem',
            color: '#bbb',
            maxHeight: 180,
            overflowY: 'auto',
            top: window.innerWidth <= 600 ? 'auto' : '100%',
            bottom: window.innerWidth <= 600 ? '100%' : 'auto',
          }}
        >
          {suggestions.map((c, i) => (
            <div key={i} style={{ padding: '4px 14px', color: '#bbb', cursor: 'default', userSelect: 'none', fontFamily: 'Consolas, Pretendard, Noto Sans KR, Arial, sans-serif' }}>
              {c.cmd}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default React.memo(Input); 