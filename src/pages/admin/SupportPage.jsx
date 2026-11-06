// src/pages/admin/SupportPage.jsx
import { useState, useMemo, useEffect } from 'react';
import {
  MessageSquare, Send, Search, LayoutGrid, List,
  Bell, Eye, Phone, Mail, MessageCircle
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import SearchBar from '../../components/shared/SearchBar';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import { useToastContext } from '../../contexts/ToastContext';
import { supportService } from '../../services/adminService';

const statusConfig = {
  new: { label: 'Mới', variant: 'blue', bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  in_progress: { label: 'Đang xử lý', variant: 'yellow', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  resolved: { label: 'Đã xử lý', variant: 'green', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  closed: { label: 'Đã đóng', variant: 'gray', bg: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
};

const priorityConfig = {
  low: { label: 'Thấp', variant: 'gray', dot: 'bg-gray-400' },
  medium: { label: 'Trung bình', variant: 'yellow', dot: 'bg-amber-500' },
  high: { label: 'Cao', variant: 'red', dot: 'bg-rose-500' },
};

const categoryLabels = {
  technical: 'Kỹ thuật',
  account: 'Tài khoản',
  course: 'Khóa học',
  other: 'Khác',
};

export default function SupportPage() {
  const toast = useToastContext();
  const showToast = (msg, type = 'success') => {
    if (typeof toast === 'function') toast(msg, type);
    else if (toast?.showToast) toast.showToast(msg, type);
    else if (type === 'error' && toast?.error) toast.error(msg);
    else if (toast?.success) toast.success(msg);
  };

  // State Tickets
  const [tickets, setTickets] = useState([]);
  const loadTickets = () => supportService.list({ page: 1, limit: 100 }).then((r) => setTickets((r || []).map((t) => ({ ...t, messages: t.messages || [] }))));
  useEffect(() => { loadTickets().catch((e) => showToast(e.message || 'Không tải được yêu cầu hỗ trợ.', 'error')); }, []);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected ticket for Drawer detail
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  // State Broadcast Notifications
  const [broadcasts, setBroadcasts] = useState([]);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [targetClass, setTargetClass] = useState('toeic_650');
  const [channelInApp, setChannelInApp] = useState(true);
  const [channelEmail, setChannelEmail] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.sender.name.toLowerCase().includes(search.toLowerCase()) ||
        t.sender.email.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || t.category === categoryFilter;
      const matchPriority = !priorityFilter || t.priority === priorityFilter;
      const matchStatus = !statusFilter || t.status === statusFilter;
      return matchSearch && matchCategory && matchPriority && matchStatus;
    });
  }, [tickets, search, categoryFilter, priorityFilter, statusFilter]);

  // Handle Send Reply in Drawer
  const openTicket = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const data = await supportService.replies(ticket.id);
      setSelectedTicket({ ...ticket, messages: (data || []).map((m) => ({ id: m.id, content: m.content, sender: m.sender, isUser: !m.isAdmin, time: m.createdAt })) });
    } catch (error) { showToast(error.message || 'Không tải được hội thoại.', 'error'); }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      await supportService.reply(selectedTicket.id, replyMessage.trim());
      if (selectedTicket.status === 'new') await supportService.update(selectedTicket.id, { status: 'in_progress' });
      await loadTickets();
      const data = await supportService.replies(selectedTicket.id);
      setSelectedTicket({ ...selectedTicket, status: selectedTicket.status === 'new' ? 'in_progress' : selectedTicket.status, messages: (data || []).map((m) => ({ id: m.id, content: m.content, sender: m.sender, isUser: !m.isAdmin, time: m.createdAt })) });
      setReplyMessage(''); showToast('Đã gửi phản hồi thành công đến học viên!');
    } catch (error) { showToast(error.message || 'Không gửi được phản hồi.', 'error'); }
  };

  // Handle Change Status / Priority in Drawer
  const handleUpdateTicketMeta = async (field, value) => {
    if (!selectedTicket) return;
    try {
      await supportService.update(selectedTicket.id, { [field]: value });
      const updated = { ...selectedTicket, [field]: value }; setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast(`Đã cập nhật ${field === 'status' ? 'trạng thái' : 'độ ưu tiên'} ticket!`);
    } catch (error) { showToast(error.message || 'Không cập nhật được yêu cầu.', 'error'); }
  };

  // Handle Send Broadcast Notification
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifContent.trim()) {
      showToast('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo', 'error');
      return;
    }

    if (targetAudience === 'class') { showToast('Gửi theo lớp chưa được API hỗ trợ; hãy chọn tất cả người dùng, học viên hoặc giảng viên.', 'error'); return; }
    if (!channelInApp) { showToast('API hiện chỉ gửi thông báo trong ứng dụng.', 'error'); return; }
    try {
      const result = await supportService.broadcast({ title: notifTitle.trim(), content: notifContent.trim(), recipient: ({ all: 'all', role_student: 'student', role_teacher: 'teacher' })[targetAudience] });
      const targetLabel = ({ all: 'Tất cả người dùng', role_student: 'Tất cả học viên', role_teacher: 'Tất cả giảng viên' })[targetAudience];
      setBroadcasts((previous) => [{ id: `sent-${Date.now()}`, title: notifTitle.trim(), content: notifContent.trim(), targetType: targetAudience, targetLabel, channel: 'In-app', recipientCount: result.sent, sentAt: new Date().toLocaleString('vi-VN'), sender: 'Quản trị viên', status: 'success' }, ...previous]);
      setNotifTitle(''); setNotifContent(''); showToast(`Đã gửi thông báo trong ứng dụng tới ${result.sent} người dùng.`);
    } catch (error) { showToast(error.message || 'Không gửi được thông báo.', 'error'); }
  };

  // Table columns definition (Xóa mã TCK-xxxx, giữ (n phản hồi))
  const columns = [
    {
      header: 'Tiêu đề yêu cầu',
      accessor: 'title',
      render: (_, row) => (
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">({row.messages?.length || 0} phản hồi)</span>
          </div>
          <button
            onClick={() => openTicket(row)}
            className="text-left font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1 mt-1 transition-colors"
          >
            {row.title}
          </button>
        </div>
      ),
    },
    {
      header: 'Người gửi',
      accessor: 'sender',
      render: (sender) => (
        <div className="flex items-center gap-2.5">
          <img
            src={sender?.avatar}
            alt={sender?.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700 shrink-0"
          />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
              {sender?.name}
            </p>
            <p className="text-xs text-gray-400 leading-tight mt-0.5">{sender?.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Danh mục',
      accessor: 'category',
      render: (category) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {categoryLabels[category] || category}
        </span>
      ),
    },
    {
      header: 'Độ ưu tiên',
      accessor: 'priority',
      render: (priority) => {
        const p = priorityConfig[priority] || priorityConfig.low;
        return (
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${p.dot}`} />
            <Badge variant={p.variant} size="sm">{p.label}</Badge>
          </div>
        );
      },
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (status) => {
        const s = statusConfig[status] || statusConfig.new;
        return <Badge variant={s.variant} size="sm">{s.label}</Badge>;
      },
    },
    {
      header: 'Ngày tạo',
      accessor: 'createdAt',
      render: (createdAt) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {createdAt}
        </span>
      ),
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openTicket(row)}
          className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
        >
          {row.status === 'closed' ? 'Xem' : 'Xử lý'}
        </Button>
      ),
    },
  ];

  // History broadcast columns
  const broadcastColumns = [
    {
      header: 'Tiêu đề thông báo',
      accessor: 'title',
      render: (_, row) => (
        <div className="max-w-md">
          <p className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{row.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{row.content}</p>
        </div>
      ),
    },
    {
      header: 'Đối tượng nhận',
      accessor: 'targetLabel',
      render: (targetLabel) => (
        <Badge variant="blue" size="sm">{targetLabel}</Badge>
      ),
    },
    {
      header: 'Kênh gửi',
      accessor: 'channel',
      render: (channel) => (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{channel}</span>
      ),
    },
    {
      header: 'Số người nhận',
      accessor: 'recipientCount',
      render: (recipientCount) => (
        <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
          {recipientCount?.toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      header: 'Thời gian gửi',
      accessor: 'sentAt',
      render: (sentAt) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">{sentAt}</span>
      ),
    },
    {
      header: 'Người gửi',
      accessor: 'sender',
      render: (sender) => (
        <span className="text-xs text-gray-600 dark:text-gray-400">{sender}</span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: () => (
        <Badge variant="green" size="sm">Đã gửi thành công</Badge>
      ),
    },
  ];

  // Kanban status groups
  const kanbanColumns = [
    { key: 'new', title: 'Mới tạo', color: 'border-t-blue-500', countBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
    { key: 'in_progress', title: 'Đang xử lý', color: 'border-t-amber-500', countBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
    { key: 'resolved', title: 'Đã xử lý', color: 'border-t-emerald-500', countBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
    { key: 'closed', title: 'Đã đóng', color: 'border-t-gray-400', countBg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  ];

  const mainTabs = [
    {
      key: 'tickets',
      label: 'Yêu cầu hỗ trợ',
      icon: MessageSquare,
      count: filteredTickets.length,
      content: (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
              <div className="w-full sm:w-72">
                <SearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder="Tìm theo tiêu đề, người gửi..."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-40 text-xs"
                >
                  <option value="">Tất cả danh mục</option>
                  <option value="technical">Kỹ thuật</option>
                  <option value="account">Tài khoản</option>
                  <option value="course">Khóa học</option>
                  <option value="other">Khác</option>
                </Select>

                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-36 text-xs"
                >
                  <option value="">Tất cả ưu tiên</option>
                  <option value="high">Cao</option>
                  <option value="medium">Trung bình</option>
                  <option value="low">Thấp</option>
                </Select>

                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-40 text-xs"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="new">Mới</option>
                  <option value="in_progress">Đang xử lý</option>
                  <option value="resolved">Đã xử lý</option>
                  <option value="closed">Đã đóng</option>
                </Select>

                {(search || categoryFilter || priorityFilter || statusFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      setCategoryFilter('');
                      setPriorityFilter('');
                      setStatusFilter('');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Xóa lọc
                  </Button>
                )}
              </div>
            </div>

            {/* Switch Table / Kanban */}
            <div className="flex items-center gap-1 self-end lg:self-auto bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Dạng bảng
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Kanban 4 cột
              </button>
            </div>
          </div>

          {/* View Mode: Table */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <Table
                columns={columns}
                data={filteredTickets}
                pageSize={8}
                emptyText="Không tìm thấy yêu cầu hỗ trợ nào phù hợp"
              />
            </div>
          )}

          {/* View Mode: Kanban */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {kanbanColumns.map((col) => {
                const columnTickets = filteredTickets.filter((t) => t.status === col.key);
                return (
                  <div
                    key={col.key}
                    className={`bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[750px] shadow-sm border-t-4 ${col.color}`}
                  >
                    {/* Header cột */}
                    <div className="p-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                          {col.title}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${col.countBg}`}>
                          {columnTickets.length}
                        </span>
                      </div>
                    </div>

                    {/* Danh sách thẻ ticket (đã xóa TCK-xxxx) */}
                    <div className="p-3 space-y-3 overflow-y-auto flex-1">
                      {columnTickets.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                          Chưa có yêu cầu nào
                        </div>
                      ) : (
                        columnTickets.map((t) => {
                          const priority = priorityConfig[t.priority] || priorityConfig.low;
                          return (
                            <div
                              key={t.id}
                              onClick={() => openTicket(t)}
                              className="bg-white dark:bg-gray-800 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700/80 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all group"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-400">
                                  ({t.messages?.length || 0} phản hồi)
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
                                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                    {priority.label}
                                  </span>
                                </div>
                              </div>

                              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 leading-snug mb-2">
                                {t.title}
                              </h4>

                              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                                <div className="flex items-center gap-1.5">
                                  <img
                                    src={t.sender.avatar}
                                    alt={t.sender.name}
                                    className="w-5 h-5 rounded-full object-cover shrink-0"
                                  />
                                  <span className="truncate max-w-[120px]">{t.sender.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{t.messages.length}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'broadcast',
      label: 'Thông báo hệ thống',
      icon: Bell,
      count: broadcasts.length,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form soạn thông báo gửi hàng loạt */}
          <div className="lg:col-span-5 bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Gửi thông báo hàng loạt</h3>
                <p className="text-xs text-gray-500">Gửi tin nhắn tức thời tới học viên, giáo viên hoặc cả hệ thống</p>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tiêu đề thông báo <span className="text-red-500">*</span>
                </label>
                <Input
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="Ví dụ: Lịch bảo trì hệ thống / Khai giảng khóa mới..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nội dung thông báo <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={notifContent}
                  onChange={(e) => setNotifContent(e.target.value)}
                  rows={4}
                  placeholder="Nhập nội dung thông báo chi tiết..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Chọn đối tượng nhận
                </label>
                <Select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                >
                  <option value="all">Tất cả người dùng hệ thống (~2,450 tài khoản)</option>
                  <option value="role_student">Chỉ gửi cho Toàn bộ Học viên (~1,850 học viên)</option>
                  <option value="role_teacher">Chỉ gửi cho Toàn bộ Giảng viên (42 giảng viên)</option>
                  <option value="class">Theo từng Lớp học cụ thể</option>
                </Select>
              </div>

              {targetAudience === 'class' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Chọn lớp học
                  </label>
                  <Select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                  >
                    <option value="toeic_650">Lớp TOEIC 650+ Chinh phục mục tiêu - K10</option>
                    <option value="ielts_intensive">Lớp IELTS Intensive 6.5 Cấp tốc - K15</option>
                    <option value="toeic_starter">Lớp TOEIC Căn bản 450+ - K08</option>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Kênh gửi thông báo
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channelInApp}
                      onChange={(e) => setChannelInApp(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Thông báo ứng dụng (In-app)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channelEmail}
                      onChange={(e) => setChannelEmail(e.target.checked)}
                      disabled
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Gửi qua Email (chưa cấu hình)
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewOpen(true)}
                  disabled={!notifTitle.trim() && !notifContent.trim()}
                  className="flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  Xem trước
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Send className="w-4 h-4" />
                  Gửi thông báo ngay
                </Button>
              </div>
            </form>
          </div>

          {/* Bảng lịch sử thông báo đã gửi */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Lịch sử thông báo đã gửi</h3>
                <p className="text-xs text-gray-500">Các đợt gửi thông báo hàng loạt trước đây</p>
              </div>
              <Badge variant="blue" size="sm">{broadcasts.length} đợt phát tin</Badge>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <Table
                columns={broadcastColumns}
                data={broadcasts}
                pageSize={5}
                emptyText="Chưa có lịch sử phát thông báo"
              />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Hỗ trợ & Thông báo"
        subtitle="Tiếp nhận, xử lý phản hồi từ học viên và gửi thông báo hệ thống"
      />

      <Tabs tabs={mainTabs} defaultTab="tickets" />

      {/* DRAWER CHI TIẾT TICKET & HỘI THOẠI CHAT */}
      <Drawer
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={
          selectedTicket ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-normal">
                ({selectedTicket.messages?.length || 0} phản hồi)
              </span>
              <span className="text-sm font-semibold truncate max-w-sm">
                Chi tiết yêu cầu hỗ trợ
              </span>
            </div>
          ) : 'Chi tiết yêu cầu'
        }
        size="lg"
      >
        {selectedTicket && (
          <div className="flex flex-col h-[calc(100vh-140px)]">
            {/* Thanh thông tin & Dropdown cập nhật trạng thái/ưu tiên */}
            <div className="bg-gray-50 dark:bg-gray-800/80 p-4 rounded-xl border border-gray-200 dark:border-gray-700/80 mb-4 shrink-0 space-y-3">
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 leading-snug">
                  {selectedTicket.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Danh mục: <strong className="text-gray-700 dark:text-gray-300">{categoryLabels[selectedTicket.category]}</strong></span>
                  <span>•</span>
                  <span>Tạo lúc: {selectedTicket.createdAt}</span>
                </div>
              </div>

              {/* Thông tin người gửi */}
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedTicket.sender.avatar}
                    alt={selectedTicket.sender.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {selectedTicket.sender.name}
                      </p>
                      <Badge variant="blue" size="sm">{selectedTicket.sender.role}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedTicket.sender.email}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedTicket.sender.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bộ điều khiển trạng thái & độ ưu tiên */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Trạng thái yêu cầu
                  </label>
                  <Select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateTicketMeta('status', e.target.value)}
                    className="text-xs"
                  >
                    <option value="new">Mới tạo</option>
                    <option value="in_progress">Đang xử lý</option>
                    <option value="resolved">Đã giải quyết</option>
                    <option value="closed">Đã đóng ticket</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Mức độ ưu tiên
                  </label>
                  <Select
                    value={selectedTicket.priority}
                    onChange={(e) => handleUpdateTicketMeta('priority', e.target.value)}
                    className="text-xs"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Khung chat hội thoại bubble */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-gray-950/60 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4 mb-4">
              <div className="text-center">
                <span className="text-[11px] bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full font-medium">
                  Cuộc trò chuyện bắt đầu lúc {selectedTicket.createdAt}
                </span>
              </div>

              {selectedTicket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.isUser ? 'mr-auto' : 'ml-auto flex-row-reverse'
                  }`}
                >
                  <img
                    src={msg.avatar}
                    alt={msg.sender}
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-1 shadow-sm"
                  />
                  <div className={`space-y-1 ${msg.isUser ? 'text-left' : 'text-right'}`}>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{msg.sender}</span>
                      <span>•</span>
                      <span>{msg.time}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                        msg.isUser
                          ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-xs shadow-xs border border-gray-200 dark:border-gray-700'
                          : 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Ô nhập phản hồi */}
            <form onSubmit={handleSendReply} className="shrink-0 flex gap-2">
              <Input
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Nhập nội dung phản hồi cho học viên..."
                className="flex-1 text-sm"
              />
              <Button
                type="submit"
                disabled={!replyMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 shrink-0 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                Gửi
              </Button>
            </form>
          </div>
        )}
      </Drawer>

      {/* MODAL XEM TRƯỚC THÔNG BÁO HÀNG LOẠT */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Xem trước giao diện thông báo gửi đi"
        size="md"
      >
        <div className="space-y-4 py-2">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/80">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bell className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    {notifTitle || 'Tiêu đề thông báo mẫu'}
                  </h4>
                  <span className="text-[11px] text-gray-400">Vừa xong</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {notifContent || 'Nội dung thông báo sẽ hiển thị ở đây trên màn hình thiết bị của người dùng.'}
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                  <span>Hệ thống Đào tạo TOEIC/IELTS</span>
                  <span>•</span>
                  <span>Thông báo chính thức</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p>• Đối tượng nhận: <strong>{targetAudience === 'all' ? 'Tất cả người dùng' : targetAudience}</strong></p>
            <p>• Kênh phát: <strong>{[channelInApp && 'In-app', channelEmail && 'Email'].filter(Boolean).join(', ')}</strong></p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Đóng xem trước
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
