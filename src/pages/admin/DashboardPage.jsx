// src/pages/admin/DashboardPage.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  Users, BookOpen, TrendingUp, HelpCircle,
  ArrowUpRight, Check, X, Clock, AlertTriangle,
  ChevronRight, ShoppingCart, FileCheck, LifeBuoy
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import PageHeader from '../../components/shared/PageHeader';
import StatCard from '../../components/shared/StatCard';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useToastContext } from '../../contexts/ToastContext';
import { dashboardService, reviewService } from '../../services/adminService';

// TODO: nối API - Thay thế toàn bộ mock data bằng API endpoints:
// - GET /api/admin/dashboard/stats
// - GET /api/admin/dashboard/revenue-chart
// - GET /api/admin/dashboard/enrollment-chart
// - GET /api/admin/dashboard/role-distribution
// - GET /api/admin/dashboard/recent-orders
// - GET /api/admin/dashboard/pending-reviews
// - GET /api/admin/dashboard/urgent-tickets

const statIcons = {
  Users,
  BookOpen,
  TrendingUp,
  HelpCircle,
};

const formatVnd = (value) => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)} tỷ ₫`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(0)}M ₫`;
  }
  return `${value?.toLocaleString('vi-VN')} ₫`;
};

// Custom tooltip cho biểu đồ Doanh thu
const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-xl text-xs space-y-1">
      <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-1">{`Tháng ${label?.replace('T', '')}`}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: item.color }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }} />
            {item.name}:
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{formatVnd(item.value)}</span>
        </div>
      ))}
    </div>
  );
};

// Custom tooltip cho biểu đồ Học viên
const EnrollmentTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-xl text-xs space-y-1">
      <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-1">{`Tháng ${label?.replace('T', '')}`}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: item.color }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }} />
            {item.name}:
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{item.value?.toLocaleString('vi-VN')} học viên</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const toast = useToastContext();
  const [stats, setStats] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [urgentTickets, setUrgentTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statData, revenueData, enrollmentData, roleData, orderData, reviewData, ticketData] = await Promise.all([
        dashboardService.getStats(), dashboardService.getRevenueChart(), dashboardService.getEnrollmentChart(),
        dashboardService.getRoleDistribution(), dashboardService.getRecentOrders(),
        dashboardService.getPendingReviews(), dashboardService.getUrgentTickets(),
      ]);
      setStats(statData); setRevenue(revenueData); setEnrollments(enrollmentData); setRoles(roleData);
      setRecentOrders(orderData); setReviews(reviewData); setUrgentTickets(ticketData);
    } catch (error) {
      toast.error(error.message || 'Không tải được dữ liệu dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleApproveReview = async (id, title) => {
    try { await reviewService.approveContent(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast.success(`Đã phê duyệt "${title}"`);
    } catch (error) { toast.error(error.message); }
  };

  const handleRejectReview = async (id, title) => {
    try { await reviewService.rejectContent(id, 'Từ chối từ Dashboard');
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast.info(`Đã từ chối "${title}"`);
    } catch (error) { toast.error(error.message); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Quản trị"
        subtitle="Tổng quan hoạt động đào tạo, doanh thu và vận hành hệ thống TOEIC/IELTS"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg shadow-sm">
              Cập nhật lúc: <strong>{new Date().toLocaleDateString('vi-VN')}</strong>
            </span>
            <Button size="sm" variant="secondary" onClick={loadDashboard} disabled={isLoading}>
              {isLoading ? 'Đang tải…' : 'Làm mới'}
            </Button>
          </div>
        }
      />

      {/* ─── 1. 4 STAT CARDS ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = statIcons[stat.icon] || TrendingUp;
          return (
            <StatCard
              key={stat.id}
              icon={Icon}
              label={stat.label}
              value={stat.value}
              change={stat.change}
              trend={stat.trend}
              color={stat.color}
              invertTrend={stat.invertTrend}
            />
          );
        })}
      </div>

      {/* ─── 2. BIỂU ĐỒ DOANH THU 12 THÁNG & TỈ LỆ VAI TRÒ ──────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Biểu đồ đường: Doanh thu 12 tháng */}
        <Card className="xl:col-span-2" padding={false}>
          <div className="p-5 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
            <CardHeader
              title="Doanh thu 12 tháng qua"
              subtitle="Doanh thu thực tế theo từng tháng trong năm (VNĐ)"
            />
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                <span className="w-3 h-1 bg-indigo-600 rounded-full inline-block" /> Thực tế
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenue} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Doanh thu thực tế"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#4f46e5' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Đỉnh doanh thu: <strong>Tháng 12 (320M ₫)</strong></span>
              <span>Tổng doanh thu năm: <strong className="text-indigo-600 dark:text-indigo-400">2.98 tỷ VNĐ</strong></span>
            </div>
          </div>
        </Card>

        {/* Biểu đồ tròn: Tỉ lệ vai trò */}
        <Card padding={false}>
          <div className="p-5 border-b border-gray-100 dark:border-gray-700/60">
            <CardHeader
              title="Tỉ lệ vai trò người dùng"
              subtitle="Phân bố cơ cấu 15.840 tài khoản"
            />
          </div>
          <div className="p-5 flex flex-col items-center justify-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roles}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {roles.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, props) => [
                      `${val.toLocaleString('vi-VN')} (${props.payload.percentage}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend danh sách 3 vai trò */}
            <div className="w-full grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-gray-100 dark:border-gray-700/60">
              {roles.map((role) => (
                <div key={role.name} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{role.name}</span>
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 shrink-0 ml-1">
                    {role.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ─── 3. BIỂU ĐỒ CỘT HỌC VIÊN GHI DANH MỚI THEO THÁNG ──────────────── */}
      <Card padding={false}>
        <div className="p-5 border-b border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardHeader
            title="Số lượng học viên ghi danh mới theo tháng"
            subtitle="Thống kê ghi danh khóa học TOEIC & IELTS trong 12 tháng gần nhất"
          />
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
              <span className="w-3 h-3 bg-indigo-600 rounded-sm inline-block" /> Khóa TOEIC
            </span>
            <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-medium">
              <span className="w-3 h-3 bg-teal-500 rounded-sm inline-block" /> Khóa IELTS
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollments} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<EnrollmentTooltip />} />
                <Bar dataKey="toeic" name="TOEIC" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="ielts" name="IELTS" stackId="a" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* ─── 4. 3 BẢNG NHỎ (5 DÒNG MỖI BẢNG) ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bảng 1: Đơn hàng gần đây */}
        <Card padding={false} className="flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Đơn hàng gần đây</h3>
            </div>
            <button
              onClick={() => toast.wip()}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              Xem tất cả <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60 flex-1">
            {recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {order.id}
                  </span>
                  <StatusBadge status={order.status} size="xs" />
                </div>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{order.user}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{order.course}</p>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-gray-400 font-normal">{order.paymentMethod}</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {order.amount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Bảng 2: Nội dung chờ duyệt (kèm nút Duyệt/Từ chối) */}
        <Card padding={false} className="flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 rounded-lg">
                <FileCheck className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Nội dung chờ duyệt</h3>
            </div>
            <Badge color="yellow" size="xs">{reviews.length} yêu cầu</Badge>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60 flex-1">
            {reviews.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs">
                Không còn nội dung nào chờ duyệt!
              </div>
            ) : (
              reviews.slice(0, 5).map((item) => (
                <div key={item.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-1 flex-1">
                      {item.title}
                    </p>
                    <Badge color="blue" size="xs">{item.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span className="truncate">{item.author}</span>
                    <span className="text-gray-400 text-[11px] shrink-0">{item.submittedAt?.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-gray-50 dark:border-gray-700/40">
                    <button
                      onClick={() => handleRejectReview(item.id, item.title)}
                      className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex items-center gap-1"
                      title="Từ chối nội dung"
                    >
                      <X className="h-3.5 w-3.5" /> Từ chối
                    </button>
                    <button
                      onClick={() => handleApproveReview(item.id, item.title)}
                      className="px-2.5 py-1 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm transition-colors flex items-center gap-1"
                      title="Phê duyệt nội dung"
                    >
                      <Check className="h-3.5 w-3.5" /> Duyệt
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Bảng 3: Yêu cầu hỗ trợ ưu tiên cao */}
        <Card padding={false} className="flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg">
                <LifeBuoy className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Hỗ trợ ưu tiên cao</h3>
            </div>
            <button
              onClick={() => toast.wip()}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              Xem ticket <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60 flex-1">
            {urgentTickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                      {ticket.id}
                    </span>
                    <Badge color={ticket.priority === 'urgent' ? 'red' : 'orange'} size="xs">
                      {ticket.priority === 'urgent' ? 'Khẩn cấp' : 'Cao'}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {ticket.createdAt}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-1 mb-1">
                  {ticket.subject}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="truncate">{ticket.requester}</span>
                  <StatusBadge status={ticket.status} size="xs" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
