// backend/src/config/prisma.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

let prismaInstance = null;
let prismaConnected = false;

try {
  prismaInstance =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn'] : ['error'],
    });
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;
} catch {
  prismaInstance = null;
}

export const prisma = prismaInstance;

export function isPrismaReady() {
  return Boolean(prismaConnected && prismaInstance);
}

export async function connectPrisma() {
  if (!prismaInstance) {
    prismaConnected = false;
    console.warn('[Database] Chạy ở chế độ In-Memory Store (chưa khởi tạo Prisma Client).');
    return false;
  }
  try {
    await prismaInstance.$connect();
    prismaConnected = true;
    console.log('[Prisma ORM] Đã kết nối thành công tới Microsoft SQL Server (QuanLyDaoTao_HopNhat)!');
    return true;
  } catch {
    prismaConnected = false;
    console.warn('[Database] SQL Server tại localhost:1433 chưa bật — sử dụng In-Memory Store phản hồi tức thì.');
    return false;
  }
}

export default prisma;
