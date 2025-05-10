const mongoose = require('mongoose');

const GuestbookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  message: { type: String, required: true },
  ip: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  type: { type: String, default: 'guestbook' }
});

module.exports = mongoose.model('Guestbook', GuestbookSchema); 