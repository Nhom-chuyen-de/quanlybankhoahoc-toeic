// src/pages/admin/ModerationPage.jsx
import { useState, useMemo } from 'react';
import {
  ClipboardCheck, Check, X, Eye, Play, AlertCircle
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import EmptyState from '../../components/shared/EmptyState';
import { useToastContext } from '../../contexts/ToastContext';
import { mockModerationItems } from '../../mock/training';

const typeBadgeMap = {
  course: { color: 'indigo', label: 'Khóa học' },
  reading: { color: 'purple', label: 'Bài đọc' },
  video: { color: 'blue', label: 'Video bài giảng' },
  document: { color: 'amber', label: 'Tài liệu' },
  audio: { color: 'rose', label: 'Âm thanh' },
  exercise: { color: 'emerald', label: 'Bài tập' },
};

// Cột "Thời lượng / quy mô": video, âm thanh, bài đọc hiện số phút; tài liệu và bài tập hiện "—"
const formatDuration = (row) => {
  if (['video', 'audio', 'reading'].includes(row.typeKey)) {
    const match = String(row.duration).match(/(\d+)\s*phút/i);
    if (match) return `${match[1]} phút`;
    const numMatch = String(row.duration).match(/\d+/);
    return numMatch ? `${numMatch[0]} phút` : row.duration;
  }
  if (['document', 'exercise', 'course'].includes(row.typeKey)) {
    return '—';
  }
  return '—';
};

export default function ModerationPage() {
  const toast = useToastContext();
  const [items, setItems] = useState(mockModerationItems);
  const [currentTab, setCurrentTab] = useState('pending'); // 'pending' | 'approved' | 'rejected'

  // Drawer Xem trước
  const [previewItem, setPreviewItem] = useState(null);

  // Modal Từ chối (Bắt buộc nhập lý do)
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    item: null,
  });
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Lọc dữ liệu theo tab
  const pendingItems = useMemo(() => items.filter((i) => i.status === 'pending'), [items]);
  const approvedItems = useMemo(() => items.filter((i) => i.status === 'approved'), [items]);
  const rejectedItems = useMemo(() => items.filter((i) => i.status === 'rejected'), [items]);

  const handleApprove = (item) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: 'approved',
              reviewedBy: 'Nguyễn Văn An',
              reviewedAt: '01/11/2026 16:45',
              reviewReason: 'Nội dung đạt chuẩn chất lượng giáo án và quy chuẩn kiểm duyệt.',
            }
          : i
      )
    );
    toast.success(`Đã phê duyệt "${item.title}"`);
    if (previewItem?.id === item.id) setPreviewItem(null);
  };

  const handleOpenReject = (item) => {
    setRejectReason('');
    setRejectError('');
    setRejectModal({ isOpen: true, item });
  };

  const handleConfirmReject = (e) => {
    e?.preventDefault();
    if (!rejectReason.trim()) {
      setRejectError('Bắt buộc phải nhập lý do từ chối để thông báo cho giảng viên!');
      return;
    }

    const item = rejectModal.item;
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: 'rejected',
              reviewedBy: 'Nguyễn Văn An',
              reviewedAt: '01/11/2026 16:45',
              reviewReason: rejectReason.trim(),
            }
          : i
      )
    );

    toast.info(`Đã từ chối "${item.title}"`);
    setRejectModal({ isOpen: false, item: null });
    if (previewItem?.id === item.id) setPreviewItem(null);
  };

  // Render bảng kiểm duyệt
  const renderTable = (list, isReviewed = false) => {
    if (list.length === 0) {
      return (
        <EmptyState
          icon={ClipboardCheck}
          title="Không có yêu cầu kiểm duyệt"
          description="Danh sách hiện tại đang trống."
        />
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase text-[10px] font-semibold border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="py-3 px-3">Tiêu đề nội dung</th>
              <th className="py-3 px-3">Loại</th>
              <th className="py-3 px-3">Khóa học / Chương mục</th>
              <th className="py-3 px-3">Giảng viên gửi</th>
              <th className="py-3 px-3">Thời lượng / Quy mô</th>
              <th className="py-3 px-3">Ngày gửi</th>
              {isReviewed && <th className="py-3 px-3">Người duyệt & Lý do</th>}
              <th className="py-3 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {list.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="py-3 px-3 max-w-xs">
                  {/* Yêu cầu: Xóa tag MOD0x */}
                  <span
                    onClick={() => setPreviewItem(row)}
                    className="font-bold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer line-clamp-1 block"
                  >
                    {row.title}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <Badge color={typeBadgeMap[row.typeKey]?.color || 'indigo'} size="xs">
                    {row.type}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-gray-600 dark:text-gray-300 max-w-[200px] truncate">
                  {row.courseOrChapter}
                </td>
                <td className="py-3 px-3 font-medium text-gray-800 dark:text-gray-200">
                  {row.teacher}
                </td>
                {/* Yêu cầu: Cột "Thời lượng / quy mô": video, âm thanh, bài đọc hiện số phút; tài liệu và bài tập hiện "—" */}
                <td className="py-3 px-3 text-gray-700 dark:text-gray-300 font-medium">
                  {formatDuration(row)}
                </td>
                <td className="py-3 px-3 text-gray-500 font-mono whitespace-nowrap">
                  {row.submittedAt}
                </td>

                {isReviewed && (
                  <td className="py-3 px-3 max-w-xs">
                    <span className="font-semibold text-gray-800 dark:text-gray-200 block">
                      {row.reviewedBy}
                    </span>
                    <span className="text-gray-400 text-[10px] block font-mono">
                      {row.reviewedAt}
                    </span>
                    {row.reviewReason && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1 italic">
                        "{row.reviewReason}"
                      </p>
                    )}
                  </td>
                )}

                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="xs"
                      variant="secondary"
                      icon={Eye}
                      onClick={() => setPreviewItem(row)}
                    >
                      Xem trước
                    </Button>

                    {!isReviewed && (
                      <>
                        <Button
                          size="xs"
                          variant="danger"
                          icon={X}
                          onClick={() => handleOpenReject(row)}
                        >
                          Từ chối
                        </Button>
                        <Button
                          size="xs"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          icon={Check}
                          onClick={() => handleApprove(row)}
                        >
                          Duyệt
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kiểm duyệt Nội dung"
        subtitle="Xét duyệt các khóa học, bài đọc, video bài giảng, tài liệu, âm thanh và bài tập từ giảng viên"
      />

      <Card padding={false} className="p-5">
        <Tabs
          defaultTab={currentTab}
          onChange={setCurrentTab}
          tabs={[
            {
              key: 'pending',
              label: 'Chờ duyệt',
              count: pendingItems.length,
              content: renderTable(pendingItems, false),
            },
            {
              key: 'approved',
              label: 'Đã duyệt',
              count: approvedItems.length,
              content: renderTable(approvedItems, true),
            },
            {
              key: 'rejected',
              label: 'Từ chối',
              count: rejectedItems.length,
              content: renderTable(rejectedItems, true),
            },
          ]}
        />
      </Card>

      {/* ─── DRAWER XEM TRƯỚC (PREVIEW DRAWER) ─────────────────────────────── */}
      <Drawer
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={previewItem ? `Xem trước: ${previewItem.title}` : 'Xem trước nội dung'}
        width="w-full sm:w-[560px]"
        footer={
          previewItem && (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-gray-400">
                Thời lượng / Quy mô: {formatDuration(previewItem)}
              </span>

              <div className="flex items-center gap-2">
                {previewItem.status === 'pending' ? (
                  <>
                    <Button
                      size="sm"
                      variant="danger"
                      icon={X}
                      onClick={() => handleOpenReject(previewItem)}
                    >
                      Từ chối
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      icon={Check}
                      onClick={() => handleApprove(previewItem)}
                    >
                      Phê duyệt ngay
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setPreviewItem(null)}>
                    Đóng
                  </Button>
                )}
              </div>
            </div>
          )
        }
      >
        {previewItem && (
          <div className="space-y-5">
            {/* Metadata tóm tắt */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <Badge color={typeBadgeMap[previewItem.typeKey]?.color || 'indigo'} size="xs">
                  {previewItem.type}
                </Badge>
                <span className="font-mono text-gray-400">{previewItem.submittedAt}</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                {previewItem.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Khóa / Chương: <strong>{previewItem.courseOrChapter}</strong>
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Giảng viên: <strong>{previewItem.teacher}</strong> • Quy mô: {formatDuration(previewItem)}
              </p>
            </div>

            {/* Khung video / văn bản giả lập */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Trình hiển thị giả lập nội dung
              </h4>

              {previewItem.previewType === 'video' ? (
                <div className="rounded-2xl overflow-hidden border border-gray-800 bg-black aspect-video relative flex items-center justify-center shadow-lg group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="h-6 w-6 ml-1 fill-white" />
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="font-medium">Video Player HD 1080p</span>
                    <span className="font-mono text-[11px] bg-black/60 px-2 py-0.5 rounded">{formatDuration(previewItem)}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750 p-4 font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed shadow-xs max-h-72 overflow-y-auto">
                  {previewItem.previewContent}
                </div>
              )}
            </div>

            {/* Chi tiết phản hồi kiểm duyệt nếu đã xử lý */}
            {previewItem.status !== 'pending' && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  previewItem.status === 'approved'
                    ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-900 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                }`}
              >
                <div className="flex justify-between font-semibold">
                  <span>Trạng thái: {previewItem.status === 'approved' ? 'ĐÃ DUYỆT' : 'ĐÃ TỪ CHỐI'}</span>
                  <span>{previewItem.reviewedAt}</span>
                </div>
                <p>Người thực hiện: <strong>{previewItem.reviewedBy}</strong></p>
                {previewItem.reviewReason && (
                  <p>Lý do: <em>"{previewItem.reviewReason}"</em></p>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ─── MODAL TỪ CHỐI (BẮT BUỘC NHẬP LÝ DO) ─────────────────────────── */}
      <Modal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, item: null })}
        title="Từ chối nội dung kiểm duyệt"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="secondary"
              onClick={() => setRejectModal({ isOpen: false, item: null })}
            >
              Hủy
            </Button>
            <Button variant="danger" onClick={handleConfirmReject}>
              Xác nhận từ chối
            </Button>
          </div>
        }
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý:</strong> Lý do từ chối sẽ được gửi trực tiếp qua thông báo và email của Giảng viên để họ chỉnh sửa lại nội dung.
            </div>
          </div>

          <div>
            <Textarea
              label="Lý do từ chối nội dung"
              required
              rows={4}
              placeholder="Nêu rõ lỗi sai, chất lượng âm thanh/hình ảnh hoặc điều khoản chưa đáp ứng..."
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError('');
              }}
              error={rejectError}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
