// components/ui/Select.jsx
import { ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';

const Select = forwardRef(function Select(
  {
    label,
    error,
    options = [],
    placeholder,
    className = '',
    containerClass = '',
    required = false,
    children,
    ...props
  },
  ref
) {
  // Kiểm tra nếu options đã có option rỗng (value === '')
  const hasEmptyOption = options.some((opt) => opt.value === '');
  const shouldRenderPlaceholder = !children && !hasEmptyOption && placeholder;

  return (
    <div className={`flex flex-col gap-1 ${containerClass}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative inline-block w-full">
        <select
          ref={ref}
          className={`
            block w-full rounded-lg border pl-3 pr-8 py-2 text-sm appearance-none cursor-pointer
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            transition-colors duration-200
            ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
            ${className}
          `}
          {...props}
        >
          {shouldRenderPlaceholder && <option value="">{placeholder}</option>}
          {children}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Select;
