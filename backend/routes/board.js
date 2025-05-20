const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const BoardPost = require('../models/BoardPost');

// 사용자별 마지막 글쓰기 시간 저장
const lastPostTime = {}; // key: username, value: timestamp(ms)

// 사용자별 마지막 댓글 작성 시간 저장
const lastCommentTime = {}; // key: username, value: timestamp(ms)

// 글 목록 (카테고리별)
router.get('/', auth, async (req, res) => {
  const { category, skip = 0, limit = 20 } = req.query;
  const filter = { deleted: false };
  if (category) filter.category = category;
  const posts = await BoardPost.find(filter)
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit));
  const total = await BoardPost.countDocuments(filter);
  res.json({ success: true, posts, total });
});

// 글 작성
router.post('/', auth, async (req, res) => {
  const { title, content, category = 'free' } = req.body;
  if (!title || !content) return res.status(400).json({ success: false, message: '제목/내용 필수' });
  if (title.length > 40) return res.status(400).json({ success: false, message: '제목은 40자 이내로 입력하세요.' });
  if (content.length > 2000) return res.status(400).json({ success: false, message: '내용은 2000자 이내로 입력하세요.' });
  // 도배 방지: 30초에 1번만 허용
  const now = Date.now();
  const userKey = req.user.username;
  if (lastPostTime[userKey] && now - lastPostTime[userKey] < 30000) {
    return res.status(429).json({ success: false, message: '30초에 1번만 글을 쓸 수 있습니다.' });
  }
  lastPostTime[userKey] = now;
  // 공지글은 admin만 작성 가능
  if (category === 'notice' && req.user.username !== 'admin') {
    return res.status(403).json({ success: false, message: '공지글은 admin만 작성할 수 있습니다.' });
  }
  const post = await BoardPost.create({
    author: req.user.username,
    title,
    content,
    category,
    createdAt: new Date(),
    updatedAt: new Date(),
    comments: [],
    deleted: false
  });
  res.json({ success: true, post });
});

// 글 읽기
router.get('/:id', auth, async (req, res) => {
  const post = await BoardPost.findOne({ _id: req.params.id, deleted: false });
  if (!post) return res.status(404).json({ success: false, message: '글 없음' });
  res.json({ success: true, post });
});

// 글 삭제
router.delete('/:id', auth, async (req, res) => {
  const post = await BoardPost.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: '글 없음' });
  if (post.author !== req.user.username && req.user.username !== 'admin') return res.status(403).json({ success: false, message: '본인 또는 admin만 삭제 가능' });
  await BoardPost.deleteOne({ _id: req.params.id });
  res.json({ success: true });
});

// 글 수정
router.put('/:id', auth, async (req, res) => {
  const post = await BoardPost.findById(req.params.id);
  if (!post || post.deleted) return res.status(404).json({ success: false, message: '글 없음' });
  if (post.author !== req.user.username) return res.status(403).json({ success: false, message: '본인 글만 수정 가능' });
  const { title, content } = req.body;
  if (title) post.title = title;
  if (content) post.content = content;
  post.updatedAt = new Date();
  await post.save();
  res.json({ success: true, post });
});

// 댓글 추가
router.post('/:id/comments', auth, async (req, res) => {
  const post = await BoardPost.findOne({ _id: req.params.id, deleted: false });
  if (!post) return res.status(404).json({ success: false, message: '글 없음' });
  const { content } = req.body;
  if (!content) return res.status(400).json({ success: false, message: '내용 필수' });
  if (content.length > 200) return res.status(400).json({ success: false, message: '댓글은 200자 이내로 입력하세요.' });
  // 도배 방지: 10초에 1번만 허용
  const now = Date.now();
  const userKey = req.user.username;
  if (lastCommentTime[userKey] && now - lastCommentTime[userKey] < 10000) {
    return res.status(429).json({ success: false, message: '10초에 1번만 댓글을 쓸 수 있습니다.' });
  }
  lastCommentTime[userKey] = now;
  const comment = {
    id: (post.comments?.length || 0) + 1,
    author: req.user.username,
    content,
    createdAt: new Date(),
    deleted: false
  };
  post.comments.push(comment);
  await post.save();
  res.json({ success: true, comment });
});

// 댓글 삭제
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  const post = await BoardPost.findOne({ _id: req.params.id, deleted: false });
  if (!post) return res.status(404).json({ success: false, message: '글 없음' });
  const comment = post.comments.find(c => c.id === Number(req.params.commentId));
  if (!comment || comment.deleted) return res.status(404).json({ success: false, message: '댓글 없음' });
  if (comment.author !== req.user.username) return res.status(403).json({ success: false, message: '본인 댓글만 삭제 가능' });
  comment.deleted = true;
  await post.save();
  res.json({ success: true });
});

module.exports = router; 