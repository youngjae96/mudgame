import axios from 'axios';

/**
 * REST API: 플레이어 정보 조회
 * @param {string} token - JWT 토큰
 * @returns {Promise<object>}
 */
export const getPlayerInfo = (token) =>
  axios.get('/api/player/me', { headers: { Authorization: `Bearer ${token}` } });

/**
 * REST API: 인벤토리 조회
 * @param {string} token - JWT 토큰
 * @returns {Promise<object>}
 */
export const getInventory = (token) =>
  axios.get('/api/player/inventory', { headers: { Authorization: `Bearer ${token}` } });

/**
 * REST API: 상점 아이템 목록 조회
 * @param {string} token - JWT 토큰
 * @returns {Promise<object>}
 */
export const getShopItems = (token) =>
  axios.get('/api/shop/items', { headers: { Authorization: `Bearer ${token}` } });

/**
 * REST API: 몬스터 공격
 * @param {string} token - JWT 토큰
 * @param {object} data - 공격 데이터
 * @returns {Promise<object>}
 */
export const attackMonster = (token, data) =>
  axios.post('/api/battle/attack', data, { headers: { Authorization: `Bearer ${token}` } });

/**
 * REST API: 로그인
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>}
 */
export const login = (username, password) =>
  axios.post('/api/auth/login', { username, password });

/**
 * REST API: 회원가입
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>}
 */
export const register = (username, password) =>
  axios.post('/api/auth/register', { username, password }); 