// components/ui/Badge.jsx

const colorMap = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
};

export default function Badge({ children, color = 'gray', size = 'sm', className = '' }) {
  const sizeClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${colorMap[color] ?? colorMap.gray} ${className}`}
    >
      {children}
    </span>
  );
}
