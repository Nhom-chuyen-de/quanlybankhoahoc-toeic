// components/ui/Tabs.jsx
import { useState } from 'react';

export default function Tabs({ tabs = [], defaultTab, onChange, className = '' }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key);

  const handleChange = (key) => {
    setActive(key);
    onChange?.(key);
  };

  const activeTab = tabs.find((t) => t.key === active);

  return (
    <div className={className}>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleChange(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg
              border-b-2 transition-all duration-200
              ${active === tab.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }
            `}
          >
            {tab.icon && <tab.icon className="h-4 w-4" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full font-medium
                ${active === tab.key ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* Active tab content */}
      {activeTab?.content}
    </div>
  );
}
