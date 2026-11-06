import { createContext, useContext, useEffect, useState } from 'react';
import { notificationService } from '../services/adminService';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const refresh = async () => {
    const result = await notificationService.list({ page: 1, limit: 100 });
    setNotifications(result.map((item) => ({ ...item, read: item.isRead })));
  };

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) return;
    refresh().catch((error) => console.error('Không tải được thông báo:', error));
  }, []);

  const markAsRead = async (id) => {
    await notificationService.markRead(id);
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item));
  };

  const markAsUnread = async (id) => {
    await notificationService.markUnread(id);
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: false } : item));
  };

  const toggleRead = async (id) => {
    const item = notifications.find((notification) => notification.id === id);
    if (!item) return;
    return item.read ? markAsUnread(id) : markAsRead(id);
  };

  const markAllAsRead = async () => {
    await notificationService.markAllRead();
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  };

  const deleteNotification = async (id) => {
    await notificationService.remove(id);
    setNotifications((items) => items.filter((item) => item.id !== id));
  };

  const value = {
    notifications,
    unreadCount: notifications.filter((item) => !item.read).length,
    totalCount: notifications.length,
    refresh,
    markAsRead,
    markAsUnread,
    toggleRead,
    markAllAsRead,
    deleteNotification,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
