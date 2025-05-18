const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 7,
    match: [/^[A-Za-z0-9가-힣]+$/, '닉네임은 2~7자, 한글/영문/숫자만 가능합니다. (공백, 특수문자 불가)']
  },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  createdIp: { type: String },
  lastLoginIp: { type: String },
  lastLoginAt: { type: Date },
  banned: { type: Boolean, default: false }
});
module.exports = mongoose.model('User', UserSchema); 