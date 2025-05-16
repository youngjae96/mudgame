import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import MiniMap from './MiniMap';
import RoomInfo from './RoomInfo';
import CharacterInfo from './CharacterInfo';
import Inventory from './Inventory';
import ChatBox, { ChatOnlyBox } from './ChatBox';
import Button from './components/Button';
import Input from './components/Input';
import RoomItems from './RoomItems';
import RoomMonsters from './RoomMonsters';
import Modal from './components/Modal';
import ExpEventBanner from './components/ExpEventBanner';
import PasswordChangeModal from './components/PasswordChangeModal';

const MobileRoot = styled.div`
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  background: #181c24;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  overflow: hidden;
`;
const MobileHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 10px 18px;
  background: #232837;
  border-radius: 0 0 18px 18px;
  box-shadow: 0 2px 12px #0004;
`;
const MobileTitle = styled.span`
  font-size: 1.25rem;
  font-weight: bold;
  color: #7ecfff;
`;
const MobileMain = styled.div`
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0 auto;
  padding: 0 0 0 0;
  overflow: hidden;
`;
const MobilePanel = styled.div`
  background: #232837;
  border-radius: 10px;
  box-shadow: 0 1px 4px #0002;
  margin: 0 0 4px 0;
  padding: 8px 6px 6px 6px;
  width: 100%;
  overflow: auto;
`;
const MobileMapRoomPanel = styled(MobilePanel)`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  max-height: 170px;
  padding: 6px 4px 4px 4px;
`;
const MobileChat = styled.div`
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #232837;
  border-radius: 10px 10px 0 0;
  box-shadow: 0 -2px 8px #0002;
  margin: 0;
  padding: 0;
`;
const MobileChatMessages = styled.div`
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 8px 0 8px;
  font-size: 1.18rem;
  background: #232837;
`;
const MobileChatInput = styled.form`
  display: flex;
  gap: 10px;
  padding: 10px 8px 10px 8px;
  background: #232837;
`;
const MobileTabs = styled.div`
  display: flex;
  justify-content: space-between;
  background: #232837;
  border-radius: 8px;
  margin: 0 0 2px 0;
  padding: 1px 1px;
  gap: 3px;
`;
const TabButton = styled(Button)`
  flex: 1 1 0;
  border-radius: 6px !important;
  font-size: 0.97rem;
  font-weight: bold;
  background: ${({ $active }) => $active ? '#7ecfff' : '#232837'} !important;
  color: ${({ $active }) => $active ? '#181c24' : '#7ecfff'} !important;
  border: 2px solid ${({ $active }) => $active ? '#7ecfff' : '#232837'};
  box-shadow: none !important;
  transition: background 0.18s, color 0.18s;
  padding: 6px 0 !important;
`;
const MobileContent = styled(MobilePanel)`
  min-height: 90px;
  max-height: 140px;
  overflow-y: auto;
  margin-bottom: 0;
  padding: 6px 4px 4px 4px;
`;

// 명령어 목록을 상단에 상수로 선언하여 중복을 방지
const commandList = [
  { cmd: '/전 <메시지>', desc: '전체 채팅(축약)' },
  { cmd: '<메시지>', desc: '지역 채팅(명령어 없이 입력)' },
  { cmd: '/동 /서 /남 /북', desc: '방향 이동(오른쪽/왼쪽/아래/위, 또는 맵 터치)' },
  { cmd: '/누구', desc: '현재 접속중인 플레이어 목록 보기' },
  { cmd: '/장착 <아이템명>', desc: '장비 장착' },
  { cmd: '/해제 무기, /해제 방어구', desc: '장비 해제' },
  { cmd: '/정보', desc: '내 능력치 확인' },
  { cmd: '/정보 <닉네임>', desc: '다른 유저 능력치 확인' },
  { cmd: '/귓 <닉네임> <메시지>', desc: '귓속말(비공개 메시지)' },
  { cmd: '/귀환', desc: '1번 마을(마을 광장)으로 귀환' },
  { cmd: '/장비', desc: '내 장비 정보' },
  { cmd: '/지도', desc: '전체 맵 보기' },
  { cmd: '/텔포 <지역>', desc: '월드 이동(예: 무인도, 마을)' },
  { cmd: '/길 <메시지>', desc: '길드 채팅' },
  { cmd: '/길드 <생성|가입|수락|탈퇴|추방|공지|정보|목록|해체(길드장)> ...', desc: '길드 관련 명령어' },
  { cmd: '/랭킹', desc: 'TOP 10 스탯 랭킹' },
  { cmd: '/방명록', desc: '방명록(글 목록/쓰기)' },
  { cmd: '/비밀번호변경', desc: '비밀번호 변경' },
  { cmd: '/도움말', desc: '명령어 전체 안내' },
];

export default function GameMobileMain({
  room, mapSize, mapInfo, handleMove, nearbyRooms,
  chatLogMessages, guildChatLogMessages, chatEndRef, handleSend, input, setInput,
  allMessages,
  UI_LABELS, name, character, inventory, handlePickup, handleAttack, handleLogout,
  expEventActive
}) {
  // 탭 상태: room(방정보), info(내정보), inv(인벤), chat(채팅)
  const [tab, setTab] = useState('room');
  const [chatTab, setChatTab] = useState('all');
  const [showPatchNote, setShowPatchNote] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // 방 아이템/몬스터 렌더 함수
  const renderRoomItems = () => <RoomItems room={room} onPickup={handlePickup} />;
  const renderRoomMonsters = () => <RoomMonsters room={room} onAttack={handleAttack} />;

  // 채팅 전송 핸들러 확장
  const handleSendWithPasswordChange = useCallback((e) => {
    if (e) e.preventDefault();
    if (input.trim() === '/비밀번호변경') {
      setShowPasswordChange(true);
      setInput('');
      return;
    }
    if (input.trim() === '/도움말') {
      setShowHelp(true);
      setInput('');
      return;
    }
    if (typeof handleSend === 'function') handleSend(e);
  }, [input, setInput, handleSend]);

  return (
    <MobileRoot>
      <MobileHeader>
        <MobileTitle>그리머드RPG</MobileTitle>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            variant="secondary"
            size="sm"
            style={{ verticalAlign: 'middle', padding: '6px 10px', fontSize: '1.18rem', color: '#ffe066' }}
            aria-label="패치노트"
            onClick={() => setShowPatchNote(true)}
          >📢</Button>
          <Button className="mobile-logout" onClick={handleLogout} size="sm">로그아웃</Button>
        </span>
      </MobileHeader>
      {showPatchNote && (
        <Modal open={showPatchNote} onClose={() => setShowPatchNote(false)} title="패치노트">
          <PatchNoteTabs />
        </Modal>
      )}
      <MobileMain>
        <MobileMapRoomPanel>
          <MiniMap room={room} mapSize={mapSize} mapInfo={mapInfo} onMove={handleMove} nearbyRooms={nearbyRooms} world={mapInfo?.world} />
        </MobileMapRoomPanel>
        <MobileTabs>
          <TabButton $active={tab === 'room'} onClick={() => setTab('room')}>방정보</TabButton>
          <TabButton $active={tab === 'info'} onClick={() => setTab('info')}>내정보</TabButton>
          <TabButton $active={tab === 'inv'} onClick={() => setTab('inv')}>인벤</TabButton>
          <TabButton $active={tab === 'chat'} onClick={() => setTab('chat')}>채팅</TabButton>
        </MobileTabs>
        <MobileContent>
          {tab === 'room' && <RoomInfo room={room} renderRoomItems={renderRoomItems} renderRoomMonsters={renderRoomMonsters} />}
          {tab === 'info' && <CharacterInfo name={name} room={room} character={character} />}
          {tab === 'inv' && <Inventory inventory={inventory} gold={character?.gold} />}
          {tab === 'chat' && <ChatOnlyBox
            messages={chatTab === 'guild' ? guildChatLogMessages : chatLogMessages}
            tab={chatTab}
            setTab={setChatTab}
          />}
        </MobileContent>
        <MobileChat>
          <MobileChatMessages>
            <ChatBox messages={allMessages} chatEndRef={chatEndRef} expEventActive={expEventActive} />
          </MobileChatMessages>
          <MobileChatInput onSubmit={handleSendWithPasswordChange} autoComplete="off">
            <Input
              className="chat-input"
              placeholder={UI_LABELS?.CHAT_PLACEHOLDER || '명령어 또는 채팅 입력...'}
              aria-label="채팅 입력"
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{ fontSize: '1.15rem', padding: '8px 10px' }}
            />
            <Button className="send-btn" type="submit" aria-label="전송" size="md" style={{ fontSize: '1.1rem', padding: '8px 16px' }}>{UI_LABELS?.SEND || '전송'}</Button>
            <Button
              type="button"
              style={{
                marginLeft: 6,
                fontWeight: 'normal',
                fontSize: '1.1rem',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'none',
                border: 'none',
                color: '#2196f3',
                minWidth: 0,
                boxShadow: 'none',
                padding: 0,
                lineHeight: '28px',
                cursor: 'pointer',
              }}
              aria-label="명령어 안내"
              onClick={() => setShowHelp(true)}
            >
              ?
            </Button>
          </MobileChatInput>
        </MobileChat>
      </MobileMain>
      <PasswordChangeModal
        open={showPasswordChange}
        onClose={() => setShowPasswordChange(false)}
        onSubmit={async () => ({ success: true })} // 임시 성공 처리
      />
      <Modal open={showHelp} onClose={() => setShowHelp(false)} title="명령어 안내">
        <div style={{ maxHeight: 380, overflowY: 'auto', width: 320 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.02rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #444' }}>
                <th style={{ textAlign: 'left', padding: '6px 4px', color: '#ffe066' }}>명령어</th>
                <th style={{ textAlign: 'left', padding: '6px 4px', color: '#7ecfff' }}>설명</th>
              </tr>
            </thead>
            <tbody>
              {commandList.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '6px 4px' }}>{c.cmd}</td>
                  <td style={{ padding: '6px 4px' }}>{c.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 18, color: '#aaa', fontSize: '0.98rem', textAlign: 'center' }}>
            <b>Tip:</b> 명령어는 채팅창에 직접 입력하세요.
          </div>
        </div>
      </Modal>
      <style>{`
        .patchnote-scroll {
          scrollbar-width: thin;
          scrollbar-color: #7ecfff #23272f;
        }
        .patchnote-scroll::-webkit-scrollbar {
          width: 8px;
          background: #23272f;
          border-radius: 8px;
        }
        .patchnote-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(120deg, #7ecfff 60%, #4fa3e3 100%);
          border-radius: 8px;
          min-height: 40px;
        }
        .patchnote-scroll::-webkit-scrollbar-thumb:hover {
          background: #4fa3e3;
        }
      `}</style>
    </MobileRoot>
  );
}

function PatchNoteTabs() {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/readme.txt')
      .then(res => res.text())
      .then(text => {
        // ---로 구분된 블록 분리
        const blocks = text.split(/^-{3,}$/m).map(b => b.trim()).filter(Boolean);
        const notesArr = blocks.map(block => {
          const lines = block.split('\n');
          return {
            title: lines[0],
            content: lines.slice(1).join('\n').trim()
          };
        });
        setNotes(notesArr);
      })
      .catch(() => setError('패치노트 불러오기 실패'));
  }, []);

  if (error) return <div style={{ color: '#ff7e7e', textAlign: 'center', margin: '32px 0' }}>{error}</div>;
  if (!notes.length) return <div style={{ color: '#aaa', textAlign: 'center', margin: '32px 0' }}>패치노트 불러오는 중...</div>;

  return (
    <div style={{ width: '100%', minWidth: 220, maxWidth: 480 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          gap: 4,
          marginBottom: 18,
          justifyContent: 'flex-start',
          scrollbarWidth: 'thin',
          scrollbarColor: '#7ecfff #23272f',
          padding: '0 8px',
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: 480,
        }}
      >
        {notes.map((note, idx) => (
          <button
            key={idx}
            onClick={() => setSelected(idx)}
            style={{
              background: selected === idx ? '#ffe066' : '#232837',
              color: selected === idx ? '#232837' : '#ffe066',
              border: 'none',
              borderRadius: 8,
              padding: '7px 12px',
              fontWeight: 'bold',
              fontSize: '1.01rem',
              cursor: 'pointer',
              boxShadow: selected === idx ? '0 2px 8px #ffe06644' : '0 1px 4px #0002',
              transition: 'all 0.15s',
              marginBottom: 2,
              minWidth: 70,
              whiteSpace: 'nowrap',
              flex: '0 0 auto',
            }}
          >
            {note.title}
          </button>
        ))}
      </div>
      <div className="patchnote-scroll" style={{ background: '#232837', borderRadius: 12, padding: '18px 12px', minHeight: 80, maxHeight: 220, overflowY: 'auto', color: '#ffe066', fontWeight: 500, fontSize: '1.01rem', boxShadow: '0 1px 8px #0002', lineHeight: 1.7 }}>
        <div style={{ whiteSpace: 'pre-line', color: '#ffe066', fontSize: '1.01rem' }}>{notes[selected].content}</div>
      </div>
    </div>
  );
} 