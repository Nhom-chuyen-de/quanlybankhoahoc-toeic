// components/shared/EmptyState.jsx
import { InboxIcon } from 'lucide-react';

export default function EmptyState({
  icon: Icon = InboxIcon,
  title = 'Không có dữ liệu',
  description = 'Chưa có bản ghi nào được tìm thấy.',
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-700 mb-4">
        <Icon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
