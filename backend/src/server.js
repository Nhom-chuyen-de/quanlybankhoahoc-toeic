import app from './app.js';
import { ENV } from './config/env.js';
import { connectDB, mockDatabase } from './config/db.js';
import { initSeedData } from './config/seedData.js';

async function bootstrap() {
  try {
    // 1. Khởi tạo dữ liệu mẫu seedData
    await initSeedData(mockDatabase);

    // 2. Kết nối CSDL SQL Server (có cơ chế fallback tự động)
    await connectDB();

    // 3. Khởi chạy Express Server
    const PORT = ENV.PORT;
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 TOEIC Master Backend API đang chạy tại: http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth API:     http://localhost:${PORT}/api/v1/auth`);
      console.log(`📚 Courses API:  http://localhost:${PORT}/api/v1/courses`);
      console.log(`🎓 Learning API: http://localhost:${PORT}/api/v1/learning`);
      console.log(`📝 Exams API:    http://localhost:${PORT}/api/v1/exams`);
      console.log(`💳 Orders API:   http://localhost:${PORT}/api/v1/orders`);
      console.log(`💬 Support API:  http://localhost:${PORT}/api/v1/support`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Không thể khởi động Backend Server:', error);
    process.exit(1);
  }
}

bootstrap();
