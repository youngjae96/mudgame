const mongoose = require('mongoose');

// 환경변수에 MONGODB_URI가 있으면(운영), 없으면(로컬) 기본값 사용
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mudgame';

async function connectWithRetry() {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    setTimeout(connectWithRetry, 5000); // 5초 후 재시도
  }
}
connectWithRetry();

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.error('MongoDB disconnected! 재연결 시도...');
  connectWithRetry();
});
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected!');
}); 