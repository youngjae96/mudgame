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
  const [name, setName] = useState(localStorage.getItem('nickname') || '');
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
  const [battleMessages, setBattleMessages] = useState([]);
  const [autoBattleTarget, setAutoBattleTarget] = useState(() => {
    // 마운트 시 localStorage에서 복구
    const saved = localStorage.getItem('autoBattleTarget');
    return saved ? JSON.parse(saved) : null;
  });
  const sentAutoBattleRef = useRef(false);
  const justJoinedRef = useRef(false);
  const justJoinedTimeout = useRef(null);

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
          justJoinedRef.current = true;
          if (justJoinedTimeout.current) clearTimeout(justJoinedTimeout.current);
          justJoinedTimeout.current = setTimeout(() => {
            justJoinedRef.current = false;
          }, 1000); // 1초 후 자동 해제
          setCharacter(data.info);
          if (data.info && data.info.autoBattleTarget) {
            setAutoBattleTarget(data.info.autoBattleTarget);
            localStorage.setItem('autoBattleTarget', JSON.stringify(data.info.autoBattleTarget));
            if (ws.current && ws.current.readyState === 1) {
              ws.current.send(JSON.stringify({ type: 'autobattle', monsterId: data.info.autoBattleTarget }));
            }
          }
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
          setBattleMessages(msgs => {
            if (Array.isArray(data.log)) {
              const logs = data.log.map((log) => ({ ...log }));
              const next = [...msgs.flat(), ...logs];
              return next.length > 100 ? next.slice(next.length - 100) : next;
            } else {
              const next = [...msgs.flat(), { ...data }];
              return next.length > 100 ? next.slice(next.length - 100) : next;
            }
          });
          // 자동전투 종료 조건 감지: 몬스터 사망, 플레이어 사망, 자동전투 중단 등
          let shouldClearAutoBattle = false;
          let killedByOther = false;
          if (data.log && Array.isArray(data.log)) {
            killedByOther = data.log.some(l => typeof l.text === 'string' && l.text.includes('처치!'));
          }
          if (
            shouldClearAutoBattle ||
            data.subtype === 'kill' ||
            data.subtype === 'death' ||
            data.subtype === 'autobattle_end' ||
            data.subtype === 'playerDead' ||
            data.subtype === 'monsterDead' ||
            (typeof data.text === 'string' && (
              data.text.includes('자동전투를 종료') ||
              data.text.includes('자동전투가 종료') ||
              data.text.includes('자동전투가 중단')
            ))
          ) {
            if (!justJoinedRef.current) {
              setAutoBattleTarget(null);
              localStorage.removeItem('autoBattleTarget');
            }
          }
          // 다른 플레이어가 몬스터를 처치한 경우는 justJoinedRef와 무관하게 즉시 삭제
          if (killedByOther || (typeof data.text === 'string' && data.text.includes('처치!'))) {
            setAutoBattleTarget(null);
            localStorage.removeItem('autoBattleTarget');
          }
          return;
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

  useEffect(() => {
    if (!connected) {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = setTimeout(() => {
        handleConnect();
      }, 3000); // 3초 후 자동 재연결
    }
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connected]);

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
      const username = localStorage.getItem('username');
      const password = localStorage.getItem('password');
      if (process.env.REACT_APP_DEBUG === 'true') console.log('[WebSocket] onopen, join 전송:', { name: username, password: !!password });
      if (ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'join', name: username, password }));
        setConnected(true);
        // 자동전투 등 상태 복구
        if (autoBattleTarget) {
          ws.current.send(JSON.stringify({ type: 'autobattle', monsterId: autoBattleTarget }));
        }
      } else {
        ws.current.addEventListener('open', () => {
          ws.current.send(JSON.stringify({ type: 'join', name: username, password }));
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
        justJoinedRef.current = true;
        if (justJoinedTimeout.current) clearTimeout(justJoinedTimeout.current);
        justJoinedTimeout.current = setTimeout(() => {
          justJoinedRef.current = false;
        }, 1000); // 1초 후 자동 해제
        setCharacter(data.info);
        if (data.info && data.info.autoBattleTarget) {
          setAutoBattleTarget(data.info.autoBattleTarget);
          localStorage.setItem('autoBattleTarget', JSON.stringify(data.info.autoBattleTarget));
          if (ws.current && ws.current.readyState === 1) {
            ws.current.send(JSON.stringify({ type: 'autobattle', monsterId: data.info.autoBattleTarget }));
          }
        }
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
        setBattleMessages(msgs => {
          if (Array.isArray(data.log)) {
            const logs = data.log.map((log) => ({ ...log }));
            const next = [...msgs.flat(), ...logs];
            return next.length > 100 ? next.slice(next.length - 100) : next;
          } else {
            const next = [...msgs.flat(), { ...data }];
            return next.length > 100 ? next.slice(next.length - 100) : next;
          }
        });
        // 자동전투 종료 조건 감지: 몬스터 사망, 플레이어 사망, 자동전투 중단 등
        let shouldClearAutoBattle = false;
        let killedByOther = false;
        if (data.log && Array.isArray(data.log)) {
          killedByOther = data.log.some(l => typeof l.text === 'string' && l.text.includes('처치!'));
        }
        if (
          shouldClearAutoBattle ||
          data.subtype === 'kill' ||
          data.subtype === 'death' ||
          data.subtype === 'autobattle_end' ||
          data.subtype === 'playerDead' ||
          data.subtype === 'monsterDead' ||
          (typeof data.text === 'string' && (
            data.text.includes('자동전투를 종료') ||
            data.text.includes('자동전투가 종료') ||
            data.text.includes('자동전투가 중단')
          ))
        ) {
          if (!justJoinedRef.current) {
            setAutoBattleTarget(null);
            localStorage.removeItem('autoBattleTarget');
          }
        }
        // 다른 플레이어가 몬스터를 처치한 경우는 justJoinedRef와 무관하게 즉시 삭제
        if (killedByOther || (typeof data.text === 'string' && data.text.includes('처치!'))) {
          setAutoBattleTarget(null);
          localStorage.removeItem('autoBattleTarget');
        }
        return;
      } else if (data.type === 'notice') {
        setNotice(data.notice);
      }
    };
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (input.trim() === '/도움말') {
      setInput('');
      return;
    }
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
    setAutoBattleTarget(monsterId);
    localStorage.setItem('autoBattleTarget', JSON.stringify(monsterId));
    setTimeout(() => {
      ws.current.send(JSON.stringify({ type: 'stat' }));
    }, 200);
  };

  // 방 이동 등 room 정보가 바뀔 때 자동전투 상태 초기화
  useEffect(() => {
    if (autoBattleTarget && room) {
      // 현재 방에 autoBattleTarget 몬스터가 없으면 자동전투 종료
      const monsterId = typeof autoBattleTarget === 'string' ? autoBattleTarget : String(autoBattleTarget);
      const hasMonster = room.monsters && room.monsters.some(m => String(m.id) === monsterId);
      if (!hasMonster) {
        if (!justJoinedRef.current) {
          setAutoBattleTarget(null);
          localStorage.removeItem('autoBattleTarget');
        }
      }
    }
  }, [room]);

  // WebSocket 연결 후 자동전투 복구: autoBattleTarget이 남아있고, 방에 몬스터가 하나라도 있으면 그 몬스터로 자동전투
  useEffect(() => {
    // monsters가 1개 이상일 때만 자동전투 명령 전송
    if (
      connected &&
      autoBattleTarget &&
      room &&
      Array.isArray(room.monsters) &&
      room.monsters.length > 0 &&
      !sentAutoBattleRef.current
    ) {
      const monsterId = room.monsters[0].id;
      ws.current && ws.current.send(JSON.stringify({ type: 'autobattle', monsterId }));
      setAutoBattleTarget(monsterId);
      localStorage.setItem('autoBattleTarget', JSON.stringify(monsterId));
      sentAutoBattleRef.current = true;
    }
    // monsters가 비어있으면 플래그 초기화(방 이동 등)
    if (!room || !Array.isArray(room.monsters) || room.monsters.length === 0) {
      sentAutoBattleRef.current = false;
    }
    // 연결이 끊기거나 autoBattleTarget이 없으면 플래그 초기화
    if (!connected || !autoBattleTarget) {
      sentAutoBattleRef.current = false;
    }
  }, [connected, autoBattleTarget, room && room.monsters && room.monsters.length]);

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
    guildChatLogMessages,
    battleMessages
  };
}

export default useWebSocket; 