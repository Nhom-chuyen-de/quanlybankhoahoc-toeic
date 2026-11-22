// layouts/Sidebar.jsx
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, Tag, BookOpen, School,
  CalendarDays, ClipboardCheck, UserCheck, ShoppingCart, CreditCard,
  RotateCcw, Ticket, MessageCircle, Award, BarChart3, Settings,
  ChevronRight, ChevronLeft, GraduationCap as Logo,
} from 'lucide-react';
import { NAV_GROUPS } from '../constants/enums';
import { pendingModerationCount } from '../mock/courses';

const iconMap = {
  LayoutDashboard, Users, GraduationCap, Tag, BookOpen, School,
  CalendarDays, ClipboardCheck, UserCheck, ShoppingCart, CreditCard,
  RotateCcw, Ticket, MessageCircle, Award, BarChart3, Settings,
};

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  return (
    <aside
      className={`
        relative flex flex-col h-screen bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out shrink-0
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-200 dark:border-gray-700 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
          <Logo className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">TOEIC/IELTS</p>
            <p className="text-[10px] text-gray-400 leading-tight">Hệ thống quản trị</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-2">
            {/* Group label */}
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {group.label}
                {group.badge && (
                  <span className="ml-1 bg-red-500 text-white text-[9px] px-1 rounded-full">
                    {pendingModerationCount}
                  </span>
                )}
              </p>
            )}
            {collapsed && group.badge && (
              <div className="flex justify-center mb-1">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
              </div>
            )}
            {group.items.map((item) => {
              const Icon = iconMap[item.icon];
              const isActive = location.pathname === item.path ||
                (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 group relative
                    ${isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
                  )}
                  {Icon && <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} style={{ width: '1.125rem', height: '1.125rem' }} />}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {/* Tooltip khi thu gọn */}
                  {collapsed && (
                    <span className="
                      absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-700 text-white
                      text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100
                      pointer-events-none transition-opacity duration-200 z-50
                    ">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="
          absolute -right-3 top-20 z-10
          w-6 h-6 rounded-full
          bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
          flex items-center justify-center shadow-sm
          hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-600
          transition-all duration-200
        "
      >
        {collapsed
          ? <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
          : <ChevronLeft className="h-3.5 w-3.5 text-gray-500" />
        }
      </button>

      {/* Bottom admin info */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              N
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">Bùi Văn Nam</p>
              <p className="text-[10px] text-gray-400 truncate">admin@toeic.vn</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
