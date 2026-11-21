// components/shared/StatCard.jsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from '../ui/Card';

const colorMap = {
  indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
  blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
  green: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
  red: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
  purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
  teal: 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400',
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  change,
  trend = 'neutral',
  color = 'indigo',
  suffix,
  invertTrend = false,
}) {
  const iconClass = colorMap[color] ?? colorMap.indigo;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const isPositive = invertTrend ? trend === 'down' : trend === 'up';
  const isNegative = invertTrend ? trend === 'up' : trend === 'down';

  const trendColor =
    isPositive ? 'text-green-600 dark:text-green-400' :
    isNegative ? 'text-red-500 dark:text-red-400' :
    'text-gray-400';

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
            {suffix && <span className="text-base font-medium ml-1 text-gray-500">{suffix}</span>}
          </p>
          {change && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trendColor}`}>
              <TrendIcon className="h-3.5 w-3.5" />
              <span>{change} so với tháng trước</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${iconClass}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </Card>
  );
}
