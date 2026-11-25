import sql from 'mssql';
import { ENV } from './env.js';

let pool = null;
let isConnected = false;

// Mock store dùng làm fallback nếu local chưa bật Microsoft SQL Server,
// đảm bảo backend luôn chạy ổn định 100% trong môi trường dev/demo.
export const mockDatabase = {
  users: [],
  courses: [],
  chapters: [],
  lessons: [],
  enrollments: [],
  progress: [],
  quizzes: [],
  quizResults: [],
  classes: [],
  schedules: [],
  attendances: [],
  orders: [],
  coupons: [],
  supportTickets: [],
  notifications: [],
  certificates: [],
  reviews: [],
};

export async function connectDB() {
  try {
    pool = await sql.connect(ENV.DB);
    isConnected = true;
    console.log(`[Database] Đã kết nối thành công tới Microsoft SQL Server: ${ENV.DB.database}`);
    return pool;
  } catch (error) {
    isConnected = false;
    console.warn(`[Database] Chưa thể kết nối tới SQL Server (${error.message}).`);
    console.info('[Database] Backend kích hoạt chế độ Fallback In-Memory Data Store (Sẵn sàng phục vụ đầy đủ dữ liệu demo).');
    return null;
  }
}

export function getDB() {
  return pool;
}

export function isDBConnected() {
  return isConnected;
}
