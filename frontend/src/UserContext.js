import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getPlayerInfo, getInventory } from './api';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!(localStorage.getItem('username') && localStorage.getItem('password')));
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
      if (res.data.success) {
        localStorage.setItem('username', username);
        localStorage.setItem('password', password);
        localStorage.setItem('nickname', username);
        setIsLoggedIn(true);
        setUser({ name: username });
        await fetchUserInfo(username, password);
        await fetchInventory(username, password);
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
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    localStorage.removeItem('nickname');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setUser(null);
    setInventory([]);
  };

  // 유저 정보 불러오기
  const fetchUserInfo = useCallback(async (username, password) => {
    if (!username || !password) return;
    try {
      const res = await getPlayerInfo(username, password);
      setUser(res.data);
    } catch {
      // 무시
    }
  }, []);

  // 인벤토리 불러오기
  const fetchInventory = useCallback(async (username, password) => {
    if (!username || !password) return;
    try {
      const res = await getInventory(username, password);
      setInventory(res.data.inventory || []);
    } catch {
      // 무시
    }
  }, []);

  // 최초 마운트 시 username, password 있으면 유저 정보/인벤토리 불러오기
  useEffect(() => {
    const username = localStorage.getItem('username');
    const password = localStorage.getItem('password');
    if (username && password) {
      fetchUserInfo(username, password);
      fetchInventory(username, password);
    }
  }, [fetchUserInfo, fetchInventory]);

  return (
    <UserContext.Provider value={{
      isLoggedIn, user, inventory, authError, loading,
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