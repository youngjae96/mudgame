import React from 'react';
import Button from './components/Button';
import styled from 'styled-components';

const IntroCard = styled.div`
  background: linear-gradient(120deg, #232837 70%, #7ecfff22 100%);
  border-radius: 18px;
  box-shadow: 0 4px 24px #0005;
  padding: 36px 32px 24px 32px;
  margin-bottom: 32px;
  text-align: center;
  color: #fff;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
`;
const IntroTitle = styled.div`
  font-size: 2.2rem;
  font-weight: bold;
  color: #7ecfff;
  margin-bottom: 8px;
  letter-spacing: 2px;
`;
const IntroSubtitle = styled.div`
  font-size: 1.2rem;
  color: #ffe066;
  margin-bottom: 18px;
  font-weight: 500;
`;
const IntroFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 auto 0 auto;
  text-align: left;
  display: inline-block;
`;
const IntroFeatureLi = styled.li`
  font-size: 1.05rem;
  margin-bottom: 8px;
  padding-left: 1.2em;
  position: relative;
  color: #eaf6ff;
  & b {
    color: #ffe066;
  }
  &::before {
    content: "•";
    color: #7ecfff;
    position: absolute;
    left: 0;
  }
`;
const IntroAvatars = styled.div`
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 18px;
`;
const IntroAvatar = styled.span`
  font-size: 2.1rem;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #232837;
  box-shadow: 0 2px 8px #0003;
  display: flex;
  align-items: center;
  justify-content: center;
`;

function AuthForm({
  isLoginMode,
  setIsLoginMode,
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  registerUsername,
  setRegisterUsername,
  registerPassword,
  setRegisterPassword,
  registerPasswordConfirm,
  setRegisterPasswordConfirm,
  handleLogin,
  handleRegister,
  authError,
  loading
}) {
  return (
    <div className="auth-bg">
      <div className="auth-flex-col">
        <div className="auth-card">
          <div className="auth-title">그리머드RPG</div>
          <div className="auth-tabs">
            <Button className={isLoginMode ? 'auth-tab active' : 'auth-tab'} onClick={() => setIsLoginMode(true)} disabled={loading} style={{marginRight: 4}}>
              로그인
            </Button>
            <Button className={!isLoginMode ? 'auth-tab active' : 'auth-tab'} onClick={() => setIsLoginMode(false)} disabled={loading}>
              회원가입
            </Button>
          </div>
          {isLoginMode ? (
            <>
              <input className="auth-input" placeholder="닉네임" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} disabled={loading} />
              <input className="auth-input" type="password" placeholder="비밀번호" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} disabled={loading} />
              <Button className="auth-btn" onClick={handleLogin} disabled={!loginUsername || !loginPassword || loading} style={{width: '100%', marginTop: 8}}>
                {loading ? '로그인 중...' : '로그인'}
              </Button>
            </>
          ) : (
            <>
              <input className="auth-input" placeholder="닉네임" value={registerUsername} onChange={e => setRegisterUsername(e.target.value)} disabled={loading} />
              <input className="auth-input" type="password" placeholder="비밀번호" value={registerPassword} onChange={e => setRegisterPassword(e.target.value)} disabled={loading} />
              <input className="auth-input" type="password" placeholder="비밀번호 확인" value={registerPasswordConfirm} onChange={e => setRegisterPasswordConfirm(e.target.value)} disabled={loading} />
              <Button className="auth-btn" onClick={handleRegister} disabled={!registerUsername || !registerPassword || !registerPasswordConfirm || registerPassword !== registerPasswordConfirm || loading} style={{width: '100%', marginTop: 8}}>
                {loading ? '회원가입 중...' : '회원가입'}
              </Button>
            </>
          )}
          {authError && <div className={authError.includes('성공') ? 'auth-success' : 'auth-error'}>{authError}</div>}
        </div>
        <IntroCard>
          <IntroTitle>MUD 판타지 온라인</IntroTitle>
          <IntroSubtitle>실시간 텍스트 RPG</IntroSubtitle>
          <IntroFeatures>
            <IntroFeatureLi>실시간 명령어 기반 전투와 방 이동</IntroFeatureLi>
            <IntroFeatureLi>다양한 성장과 장비 수집의 재미</IntroFeatureLi>
            <IntroFeatureLi>희귀 아이템과 특별한 장비 드랍</IntroFeatureLi>
            <IntroFeatureLi>몬스터/상점/채팅 등 풍부한 콘텐츠</IntroFeatureLi>
            <IntroFeatureLi>모바일/PC 모두 쾌적한 UI</IntroFeatureLi>
            <IntroFeatureLi>친구와 함께 즐기는 실시간 채팅</IntroFeatureLi>
            <IntroFeatureLi><b>직접 조작과 방치 플레이가 공존하는 반(半)방치형 시스템</b></IntroFeatureLi>
            <IntroFeatureLi><b>수동 조작과 자동 성장의 재미를 동시에!</b></IntroFeatureLi>
          </IntroFeatures>
          <IntroAvatars>
            <IntroAvatar role="img" aria-label="전사">🗡️</IntroAvatar>
            <IntroAvatar role="img" aria-label="마법사">🧙‍♂️</IntroAvatar>
            <IntroAvatar role="img" aria-label="기사">🛡️</IntroAvatar>
            <IntroAvatar role="img" aria-label="궁수">🏹</IntroAvatar>
            <IntroAvatar role="img" aria-label="치유사">💊</IntroAvatar>
          </IntroAvatars>
        </IntroCard>
      </div>
    </div>
  );
}

export default React.memo(AuthForm); 