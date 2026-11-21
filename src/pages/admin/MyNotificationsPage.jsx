// src/pages/admin/MyNotificationsPage.jsx
import { useState, useMemo, useEffect } from 'react';
import {
  CheckCheck,
  Search,
  Trash2,
  Mail,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  Inbox,
  Bell,
  Clock,
  Layers,
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import EmptyState from '../../components/shared/EmptyState';
import { useNotifications } from '../../context/NotificationContext';
import { useToastContext } from '../../contexts/ToastContext';

export default function MyNotificationsPage() {
  const {
    notifications,
    unreadCount,
    totalCount,
    markAsRead,
    markAsUnread,
    toggleRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const toast = useToastContext();

  // State quản lý tab, tìm kiếm, mở rộng dòng và modal xóa
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Lọc thông báo theo tab và tìm kiếm
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Lọc theo Tab
      if (activeTab === 'unread' && item.read) {
        return false;
      }
      // Lọc theo ô tìm kiếm (tiêu đề hoặc nội dung)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(query);
        const matchContent = item.content?.toLowerCase().includes(query);
        return matchTitle || matchContent;
      }
      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  // Reset trang về 1 khi chuyển tab hoặc thay đổi từ khóa tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Đảm bảo currentPage không vượt quá totalPages khi danh sách bị xóa bớt
  const totalItems = filteredNotifications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Cắt danh sách theo phân trang 10 dòng mỗi trang
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredNotifications.slice(start, start + pageSize);
  }, [filteredNotifications, currentPage, pageSize]);

  // Xử lý khi bấm vào 1 dòng: Mở rộng hiển thị đầy đủ và tự đánh dấu đã đọc nếu chưa đọc
  const handleRowClick = (item) => {
    // Mở rộng hoặc thu gọn
    setExpandedId((prev) => (prev === item.id ? null : item.id));

    // Tự đánh dấu đã đọc nếu chưa đọc
    if (!item.read) {
      markAsRead(item.id);
    }
  };

  // Xác nhận xóa thông báo
  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteNotification(itemToDelete.id);
      toast.success('Đã xóa thông báo thành công');
      if (expandedId === itemToDelete.id) {
        setExpandedId(null);
      }
      setConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  // Xử lý nút "Đánh dấu tất cả đã đọc"
  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    markAllAsRead();
    toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Tiêu đề & mô tả trang */}
      <PageHeader
        title="Thông báo của tôi"
        subtitle="Các thông báo gửi đến tài khoản quản trị của bạn"
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={CheckCheck}
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="shadow-sm"
          >
            Đánh dấu tất cả đã đọc
          </Button>
        }
      />

      {/* Thanh Tabs và Ô tìm kiếm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-3">
        {/* Hai Tab: Tất cả (n) và Chưa đọc (n) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            <Layers className="h-4 w-4" />
            <span>Tất cả</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${activeTab === 'unread'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            <Bell className="h-4 w-4" />
            <span>Chưa đọc</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'unread'
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              {unreadCount}
            </span>
          </button>
        </div>

        {/* Ô tìm kiếm theo tiêu đề/nội dung */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, nội dung..."
            className="
              w-full pl-10 pr-4 py-2 text-sm rounded-xl
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              border border-gray-300 dark:border-gray-700
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              shadow-sm transition-colors
            "
          />
        </div>
      </div>

      {/* Danh sách thông báo trong một Card */}
      <Card padding={false} className="overflow-hidden">
        {paginatedNotifications.length === 0 ? (
          <div className="py-12 px-4">
            {activeTab === 'unread' ? (
              <EmptyState
                icon={CheckCircle2}
                title="Không còn thông báo chưa đọc"
                description={
                  searchQuery.trim()
                    ? 'Không có thông báo chưa đọc nào phù hợp với từ khóa tìm kiếm.'
                    : 'Tuyệt vời! Bạn đã xem hết tất cả thông báo.'
                }
              />
            ) : (
              <EmptyState
                icon={Inbox}
                title={searchQuery.trim() ? 'Không tìm thấy thông báo' : 'Bạn chưa có thông báo nào'}
                description={
                  searchQuery.trim()
                    ? 'Không có thông báo nào khớp với từ khóa tìm kiếm của bạn.'
                    : 'Hiện tại hộp thư thông báo của bạn chưa có dữ liệu nào.'
                }
              />
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {paginatedNotifications.map((item) => {
              const isExpanded = expandedId === item.id;
              const isUnread = !item.read;

              return (
                <div
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className={`
                    group relative flex flex-col p-4 sm:p-5 transition-all duration-200 cursor-pointer
                    ${isUnread
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/25 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50/90 dark:hover:bg-gray-750'
                    }
                  `}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Chấm xanh bên trái nếu chưa đọc */}
                    <div className="pt-1.5 shrink-0">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full transition-all ${
                          isUnread
                            ? 'bg-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-900/50'
                            : 'bg-transparent'
                        }`}
                      />
                    </div>

                    {/* Nội dung thông báo */}
                    <div className="min-w-0 flex-1">
                      {/* Tiêu đề & Thời gian / Nút thao tác hover */}
                      <div className="flex items-start justify-between gap-3">
                        <h3
                          className={`text-sm sm:text-base leading-snug transition-colors ${
                            isUnread
                              ? 'font-bold text-gray-900 dark:text-gray-100'
                              : 'font-normal text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {item.title}
                        </h3>

                        {/* Thời gian hiển thị mặc định + 2 nút thao tác khi hover */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* 2 nút nhỏ hiện khi hover: Đánh dấu đã đọc/chưa đọc và Xóa */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-150">
                            {/* Nút Đánh dấu đã đọc / chưa đọc (đổi qua lại) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRead(item.id);
                                toast.info(
                                  item.read ? 'Đã đánh dấu là chưa đọc' : 'Đã đánh dấu là đã đọc'
                                );
                              }}
                              title={item.read ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm transition-colors"
                            >
                              {item.read ? (
                                <Mail className="h-4 w-4" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              )}
                            </button>

                            {/* Nút Xóa (có ConfirmDialog) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setItemToDelete(item);
                                setConfirmOpen(true);
                              }}
                              title="Xóa thông báo"
                              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Thời gian dạng dd/MM/yyyy HH:mm */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap pl-1">
                            <Clock className="h-3.5 w-3.5 hidden sm:inline" />
                            <span>{item.time}</span>
                          </div>

                          {/* Icon mở rộng / thu gọn */}
                          <div className="text-gray-400 dark:text-gray-500 ml-1">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nội dung rút gọn tối đa 2 dòng khi chưa mở rộng / đầy đủ khi mở rộng */}
                      <div className="mt-1.5">
                        {!isExpanded ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {item.content}
                          </p>
                        ) : (
                          <div className="space-y-3 pt-1">
                            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                              {item.content}
                            </p>

                            {/* Chi tiết phụ hiển thị khi mở rộng */}
                            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700/60">
                              <span>
                                Mã thông báo: <strong className="font-medium text-gray-700 dark:text-gray-300">{item.id}</strong>
                              </span>
                              {item.priority && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1.5">
                                    <span>Độ ưu tiên:</span>
                                    <Badge
                                      variant={
                                        item.priority === 'Cao'
                                          ? 'danger'
                                          : item.priority === 'Trung bình'
                                          ? 'warning'
                                          : 'default'
                                      }
                                      size="sm"
                                    >
                                      {item.priority}
                                    </Badge>
                                  </div>
                                </>
                              )}
                              <span>•</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                                {isUnread ? 'Vừa đánh dấu đã đọc' : 'Đã đọc'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Phân trang 10 dòng mỗi trang */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400 px-1">
          <div>
            Hiển thị{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {Math.min((currentPage - 1) * pageSize + 1, totalItems)}–{Math.min(currentPage * pageSize, totalItems)}
            </span>{' '}
            trong{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {totalItems}
            </span>{' '}
            thông báo
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang đầu"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`
                    w-8 h-8 rounded-lg text-sm font-medium transition-colors
                    ${p === currentPage
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang cuối"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ConfirmDialog khi xóa thông báo */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa thông báo"
        description={
          itemToDelete
            ? `Bạn có chắc chắn muốn xóa thông báo "${itemToDelete.title}" không? Hành động này không thể hoàn tác.`
            : 'Bạn có chắc chắn muốn xóa thông báo này không?'
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="danger"
      />
    </div>
  );
}
