const mongoose = require('mongoose');
const BannedIpSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },
  bannedAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('BannedIp', BannedIpSchema); 