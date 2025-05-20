import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Button from './Button';
import Modal from './Modal';
import Input from './Input';
import api from '../api';

const Overlay = styled.div`
  position: fixed;
  z-index: 9999;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(30,34,44,0.97);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
  @media (max-width: 600px) {
    align-items: stretch;
  }
`;
const BoardPanel = styled.div`
  margin-top: 48px;
  background: #232837;
  border-radius: 18px;
  box-shadow: 0 4px 32px #000a;
  width: 540px;
  max-width: 98vw;
  min-height: 60vh;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  @media (max-width: 600px) {
    width: 100vw;
    min-height: 100vh;
    border-radius: 0;
    margin-top: 0;
  }
`;
const BoardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 10px 24px;
  border-bottom: 1px solid #2e3448;
  font-size: 1.25rem;
  font-weight: bold;
  color: #7ecfff;
`;
const BoardList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 18px 24px;
`;
const PostCard = styled.div`
  background: #232837;
  border-radius: 12px;
  box-shadow: 0 2px 8px #0002;
  margin-bottom: 18px;
  padding: 16px 18px 10px 18px;
  cursor: pointer;
  transition: box-shadow 0.15s;
  &:hover { box-shadow: 0 4px 16px #0004; }
`;
const PostTitle = styled.div`
  font-size: 1.08rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
`;
const PostMeta = styled.div`
  font-size: 0.97rem;
  color: #8ecfff;
  margin-bottom: 2px;
`;
const PostContent = styled.div`
  font-size: 1.01rem;
  color: #c8e0ff;
  margin-bottom: 8px;
  white-space: pre-line;
`;
const WriteBox = styled.div`
  padding: 18px 24px;
  border-bottom: 1px solid #2e3448;
`;
const CommentBox = styled.div`
  background: #232837;
  border-radius: 10px;
  margin-top: 12px;
  padding: 10px 14px;
`;
const Comment = styled.div`
  font-size: 0.98rem;
  color: #b3c6e0;
  margin-bottom: 6px;
`;
const CloseBtn = styled(Button)`
  background: none !important;
  color: #aaa !important;
  font-size: 1.3rem !important;
  box-shadow: none !important;
`;

const CATEGORIES = [
  { key: 'notice', label: '공지' },
  { key: 'free', label: '자유' },
  { key: 'guide', label: '공략' },
];

function BoardModal({ open, onClose, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewPost, setViewPost] = useState(null);
  const [writeMode, setWriteMode] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('free');
  const [tab, setTab] = useState('free');
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const LIMIT = 20;
  const listRef = React.useRef();
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (open) {
      setPosts([]); setSkip(0); setHasMore(true);
      fetchPosts(tab, 0, true);
    }
  }, [open, tab]);

  async function fetchPosts(cat, skipVal = 0, reset = false) {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.get('/api/board', { params: { category: cat, skip: skipVal, limit: LIMIT } });
      const newPosts = res.data.posts || [];
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      setSkip(skipVal + newPosts.length);
      setHasMore((skipVal + newPosts.length) < (res.data.total || 0));
    } catch (e) { /* ignore */ }
    setLoading(false);
  }

  // 무한 스크롤: 스크롤이 끝에 닿으면 추가 로딩
  function handleScroll(e) {
    const el = e.target;
    if (!loading && hasMore && el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      fetchPosts(tab, skip);
    }
  }

  async function handleWrite() {
    if (!title.trim() || !content.trim()) return;
    await api.post('/api/board', { title, content, category });
    setTitle(''); setContent(''); setWriteMode(false);
    fetchPosts(tab);
  }
  async function handleDelete(id) {
    if (!window.confirm('정말 삭제?')) return;
    await api.delete(`/api/board/${id}`);
    setViewPost(null);
    fetchPosts(tab);
  }
  async function handleComment(postId) {
    if (!comment.trim()) return;
    await api.post(`/api/board/${postId}/comments`, { content: comment });
    setComment('');
    fetchPost(postId);
  }
  async function fetchPost(id) {
    const res = await api.get(`/api/board/${id}`);
    setViewPost(res.data.post);
  }
  function handleOpenPost(id) {
    fetchPost(id);
  }
  function handleClosePost() {
    setViewPost(null);
  }
  if (!open) return null;
  return (
    <Overlay>
      <BoardPanel>
        <BoardHeader>
          <div style={{display:'flex',gap:12}}>
            {CATEGORIES.map(cat => (
              <Button key={cat.key} onClick={() => { setTab(cat.key); setViewPost(null); }} theme={tab===cat.key?'primary':'gray'} style={{fontWeight:tab===cat.key?'bold':'normal'}}>{cat.label}</Button>
            ))}
          </div>
          <div>
            <Button onClick={() => setWriteMode(true)} style={{marginRight:8}}>글쓰기</Button>
            <CloseBtn onClick={onClose}>닫기</CloseBtn>
          </div>
        </BoardHeader>
        {writeMode ? (
          <WriteBox>
            <div style={{marginBottom:8}}>
              <select value={category} onChange={e=>setCategory(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:'1px solid #2e3448',background:'#232837',color:'#fff',fontSize:'1rem'}}>
                {CATEGORIES.map(cat =>
                  (cat.key === 'notice' && user?.nickname !== 'admin')
                    ? <option key={cat.key} value={cat.key} disabled>공지 (운영자만)</option>
                    : <option key={cat.key} value={cat.key}>{cat.label}</option>
                )}
              </select>
            </div>
            <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="제목" style={{marginBottom:8}} />
            <Input value={content} onChange={e=>setContent(e.target.value)} placeholder="내용" as="textarea" rows={6} style={{marginBottom:8}} />
            <Button onClick={handleWrite} style={{marginRight:8}}>등록</Button>
            <Button onClick={()=>setWriteMode(false)} theme="gray">취소</Button>
          </WriteBox>
        ) : viewPost ? (
          <BoardList style={{paddingTop:18}}>
            {editMode ? (
              <div>
                <Input value={editTitle} onChange={e=>setEditTitle(e.target.value)} placeholder="제목" style={{marginBottom:8}} />
                <Input value={editContent} onChange={e=>setEditContent(e.target.value)} placeholder="내용" as="textarea" rows={6} style={{marginBottom:8}} />
                <Button onClick={async()=>{
                  await api.put(`/api/board/${viewPost._id}`, { title: editTitle, content: editContent });
                  setEditMode(false);
                  fetchPost(viewPost._id);
                }} style={{marginRight:8}}>저장</Button>
                <Button onClick={()=>setEditMode(false)} theme="gray">취소</Button>
              </div>
            ) : (
              <>
                <PostTitle>{viewPost.title}</PostTitle>
                <PostMeta>{viewPost.author} | {new Date(viewPost.createdAt).toLocaleString()}</PostMeta>
                <PostContent>{viewPost.content}</PostContent>
                {(viewPost.author === user?.nickname || user?.nickname === 'admin') && (
                  <Button onClick={()=>handleDelete(viewPost._id)} theme="red" style={{marginBottom:8}}>삭제</Button>
                )}
                {viewPost.author === user?.nickname && (
                  <Button onClick={()=>{
                    setEditMode(true);
                    setEditTitle(viewPost.title);
                    setEditContent(viewPost.content);
                  }} style={{marginLeft:8,marginBottom:8}}>수정</Button>
                )}
                <Button onClick={handleClosePost} style={{marginBottom:8,marginLeft:8}}>목록</Button>
              </>
            )}
            <CommentBox>
              <div style={{fontWeight:'bold',color:'#7ecfff',marginBottom:6}}>댓글</div>
              {viewPost.comments?.filter(c=>!c.deleted).map(c=>(
                <Comment key={c._id || c.id}><b style={{color:'#ffe066'}}>{c.author}</b>: {c.content} <span style={{fontSize:'0.92em',color:'#888',marginLeft:6}}>{new Date(c.createdAt).toLocaleString()}</span></Comment>
              ))}
              <div style={{display:'flex',gap:8,marginTop:6}}>
                <Input value={comment} onChange={e=>setComment(e.target.value)} placeholder="댓글 입력" style={{flex:1, minWidth:0, width:'auto'}} />
                <Button onClick={()=>handleComment(viewPost._id)} style={{flexShrink:0, minWidth:64}}>등록</Button>
              </div>
            </CommentBox>
          </BoardList>
        ) : (
          <BoardList ref={listRef} onScroll={handleScroll}>
            {loading && posts.length === 0 ? <div>로딩중...</div> : posts.length === 0 ? <div>글이 없습니다.</div> : posts.map(post => (
              <PostCard key={post._id} onClick={()=>handleOpenPost(post._id)}>
                <PostTitle>{post.title}</PostTitle>
                <PostMeta>{CATEGORIES.find(c=>c.key===post.category)?.label || ''} | {post.author} | {new Date(post.createdAt).toLocaleString()}</PostMeta>
                <PostContent>{post.content.slice(0, 80)}{post.content.length > 80 ? '...' : ''}</PostContent>
              </PostCard>
            ))}
            {loading && posts.length > 0 && <div style={{textAlign:'center',color:'#7ecfff',margin:'12px 0'}}>더 불러오는 중...</div>}
            {!hasMore && posts.length > 0 && <div style={{textAlign:'center',color:'#888',margin:'12px 0'}}>모든 글을 불러왔습니다.</div>}
          </BoardList>
        )}
      </BoardPanel>
    </Overlay>
  );
}

export default BoardModal; 