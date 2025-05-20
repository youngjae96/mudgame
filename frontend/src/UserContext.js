import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getPlayerInfo, getInventory } from './api';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('jwtToken'));
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || '');
  const [user, setUser] = useState(null); // { name, ... }
  const [inventory, setInventory] = useState([]);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');

  // 로그인
  const login = async (username, password) => {
    setAuthError('');
    setLoading(true);
    try {
      const res = await apiLogin(username, password);
      if (res.data.success && res.data.accessToken) {
        localStorage.setItem('jwtToken', res.data.accessToken);
        localStorage.setItem('nickname', username);
        setToken(res.data.accessToken);
        setIsLoggedIn(true);
        setUser({ name: username });
        await fetchUserInfo(res.data.accessToken);
        await fetchInventory(res.data.accessToken);
      }
    } catch (e) {
      setAuthError(e.response?.data?.error || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  // 회원가입
  const register = async (username, password) => {
    setAuthError('');
    setLoading(true);
    try {
      const res = await apiRegister(username, password);
      if (res.data.success) {
        setAuthError('회원가입 성공! 로그인 해주세요.');
      }
    } catch (e) {
      setAuthError(e.response?.data?.error || '회원가입 실패');
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const logout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('nickname');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    // 필요시 추가로 사용자 관련 key 삭제
    setToken('');
    setIsLoggedIn(false);
    setUser(null);
    setInventory([]);
  };

  // 유저 정보 불러오기
  const fetchUserInfo = useCallback(async (tk = token) => {
    if (!tk) return;
    try {
      const res = await getPlayerInfo(tk);
      setUser(res.data);
    } catch {
      // 무시
    }
  }, [token]);

  // 인벤토리 불러오기
  const fetchInventory = useCallback(async (tk = token) => {
    if (!tk) return;
    try {
      const res = await getInventory(tk);
      setInventory(res.data.inventory || []);
    } catch {
      // 무시
    }
  }, [token]);

  // 최초 마운트 시 토큰 있으면 유저 정보/인벤토리 불러오기
  useEffect(() => {
    if (token) {
      fetchUserInfo(token);
      fetchInventory(token);
    }
  }, [token, fetchUserInfo, fetchInventory]);

  return (
    <UserContext.Provider value={{
      isLoggedIn, token, user, inventory, authError, loading,
      login, register, logout, fetchUserInfo, fetchInventory, setAuthError,
      registerPasswordConfirm, setRegisterPasswordConfirm
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  return useContext(UserContext);
} 