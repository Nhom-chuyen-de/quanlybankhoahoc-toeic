// components/ui/Table.jsx
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Table({
  columns = [],
  data = [],
  selectable = false,
  selectedIds = [],
  onSelectChange,
  pageSize = 10,
  totalItems,
  currentPage = 1,
  onPageChange,
  loading = false,
  emptyState,
}) {
  // Internal pagination nếu không truyền handler ngoài
  const [internalPage, setInternalPage] = useState(1);
  const isControlled = typeof onPageChange === 'function';
  const page = isControlled ? currentPage : internalPage;
  const total = totalItems ?? data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const displayData = isControlled
    ? data
    : data.slice((page - 1) * pageSize, page * pageSize);

  const handlePage = (p) => {
    if (isControlled) onPageChange(p);
    else setInternalPage(p);
  };

  const allIds = displayData.map((row) => row.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
  const someSelected = allIds.some((id) => selectedIds.includes(id));

  const toggleAll = () => {
    if (!onSelectChange) return;
    if (allSelected) {
      onSelectChange(selectedIds.filter((id) => !allIds.includes(id)));
    } else {
      onSelectChange([...new Set([...selectedIds, ...allIds])]);
    }
  };

  const toggleOne = (id) => {
    if (!onSelectChange) return;
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
              )}
              {columns.map((col, idx) => {
                const colKey = col.key || col.accessor || col.dataIndex || `col-${idx}`;
                return (
                  <th
                    key={colKey}
                    className={`px-4 py-3 whitespace-nowrap ${col.headerClass ?? ''}`}
                    style={{ width: col.width }}
                  >
                    {col.title ?? col.header ?? ''}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {selectable && <td className="px-4 py-3"><div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" /></td>}
                  {columns.map((col, idx) => (
                    <td key={col.key || col.accessor || idx} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="py-16 text-center">
                  {emptyState ?? <span className="text-gray-400">Không có dữ liệu</span>}
                </td>
              </tr>
            ) : (
              displayData.map((row) => (
                <tr
                  key={row.id}
                  className={`
                    bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50
                    transition-colors duration-150
                    ${selectedIds.includes(row.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                  `}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleOne(row.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                  )}
                  {columns.map((col, idx) => {
                    const colKey = col.key || col.accessor || col.dataIndex;
                    const cellVal = colKey !== undefined ? row[colKey] : undefined;
                    return (
                      <td key={colKey || idx} className={`px-4 py-3 ${col.cellClass ?? ''}`}>
                        {col.render
                          ? col.render(cellVal !== undefined ? cellVal : row, row, idx)
                          : (cellVal ?? '—')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          Hiển thị{' '}
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)}
          </span>{' '}
          trong{' '}
          <span className="font-medium text-gray-700 dark:text-gray-200">{total}</span> bản ghi
        </span>
        <div className="flex items-center gap-1">
          <PagBtn onClick={() => handlePage(1)} disabled={page === 1}><ChevronsLeft className="h-4 w-4" /></PagBtn>
          <PagBtn onClick={() => handlePage(page - 1)} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></PagBtn>
          {[...Array(totalPages)].map((_, i) => {
            const p = i + 1;
            if (totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
              return (
                <button
                  key={p}
                  onClick={() => handlePage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  {p}
                </button>
              );
            }
            if (Math.abs(p - page) === 2) return <span key={p} className="px-1">…</span>;
            return null;
          })}
          <PagBtn onClick={() => handlePage(page + 1)} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></PagBtn>
          <PagBtn onClick={() => handlePage(totalPages)} disabled={page === totalPages}><ChevronsRight className="h-4 w-4" /></PagBtn>
        </div>
      </div>
    </div>
  );
}

function PagBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}
