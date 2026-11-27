// backend/src/server.js
import app from './app.js';
import { ENV } from './config/env.js';
import { connectPrisma } from './config/prisma.js';

async function bootstrap() {
  try {
    // 1. Kết nối Prisma ORM trực tiếp tới Microsoft SQL Server
    await connectPrisma();

    // 2. Khởi chạy Express Server
    const PORT = ENV.PORT;
    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 TOEIC Master Backend API đang chạy tại: http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth API:     http://localhost:${PORT}/api/v1/auth`);
      console.log(`📚 Courses API:  http://localhost:${PORT}/api/v1/courses`);
      console.log(`🎓 Learning API: http://localhost:${PORT}/api/v1/learning`);
      console.log(`📝 Exams API:    http://localhost:${PORT}/api/v1/exams`);
      console.log(`💳 Orders API:   http://localhost:${PORT}/api/v1/orders`);
      console.log(`💬 Support API:  http://localhost:${PORT}/api/v1/support`);
      console.log(`🛡️ Admin API:    http://localhost:${PORT}/api/v1/admin`);
      console.log(`👨‍🏫 Teacher API:  http://localhost:${PORT}/api/v1/teacher`);
      console.log(`💾 CSDL:         Microsoft SQL Server (Prisma ORM)`);
      console.log(`=======================================================`);
    });

    server.on('error', (err) => {
      console.error(`[Server Error] Không thể mở cổng ${PORT}:`, err.message);
      if (err.code === 'EADDRINUSE') {
        console.error(`Cổng ${PORT} đang bị chiếm dụng. Vui lòng kiểm tra file .env`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Không thể khởi động Backend Server:', error);
    process.exit(1);
  }
}

bootstrap();
