import { useState, useEffect, useRef } from 'react';
import { COMMANDS, SYSTEM_MESSAGES } from './constants';
import { jwtDecode } from 'jwt-decode';

// 환경변수로 WebSocket 주소 분리 (운영: Render, 개발: 로컬)
const WS_URL = process.env.REACT_APP_WS_URL || (
  window.location.hostname === 'localhost'
    ? 'ws://localhost:4000'
    : (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.hostname
);

// parseStat를 루트에 선언
function parseStat(str) {
  if (!str) return 0;
  const match = str.match(/([\d.]+)\s*(?:\(\+([\d.]+)\))?/);
  if (match) return Number(match[1]) + (match[2] ? Number(match[2]) : 0);
  return Number(str);
}

/**
 * 게임 WebSocket 및 상태 관리 커스텀 훅
 * @param {function} onDisconnect - 서버 연결 끊김 시 콜백
 * @returns {object} 게임 상태, 핸들러, ref 등 다양한 상태/함수 반환
 */
function useWebSocket(onDisconnect) {
  const [connected, setConnected] = useState(false);
  const [name, setName] = useState('');
  const [input, setInput] = useState('');
  const [allMessages, setAllMessages] = useState([]);
  const [players, setPlayers] = useState([]);
  const [room, setRoom] = useState(null);
  const [mapSize, setMapSize] = useState(5);
  const [inventory, setInventory] = useState([]);
  const [mapInfo, setMapInfo] = useState({ village: { x: 2, y: 2 } });
  const [character, setCharacter] = useState({});
  const [nearbyRooms, setNearbyRooms] = useState([]);
  const [notice, setNotice] = useState(null);
  const ws = useRef(null);
  const chatEndRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef(null);
  const [wsError, setWsError] = useState(null);
  const [chatLogMessages, setChatLogMessages] = useState([]);
  const [guildChatLogMessages, setGuildChatLogMessages] = useState([]);

  useEffect(() => {
    if (connected && ws.current) {
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chatLog') {
          setChatLogMessages(data.log);
        } else if (data.type === 'guildChatLog') {
          setGuildChatLogMessages(
            (data.log || []).map(msg => ({
              ...msg,
              type: 'chat',
              chatType: 'guild'
            }))
          );
        } else if (data.type === 'chat') {
          setAllMessages(msgs => [...msgs, data]);
          setChatLogMessages(msgs => [...msgs, data].slice(-100));
          if (data.chatType === 'guild') {
            setGuildChatLogMessages(msgs => [
              ...msgs,
              {
                ...data,
                type: 'chat',
                chatType: 'guild'
              }
            ].slice(-100));
          }
        } else if (data.type === 'system') {
          setAllMessages(msgs => [...msgs, data]);
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
          setAllMessages(msgs => [...msgs, { type: 'stat', text: data.text }]);
          if (typeof data.text === 'string') {
            const stat = {};
            const hpMatch = data.text.match(/HP\s*:\s*([\d.]+)\s*\/\s*([\d.]+(?:\s*\(\+?[\d.]+\))?)/);
            const mpMatch = data.text.match(/MP\s*:\s*([\d.]+)\s*\/\s*([\d.]+(?:\s*\(\+?[\d.]+\))?)/);
            const strMatch = data.text.match(/STR\s*:\s*([\d.]+(?:\s*\(\+?[\d.]+\))?)/);
            const dexMatch = data.text.match(/DEX\s*:\s*([\d.]+(?:\s*\(\+?[\d.]+\))?)/);
            const intMatch = data.text.match(/INT\s*:\s*([\d.]+(?:\s*\(\+?[\d.]+\))?)/);
            const atkMatch = data.text.match(/공격력:\s*([\d.]+)(?:\s*\(\+([\d.]+)\))?/);
            const defMatch = data.text.match(/방어력:\s*([\d.]+)(?:\s*\(\+([\d.]+)\))?/);
            if (hpMatch) { stat.hp = Number(hpMatch[1]); stat.maxHp = parseStat(hpMatch[2]); }
            if (mpMatch) { stat.mp = Number(mpMatch[1]); stat.maxMp = parseStat(mpMatch[2]); }
            if (strMatch) stat.str = parseStat(strMatch[1]);
            if (dexMatch) stat.dex = parseStat(dexMatch[1]);
            if (intMatch) stat.int = parseStat(intMatch[1]);
            if (atkMatch) stat.atk = Number(atkMatch[1]) + (atkMatch[2] ? Number(atkMatch[2]) : 0);
            if (defMatch) stat.def = Number(defMatch[1]) + (defMatch[2] ? Number(defMatch[2]) : 0);
            if (Object.keys(stat).length > 0) setCharacter((prev) => ({ ...prev, ...stat }));
          }
        } else if (data.type === 'battle') {
          setAllMessages(msgs => {
            if (Array.isArray(data.log)) {
              const logs = data.log.map((log) => ({ ...log }));
              const next = [...msgs.flat(), ...logs];
              return next.length > 100 ? next.slice(next.length - 100) : next;
            } else {
              const next = [...msgs.flat(), { ...data }];
              return next.length > 100 ? next.slice(next.length - 100) : next;
            }
          });
        } else if (data.type === 'notice') {
          setNotice(data.notice);
        }
      };
    }
  }, [connected]);

  useEffect(() => {
    // 페이지 이탈/새로고침/닫기 시 서버에 알림
    const handleBeforeUnload = () => {
      if (ws.current && ws.current.readyState === 1) {
        ws.current.send(JSON.stringify({ type: 'close' }));
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleConnect = () => {
    // 기존 연결이 있으면 정리
    if (ws.current) {
      if (ws.current.readyState === 0 || ws.current.readyState === 1) {
        ws.current.onclose = null;
        ws.current.onerror = null;
        ws.current.onmessage = null;
        ws.current.close();
      }
    }
    ws.current = new window.WebSocket(WS_URL);
    if (process.env.REACT_APP_DEBUG === 'true') console.log('[WebSocket] WebSocket 객체 생성:', WS_URL);
    ws.current.onopen = () => {
      reconnectAttempts.current = 0;
      setWsError(null);
      const token = localStorage.getItem('jwtToken');
      let username = '';
      try { username = jwtDecode(token).username; } catch (e) {/* ignore error */}
      if (process.env.REACT_APP_DEBUG === 'true') console.log('[WebSocket] onopen, join 전송:', { name: username, token });
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
      setWsError('WebSocket 연결 오류');
      if (process.env.REACT_APP_DEBUG === 'true') console.log('[WebSocket] onerror:', err);
    };
    ws.current.onclose = () => {
      setConnected(false);
      setAllMessages((msgs) => [...msgs, { type: 'system', message: SYSTEM_MESSAGES.DISCONNECTED }]);
      setWsError('WebSocket 연결 종료');
      if (onDisconnect) onDisconnect();
    };
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chatLog') {
        setChatLogMessages(data.log);
      } else if (data.type === 'guildChatLog') {
        setGuildChatLogMessages(
          (data.log || []).map(msg => ({
            ...msg,
            type: 'chat',
            chatType: 'guild'
          }))
        );
      } else if (data.type === 'chat') {
        setAllMessages(msgs => [...msgs, data]);
        setChatLogMessages(msgs => [...msgs, data].slice(-100));
        if (data.chatType === 'guild') {
          setGuildChatLogMessages(msgs => [
            ...msgs,
            {
              ...data,
              type: 'chat',
              chatType: 'guild'
            }
          ].slice(-100));
        }
      } else if (data.type === 'system') {
        setAllMessages(msgs => [...msgs, data]);
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
        setAllMessages(msgs => [...msgs, { type: 'stat', text: data.text }]);
        if (typeof data.text === 'string') {
          const stat = {};
          const hpMatch = data.text.match(/HP\s*:\s*([\d.]+)\s*\/\s*([\d.]+(?:\s*\(\+?[\d.]+\))?)/);
          const mpMatch = data.text.match(/MP\s*:\s*([\d.]+)\s*\/\s*([\d.]+(?:\s*\(\+?[\d.]+\))?)/);
          const strMatch = data.text.match(/STR\s*:\s*([\d.]+(?:\s*\(\+?[\d.]+\))?)/);
          const dexMatch = data.text.match(/DEX\s*:\s*([\d.]+(?:\s*\(\+?[\d.]+\))?)/);
          const intMatch = data.text.match(/INT\s*:\s*([\d.]+(?:\s*\(\+?[\d.]+\))?)/);
          const atkMatch = data.text.match(/공격력:\s*([\d.]+)(?:\s*\(\+([\d.]+)\))?/);
          const defMatch = data.text.match(/방어력:\s*([\d.]+)(?:\s*\(\+([\d.]+)\))?/);
          if (hpMatch) { stat.hp = Number(hpMatch[1]); stat.maxHp = parseStat(hpMatch[2]); }
          if (mpMatch) { stat.mp = Number(mpMatch[1]); stat.maxMp = parseStat(mpMatch[2]); }
          if (strMatch) stat.str = parseStat(strMatch[1]);
          if (dexMatch) stat.dex = parseStat(dexMatch[1]);
          if (intMatch) stat.int = parseStat(intMatch[1]);
          if (atkMatch) stat.atk = Number(atkMatch[1]) + (atkMatch[2] ? Number(atkMatch[2]) : 0);
          if (defMatch) stat.def = Number(defMatch[1]) + (defMatch[2] ? Number(defMatch[2]) : 0);
          if (Object.keys(stat).length > 0) setCharacter((prev) => ({ ...prev, ...stat }));
        }
      } else if (data.type === 'battle') {
        setAllMessages(msgs => {
          if (Array.isArray(data.log)) {
            const logs = data.log.map((log) => ({ ...log }));
            const next = [...msgs.flat(), ...logs];
            return next.length > 100 ? next.slice(next.length - 100) : next;
          } else {
            const next = [...msgs.flat(), { ...data }];
            return next.length > 100 ? next.slice(next.length - 100) : next;
          }
        });
      } else if (data.type === 'notice') {
        setNotice(data.notice);
      }
    };
  };

  useEffect(() => {
    // 언마운트 시 타임아웃 정리
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, []);

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
      ws.current.send(JSON.stringify({ type: 'chat', message: input.trim() }));
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
    setTimeout(() => {
      ws.current.send(JSON.stringify({ type: 'stat' }));
    }, 200);
  };

  return {
    connected,
    name,
    setName,
    input,
    setInput,
    allMessages,
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
    nearbyRooms,
    notice,
    wsError,
    chatLogMessages,
    guildChatLogMessages
  };
}

export default useWebSocket; 