import React from 'react';
import Button from './components/Button';

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
              <Button className="auth-btn" onClick={handleRegister} disabled={!registerUsername || !registerPassword || loading} style={{width: '100%', marginTop: 8}}>
                {loading ? '회원가입 중...' : '회원가입'}
              </Button>
            </>
          )}
          {authError && <div className={authError.includes('성공') ? 'auth-success' : 'auth-error'}>{authError}</div>}
        </div>
        <div className="intro-card">
          <div className="intro-title">MUD 판타지 온라인</div>
          <div className="intro-subtitle">실시간 텍스트 RPG</div>
          <ul className="intro-features">
            <li>실시간 명령어 기반 전투와 방 이동</li>
            <li>다양한 성장과 장비 수집의 재미</li>
            <li>희귀 아이템과 특별한 장비 드랍</li>
            <li>몬스터/상점/채팅 등 풍부한 콘텐츠</li>
            <li>모바일/PC 모두 쾌적한 UI</li>
            <li>친구와 함께 즐기는 실시간 채팅</li>
            <li><b>직접 조작과 방치 플레이가 공존하는 반(半)방치형 시스템</b></li>
            <li><b>수동 조작과 자동 성장의 재미를 동시에!</b></li>
          </ul>
          <div className="intro-avatars">
            <span className="intro-avatar" role="img" aria-label="전사">🗡️</span>
            <span className="intro-avatar" role="img" aria-label="마법사">🧙‍♂️</span>
            <span className="intro-avatar" role="img" aria-label="기사">🛡️</span>
            <span className="intro-avatar" role="img" aria-label="궁수">🏹</span>
            <span className="intro-avatar" role="img" aria-label="치유사">💊</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(AuthForm); 