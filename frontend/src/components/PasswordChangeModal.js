import React, { useState } from 'react';
import Modal from './Modal';
import styled from 'styled-components';

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 16px;
  border-radius: 8px;
  border: 1px solid #444;
  background: #232837;
  color: #fff;
  font-size: 1rem;
`;
const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  justify-content: flex-end;
`;
const ErrorMsg = styled.div`
  color: #ff5c5c;
  margin-bottom: 10px;
  font-size: 0.98rem;
`;
const SuccessMsg = styled.div`
  color: #4caf50;
  margin-bottom: 10px;
  font-size: 0.98rem;
`;

function PasswordChangeModal({ open, onClose, onSubmit }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      setError('모든 항목을 입력하세요.'); return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError('새 비밀번호가 일치하지 않습니다.'); return;
    }
    if (newPassword.length < 4) {
      setError('새 비밀번호는 4자 이상이어야 합니다.'); return;
    }
    setLoading(true);
    try {
      const accessToken = localStorage.getItem('jwtToken');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          newPasswordConfirm,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess('비밀번호가 성공적으로 변경되었습니다!');
        setCurrentPassword('');
        setNewPassword('');
        setNewPasswordConfirm('');
        if (onSubmit) onSubmit({ success: true });
      } else {
        setError(result?.error || result?.message || '비밀번호 변경에 실패했습니다.');
        if (onSubmit) onSubmit({ success: false, message: result?.error || result?.message });
      }
    } catch (err) {
      setError('비밀번호 변경에 실패했습니다.');
      if (onSubmit) onSubmit({ success: false, message: '비밀번호 변경에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="비밀번호 변경">
      <form style={{ width: '100%', maxWidth: 320 }} onSubmit={handleSubmit}>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        {success && <SuccessMsg>{success}</SuccessMsg>}
        <Input
          type="password"
          placeholder="현재 비밀번호"
          autoComplete="current-password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          disabled={loading}
        />
        <Input
          type="password"
          placeholder="새 비밀번호"
          autoComplete="new-password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          disabled={loading}
        />
        <Input
          type="password"
          placeholder="새 비밀번호 확인"
          autoComplete="new-password"
          value={newPasswordConfirm}
          onChange={e => setNewPasswordConfirm(e.target.value)}
          disabled={loading}
        />
        <ButtonRow>
          <button type="button" onClick={onClose} disabled={loading} style={{ padding: '8px 18px', borderRadius: 8, background: '#444', color: '#fff', border: 'none' }}>취소</button>
          <button type="submit" disabled={loading} style={{ padding: '8px 18px', borderRadius: 8, background: '#4caf50', color: '#fff', border: 'none', fontWeight: 'bold' }}>{loading ? '변경 중...' : '확인'}</button>
        </ButtonRow>
      </form>
    </Modal>
  );
}

export default PasswordChangeModal; 