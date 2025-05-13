const mongoose = require('mongoose');

const GuildSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // 길드명
  master: { type: String, required: true }, // 길드장(유저명)
  members: { type: [String], default: [] }, // 길드원(유저명 배열)
  notice: { type: String, default: '' }, // 길드 공지
  joinRequests: { type: [String], default: [] }, // 가입 신청자(유저명 배열)
  createdAt: { type: Date, default: Date.now },
  chatLog: { type: [{ name: String, message: String, time: Date }], default: [] }, // 길드 채팅 로그(최대 15개)
  lastMasterChange: { type: Date, default: Date.now },
  joinType: { type: String, enum: ['free', 'approval'], default: 'free' },
});

module.exports = mongoose.model('Guild', GuildSchema); 