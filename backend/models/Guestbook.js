const mongoose = require('mongoose');

const GuestbookSchema = new mongoose.Schema({
  name: { type: String, required: true }, // 작성자 닉네임
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  ip: { type: String }, // 도배 방지용(선택)
  type: { type: String, enum: ['guestbook', 'notice'], default: 'guestbook' }, // guestbook/notice 구분
});

module.exports = mongoose.model('Guestbook', GuestbookSchema); 