// pages/admin/UnderConstruction.jsx
// Trang giữ chỗ cho các trang chưa xây dựng
import { Construction } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';

export default function UnderConstruction({ title, subtitle, breadcrumbs = [] }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} />
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mb-5">
          <Construction className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Đang xây dựng</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm">
          Tính năng này đang được phát triển và sẽ sớm ra mắt. Vui lòng quay lại sau.
        </p>
      </div>
    </div>
  );
}
