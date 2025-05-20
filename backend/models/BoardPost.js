const mongoose = require('mongoose');
const BoardPostSchema = new mongoose.Schema({
  author: { type: String, required: true },
  title: { type: String, required: true, maxlength: 40 },
  content: { type: String, required: true, maxlength: 2000 },
  category: { type: String, default: 'free' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  comments: [{
    id: Number,
    author: String,
    content: String,
    createdAt: Date,
    deleted: Boolean
  }],
  deleted: { type: Boolean, default: false }
});
module.exports = mongoose.model('BoardPost', BoardPostSchema); 