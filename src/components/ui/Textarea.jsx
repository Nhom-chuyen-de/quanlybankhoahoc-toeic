// components/ui/Textarea.jsx
import { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea(
  { label, error, hint, rows = 4, className = '', containerClass = '', required = false, ...props },
  ref
) {
  return (
    <div className={`flex flex-col gap-1 ${containerClass}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          block w-full rounded-lg border px-3 py-2.5 text-sm resize-y
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          transition-colors duration-200
          ${error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
});

export default Textarea;
