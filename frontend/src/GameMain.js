import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import MiniMap from './MiniMap';
import RoomInfo from './RoomInfo';
import RoomItems from './RoomItems';
import RoomMonsters from './RoomMonsters';
import ChatBox from './ChatBox';
import PlayerList from './PlayerList';
import CharacterInfo from './CharacterInfo';
import Button from './components/Button';
import Input from './components/Input';
import Modal from './components/Modal';

const Container = styled.div`
  max-width: 1100px;
  margin: 40px auto;
  background: #232837;
  border-radius: 16px;
  box-shadow: 0 4px 24px #0008;
  padding: 32px 24px 24px 24px;
`;
const MudTitle = styled.div`
  font-size: 2.2rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 32px;
  letter-spacing: 2px;
  color: #7ecfff;
  position: relative;
`;
const MudMain = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 2.8fr 1.1fr;
  gap: 32px;
  align-items: start;
  @media (max-width: 1100px) {
    grid-template-columns: 1fr 2fr 1fr;
  }
  @media (max-width: 800px) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
`;
const LeftPanel = styled.div`
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 24px;
  min-width: 200px;
  max-width: 220px;
`;
const ChatSection = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  min-height: 520px;
  max-height: 600px;
  height: 100%;
  min-width: 320px;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  justify-content: flex-start;
`;
const PlayerListPanel = styled.div`
  flex: none;
  background: #181c24;
  border-radius: 8px;
  padding: 16px;
  max-height: 520px;
  overflow-y: auto;
  box-shadow: 0 2px 8px #0004;
  min-width: 200px;
  max-width: 220px;
`;
/**
 * 게임 메인 화면 컴포넌트
 * @param {object} props - 컴포넌트 props
 * @param {boolean} props.connected - 서버 연결 여부
 * @param {function} props.handleLogout - 로그아웃 핸들러
 * @param {object} props.room - 현재 방 정보
 * @param {number} props.mapSize - 맵 크기
 * @param {object} props.mapInfo - 맵 정보
 * @param {function} props.handleMove - 이동 핸들러
 * @param {Array} props.nearbyRooms - 주변 방 정보
 * @param {Array} props.messages - 채팅 메시지 목록
 * @param {object} props.chatEndRef - 채팅 스크롤 ref
 * @param {function} props.handleSend - 채팅 전송 핸들러
 * @param {string} props.input - 채팅 입력값
 * @param {function} props.setInput - 채팅 입력값 setter
 * @param {object} props.UI_LABELS - UI 라벨 상수
 * @param {Array} props.players - 플레이어 목록
 * @param {string} props.name - 내 닉네임
 * @param {object} props.character - 내 캐릭터 정보
 * @param {Array} props.inventory - 인벤토리 목록
 * @param {function} props.handlePickup - 아이템 줍기 핸들러
 * @param {function} props.handleAttack - 몬스터 공격 핸들러
 * @returns {JSX.Element}
 */
function GameMain({
  connected,
  handleLogout,
  room,
  mapSize,
  mapInfo,
  handleMove,
  nearbyRooms,
  messages,
  chatEndRef,
  handleSend,
  input,
  setInput,
  UI_LABELS,
  players,
  name,
  character,
  inventory,
  handlePickup,
  handleAttack
}) {
  const [showHelp, setShowHelp] = useState(false);

  const commandList = [
    { cmd: '/전체 <메시지>', desc: '전체 채팅' },
    { cmd: '/전 <메시지>', desc: '전체 채팅(축약)' },
    { cmd: '<메시지>', desc: '지역 채팅(명령어 없이 입력)' },
    { cmd: '/동 /서 /남 /북', desc: '방향 이동(오른쪽/왼쪽/아래/위, 또는 맵 터치)' },
    { cmd: '/누구', desc: '현재 접속중인 플레이어 목록 보기' },
    { cmd: '/구매 <아이템명>', desc: '아이템 구매' },
    { cmd: '/판매 <아이템명>', desc: '아이템 판매' },
    { cmd: '/장착 <아이템명>', desc: '장비 장착 (예: /장착 나무검, 옵션: +공 2)' },
    { cmd: '/해제 <아이템명>', desc: '장비 해제' },
    { cmd: '/정보', desc: '내 능력치 확인' },
    { cmd: '/장비', desc: '내 장비 정보' },
    { cmd: '/지도', desc: '전체 맵 보기' },
    { cmd: '/텔포 <지역>', desc: '월드 이동(예: 무인도, 마을)' },
    { cmd: '/도움말', desc: '명령어 전체 안내' },
    { cmd: '/저장', desc: '내 상태 즉시 저장' },
  ];

  // 방 아이템 UI 분리
  const renderRoomItems = useCallback(() => <RoomItems room={room} onPickup={handlePickup} />, [room, handlePickup]);
  // 방 몬스터 UI 분리
  const renderRoomMonsters = useCallback(() => <RoomMonsters room={room} onAttack={handleAttack} />, [room, handleAttack]);
  const renderCharacterInfo = useCallback(() => <CharacterInfo name={name} room={room} character={character} />, [name, room, character]);

  return (
    <>
      <MudTitle>
        그리머드RPG
        <Button className="logout-btn" onClick={handleLogout}>로그아웃</Button>
      </MudTitle>
      {!connected ? (
        <div className="login-box">
          <div style={{ color: '#aaa', marginTop: 16 }}>서버에 연결 중...</div>
        </div>
      ) : (
        <MudMain>
          <LeftPanel>
            <MiniMap room={room} mapSize={mapSize} mapInfo={mapInfo} onMove={handleMove} nearbyRooms={nearbyRooms} world={mapInfo.world} />
            {room && (
              <RoomInfo room={room} renderRoomItems={renderRoomItems} renderRoomMonsters={renderRoomMonsters} />
            )}
          </LeftPanel>
          <ChatSection>
            <ChatBox messages={messages} chatEndRef={chatEndRef} />
            <form className="input-form" onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                className="chat-input"
                placeholder={UI_LABELS.CHAT_PLACEHOLDER}
                aria-label="채팅 입력"
                value={input}
                onChange={e => setInput(e.target.value)}
                autoFocus
              />
              <Button className="send-btn" type="submit" aria-label="전송">{UI_LABELS.SEND}</Button>
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
            </form>
            <div style={{ fontSize: '0.92rem', color: '#aaa', marginTop: 4, marginLeft: 2 }}>
              [채팅 명령어 안내] <b>/전체 전체채팅</b>, <b>/전 전체채팅</b>, <b>메시지만 입력: 지역채팅</b>
            </div>
            <Modal open={showHelp} onClose={() => setShowHelp(false)} title="명령어 안내">
              <div style={{ maxHeight: 380, overflowY: 'auto', width: 360 }}>
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
                        <td style={{ padding: '6px 4px', color: c.cmd.startsWith('/운영자') ? '#ff4e4e' : '#fff' }}>{c.cmd}</td>
                        <td style={{ padding: '6px 4px', color: c.cmd.startsWith('/운영자') ? '#ffb347' : '#aaa' }}>{c.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 18, color: '#aaa', fontSize: '0.98rem', textAlign: 'center' }}>
                  <b>Tip:</b> 명령어는 채팅창에 직접 입력하세요.
                </div>
              </div>
            </Modal>
          </ChatSection>
          <PlayerListPanel>
            <PlayerList players={players} renderCharacterInfo={renderCharacterInfo} inventory={inventory} gold={character?.gold} />
          </PlayerListPanel>
        </MudMain>
      )}
    </>
  );
}

export default GameMain; 