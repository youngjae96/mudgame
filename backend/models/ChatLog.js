const mongoose = require('mongoose');

const ChatLogSchema = new mongoose.Schema({
  name: String,
  message: String,
  time: { type: Date, default: Date.now },
  type: { type: String, default: 'chat' },
  chatType: { type: String, default: 'global' },
});

module.exports = mongoose.model('ChatLog', ChatLogSchema); 