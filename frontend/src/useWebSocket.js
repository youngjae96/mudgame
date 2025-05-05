import { useState, useEffect, useRef } from 'react';
import { COMMANDS, SYSTEM_MESSAGES } from './constants';
import { jwtDecode } from 'jwt-decode';

// 환경변수로 WebSocket 주소 분리 (운영: Render, 개발: 로컬)
const WS_URL = process.env.REACT_APP_WS_URL || (
  window.location.hostname === 'localhost'
    ? 'ws://localhost:4000'
    : (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.hostname
);

/**
 * 게임 WebSocket 및 상태 관리 커스텀 훅
 * @param {function} onDisconnect - 서버 연결 끊김 시 콜백
 * @returns {object} 게임 상태, 핸들러, ref 등 다양한 상태/함수 반환
 */
function useWebSocket(onDisconnect) {
  const [connected, setConnected] = useState(false);
  const [name, setName] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [players, setPlayers] = useState([]);
  const [room, setRoom] = useState(null);
  const [mapSize, setMapSize] = useState(5);
  const [inventory, setInventory] = useState([]);
  const [mapInfo, setMapInfo] = useState({ village: { x: 2, y: 2 } });
  const [character, setCharacter] = useState({});
  const [nearbyRooms, setNearbyRooms] = useState([]);
  const ws = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (connected && ws.current) {
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat' || data.type === 'system') {
          setMessages((msgs) => {
            const next = [...msgs, data];
            return next.length > 100 ? next.slice(next.length - 100) : next;
          });
        } else if (data.type === 'players') {
          setPlayers(data.list);
        } else if (data.type === 'room') {
          setRoom(data.room);
          setMapSize(data.mapSize || 5);
          if (data.mapInfo) setMapInfo(data.mapInfo);
          if (data.nearbyRooms) setNearbyRooms(data.nearbyRooms);
        } else if (data.type === 'inventory') {
          setInventory(data.inventory);
        } else if (data.type === 'character') {
          setCharacter(data.info);
        } else if (data.type === 'stat') {
          setMessages((msgs) => {
            const next = [...msgs, { type: 'stat', text: data.text }];
            return next.length > 100 ? next.slice(next.length - 100) : next;
          });
          if (typeof data.text === 'string') {
            const stat = {};
            const hpMatch = data.text.match(/HP\s*:\s*([\d.]+)\s*\/\s*([\d.]+)/);
            const mpMatch = data.text.match(/MP\s*:\s*([\d.]+)\s*\/\s*([\d.]+)/);
            const strMatch = data.text.match(/STR\s*:\s*([\d.]+)/) || data.text.match(/공격력\s*:\s*([\d.]+)/);
            const defMatch = data.text.match(/DEF\s*:\s*([\d.]+)/) || data.text.match(/방어력\s*:\s*([\d.]+)/);
            const dexMatch = data.text.match(/DEX\s*:\s*([\d.]+)/) || data.text.match(/민첩\s*:\s*([\d.]+)/);
            const intMatch = data.text.match(/INT\s*:\s*([\d.]+)/) || data.text.match(/지능\s*:\s*([\d.]+)/);
            if (hpMatch) { stat.hp = Number(hpMatch[1]); stat.maxHp = Number(hpMatch[2]); }
            if (mpMatch) { stat.mp = Number(mpMatch[1]); stat.maxMp = Number(mpMatch[2]); }
            if (strMatch) stat.atk = Number(strMatch[1]);
            if (defMatch) stat.def = Number(defMatch[1]);
            if (dexMatch) stat.dex = Number(dexMatch[1]);
            if (intMatch) stat.int = Number(intMatch[1]);
            if (Object.keys(stat).length > 0) setCharacter((prev) => ({ ...prev, ...stat }));
          }
        } else if (data.type === 'battle') {
          setMessages((msgs) => {
            if (Array.isArray(data.log)) {
              const logs = data.log.map((log) => ({ ...log, type: 'battle' }));
              const next = [...msgs.flat(), ...logs];
              return next.length > 100 ? next.slice(next.length - 100) : next;
            } else {
              const next = [...msgs.flat(), { ...data, type: 'battle' }];
              return next.length > 100 ? next.slice(next.length - 100) : next;
            }
          });
        }
      };
    }
  }, [connected]);

  const handleConnect = () => {
    if (ws.current && (ws.current.readyState === 0 || ws.current.readyState === 1)) {
      // 이미 연결 중이거나 연결됨
      return;
    }
    ws.current = new window.WebSocket(WS_URL);
    console.log('[WebSocket] WebSocket 객체 생성:', WS_URL);
    ws.current.onopen = () => {
      const token = localStorage.getItem('jwtToken');
      let username = '';
      try {
        username = jwtDecode(token).username;
      } catch {}
      console.log('[WebSocket] onopen, join 전송:', { name: username, token });
      if (ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'join', name: username, token }));
        setConnected(true);
      } else {
        ws.current.addEventListener('open', () => {
          ws.current.send(JSON.stringify({ type: 'join', name: username, token }));
          setConnected(true);
        }, { once: true });
      }
    };
    ws.current.onerror = (err) => {
      console.log('[WebSocket] onerror:', err);
    };
    ws.current.onclose = () => {
      console.log('[WebSocket] onclose');
      setConnected(false);
      setMessages((msgs) => [...msgs, { type: 'system', message: SYSTEM_MESSAGES.DISCONNECTED }]);
      if (onDisconnect) onDisconnect();
    };
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (input.trim() === COMMANDS.INFO) {
      ws.current.send(JSON.stringify({ type: 'stat' }));
      setInput('');
      return;
    }
    if (input.trim() === COMMANDS.SHOP) {
      ws.current.send(JSON.stringify({ type: 'shop' }));
      setInput('');
      return;
    }
    if (input.trim() === COMMANDS.INN) {
      ws.current.send(JSON.stringify({ type: 'inn' }));
      setInput('');
      return;
    }
    if (input.trim() === COMMANDS.MAP) {
      if (typeof window.setShowMap === 'function') window.setShowMap(true);
      setInput('');
      return;
    }
    if (input.trim().startsWith(COMMANDS.BUY + ' ')) {
      ws.current.send(JSON.stringify({ type: 'chat', message: input.trim() }));
      setInput('');
      return;
    }
    if (input.trim().startsWith(COMMANDS.SELL + ' ')) {
      ws.current.send(JSON.stringify({ type: 'chat', message: input.trim() }));
      setInput('');
      return;
    }
    if (input.trim().startsWith(COMMANDS.EQUIP + ' ')) {
      ws.current.send(JSON.stringify({ type: 'chat', message: input.trim() }));
      setInput('');
      return;
    }
    if (input.trim().startsWith(COMMANDS.UNEQUIP + ' ')) {
      ws.current.send(JSON.stringify({ type: 'chat', message: input.trim() }));
      setInput('');
      return;
    }
    if (input.trim() === '/장비') {
      ws.current.send(JSON.stringify({ type: 'equipinfo' }));
      setInput('');
      return;
    }
    ws.current.send(JSON.stringify({ type: 'chat', message: input }));
    setInput('');
  };

  const handleMove = (x, y) => {
    if (!room) return;
    const dx = Math.abs(room.x - x);
    const dy = Math.abs(room.y - y);
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      ws.current.send(JSON.stringify({ type: 'move', x, y }));
    }
  };

  const handlePickup = (itemId) => {
    ws.current.send(JSON.stringify({ type: 'pickup', itemId }));
  };

  const handleAttack = (monsterId) => {
    ws.current.send(JSON.stringify({ type: 'autobattle', monsterId }));
  };

  return {
    connected,
    name,
    setName,
    input,
    setInput,
    messages,
    players,
    room,
    mapSize,
    inventory,
    mapInfo,
    character,
    chatEndRef,
    handleConnect,
    handleSend,
    handleMove,
    handlePickup,
    handleAttack,
    nearbyRooms
  };
}

export default useWebSocket; 