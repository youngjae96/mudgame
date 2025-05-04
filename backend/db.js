const mongoose = require('mongoose');

// 환경변수에 MONGODB_URI가 있으면(운영), 없으면(로컬) 기본값 사용
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mudgame';

mongoose.connect(mongoUri, {
  // 최신 mongoose에서는 useNewUrlParser, useUnifiedTopology 옵션이 필요 없음
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
}); 