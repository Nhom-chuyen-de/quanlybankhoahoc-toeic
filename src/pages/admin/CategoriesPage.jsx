// src/pages/admin/CategoriesPage.jsx
import { useState, useMemo, useEffect } from 'react';
import { Tag, Plus, Pencil, Trash2, Search, BookOpen, Calendar } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import SearchBar from '../../components/shared/SearchBar';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import EmptyState from '../../components/shared/EmptyState';
import Badge from '../../components/ui/Badge';
import { useToastContext } from '../../contexts/ToastContext';
import { categoryService } from '../../services/adminService';

// TODO: nối API - Thay thế bằng các endpoint:
// - GET /api/admin/categories
// - POST /api/admin/categories
// - PUT /api/admin/categories/:id
// - DELETE /api/admin/categories/:id

export default function CategoriesPage() {
  const toast = useToastContext();
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');

  // State Modal Thêm / Sửa
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    item: null,
  });
  const [categoryName, setCategoryName] = useState('');
  const [nameError, setNameError] = useState('');

  const loadCategories = async () => {
    try { const result = await categoryService.list({ page: 1, limit: 100 }); setCategories(result); }
    catch (error) { toast.error(error.message || 'Không tải được danh mục.'); }
  };
  useEffect(() => { loadCategories(); }, []);

  // State Confirm Xóa
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    item: null,
  });

  const filtered = useMemo(() => {
    return categories.filter((c) =>
      !search || c.name.toLowerCase().includes(search.toLowerCase().trim())
    );
  }, [categories, search]);

  const handleOpenCreate = () => {
    setCategoryName('');
    setNameError('');
    setModalState({ isOpen: true, mode: 'create', item: null });
  };

  const handleOpenEdit = (item) => {
    setCategoryName(item.name);
    setNameError('');
    setModalState({ isOpen: true, mode: 'edit', item });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!categoryName.trim()) {
      setNameError('Tên danh mục không được để trống');
      return;
    }

    try {
      if (modalState.mode === 'create') {
        await categoryService.create({ name: categoryName.trim() });
        toast.success(`Đã thêm danh mục "${categoryName.trim()}"`);
      } else {
        await categoryService.update(modalState.item.id, { name: categoryName.trim() });
        toast.success(`Đã cập nhật danh mục "${categoryName.trim()}"`);
      }
      await loadCategories();
    } catch (error) { toast.error(error.message || 'Không lưu được danh mục.'); return; }

    setModalState({ isOpen: false, mode: 'create', item: null });
  };

  const handleDelete = async () => {
    const item = deleteConfirm.item;
    if (item.courseCount > 0) {
      toast.error(`Không thể xóa danh mục đang có ${item.courseCount} khóa học liên kết!`);
      setDeleteConfirm({ isOpen: false, item: null });
      return;
    }
    try {
      await categoryService.remove(item.id);
      toast.success(`Đã xóa danh mục "${item.name}"`);
      await loadCategories();
    } catch (error) { toast.error(error.message || 'Không thể xóa danh mục.'); }
    setDeleteConfirm({ isOpen: false, item: null });
  };

  const columns = [
    {
      key: 'name',
      title: 'Tên danh mục',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
            <Tag className="h-4 w-4" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{row.name}</p>
        </div>
      ),
    },
    {
      key: 'courseCount',
      title: 'Số khóa học',
      render: (v) => (
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-gray-400" />
          <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
            {v} khóa
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      render: (v) => (
        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-mono">
          <Calendar className="h-3 w-3 text-gray-400" />
          {v}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      headerClass: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            title="Chỉnh sửa"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            title="Xóa danh mục"
            onClick={() => setDeleteConfirm({ isOpen: true, item: row })}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Danh mục Khóa học"
        subtitle={`Quản lý ${categories.length} danh mục phân loại chương trình đào tạo`}
        actions={
          <Button icon={Plus} onClick={handleOpenCreate}>
            Thêm danh mục
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Tìm kiếm danh mục..."
          className="w-full sm:w-80"
        />
      </div>

      <Table
        columns={columns}
        data={filtered}
        pageSize={8}
        emptyState={
          <EmptyState
            icon={Tag}
            title="Không tìm thấy danh mục"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc tạo danh mục mới"
            action={<Button size="sm" onClick={handleOpenCreate}>Thêm danh mục</Button>}
          />
        }
      />

      {/* Modal Thêm / Sửa 1 trường Tên */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create', item: null })}
        title={modalState.mode === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa tên danh mục'}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="secondary"
              onClick={() => setModalState({ isOpen: false, mode: 'create', item: null })}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit}>
              {modalState.mode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Tên danh mục"
              required
              autoFocus
              placeholder="Ví dụ: Luyện thi TOEIC Cấp tốc"
              value={categoryName}
              onChange={(e) => {
                setCategoryName(e.target.value);
                if (nameError) setNameError('');
              }}
              error={nameError}
            />
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog Xóa */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
        onConfirm={handleDelete}
        title="Xóa danh mục khóa học"
        description={`Bạn có chắc chắn muốn xóa danh mục "${deleteConfirm.item?.name}"?`}
        variant="danger"
        confirmLabel="Xóa danh mục"
      />
    </div>
  );
}
