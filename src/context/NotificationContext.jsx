// src/context/NotificationContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { mockAdminNotifications } from '../mock/notifications';

const NotificationContext = createContext(null);

const STORAGE_KEY = 'admin_notifications_v1';

export function NotificationProvider({ children }) {
  // TODO: nối API - Lấy danh sách thông báo ban đầu từ GET /api/admin/notifications
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback nếu localStorage bị lỗi parse
    }
    return mockAdminNotifications;
  });

  // Đồng bộ vào localStorage để khi reload trang giữ nguyên trạng thái đọc/xóa
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Bỏ qua lỗi quota storage
    }
  }, [notifications]);

  // Đếm số lượng thông báo chưa đọc
  const unreadCount = notifications.filter((item) => !item.read).length;

  // Đánh dấu một thông báo là đã đọc
  const markAsRead = (id) => {
    // TODO: nối API PATCH /api/admin/notifications/:id/read
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  // Đánh dấu một thông báo là chưa đọc
  const markAsUnread = (id) => {
    // TODO: nối API PATCH /api/admin/notifications/:id/unread
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: false } : item))
    );
  };

  // Đổi trạng thái đã đọc / chưa đọc
  const toggleRead = (id) => {
    // TODO: nối API PATCH /api/admin/notifications/:id/toggle-read
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: !item.read } : item))
    );
  };

  // Đánh dấu tất cả thông báo là đã đọc
  const markAllAsRead = () => {
    // TODO: nối API PUT /api/admin/notifications/mark-all-read
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, read: true }))
    );
  };

  // Xóa một thông báo
  const deleteNotification = (id) => {
    // TODO: nối API DELETE /api/admin/notifications/:id
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const value = {
    notifications,
    unreadCount,
    totalCount: notifications.length,
    markAsRead,
    markAsUnread,
    toggleRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
