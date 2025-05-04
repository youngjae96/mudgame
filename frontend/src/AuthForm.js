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
      <div className="auth-card">
        <div className="auth-title">세련된 온라인 MUD</div>
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
    </div>
  );
}

export default React.memo(AuthForm); 