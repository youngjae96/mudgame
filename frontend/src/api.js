import axios from 'axios';

// 환경변수로 API 주소를 분리 (운영: Render, 개발: 로컬)
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
});

/**
 * REST API: 플레이어 정보 조회
 * @param {string} token - JWT 토큰
 * @returns {Promise<object>}
 */
export const getPlayerInfo = (token) =>
  api.get('/api/player/me', { headers: { Authorization: `Bearer ${token}` } });

/**
 * REST API: 인벤토리 조회
 * @param {string} token - JWT 토큰
 * @returns {Promise<object>}
 */
export const getInventory = (token) =>
  api.get('/api/player/inventory', { headers: { Authorization: `Bearer ${token}` } });

/**
 * REST API: 상점 아이템 목록 조회
 * @param {string} token - JWT 토큰
 * @returns {Promise<object>}
 */
export const getShopItems = (token) =>
  api.get('/api/shop/items', { headers: { Authorization: `Bearer ${token}` } });

/**
 * REST API: 몬스터 공격
 * @param {string} token - JWT 토큰
 * @param {object} data - 공격 데이터
 * @returns {Promise<object>}
 */
export const attackMonster = (token, data) =>
  api.post('/api/battle/attack', data, { headers: { Authorization: `Bearer ${token}` } });

/**
 * REST API: 로그인
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>}
 */
export const login = (username, password) =>
  api.post('/api/auth/login', { username, password });

/**
 * REST API: 회원가입
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>}
 */
export const register = (username, password) =>
  api.post('/api/auth/register', { username, password });

// 401(Access Token 만료) 발생 시 Refresh Token으로 자동 갱신 및 재시도 인터셉터
api.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config;
    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const resp = await api.post('/api/auth/refresh', { refreshToken });
          if (resp.data && resp.data.accessToken) {
            localStorage.setItem('jwtToken', resp.data.accessToken);
            // 요청 헤더 갱신 후 재시도
            originalRequest.headers['Authorization'] = `Bearer ${resp.data.accessToken}`;
            return api(originalRequest);
          }
        } catch (e) {
          // Refresh Token도 만료/실패: 로그아웃 필요
          localStorage.removeItem('jwtToken');
          localStorage.removeItem('refreshToken');
          window.location.reload(); // 또는 로그아웃 처리
        }
      }
    }
    return Promise.reject(err);
  }
); 