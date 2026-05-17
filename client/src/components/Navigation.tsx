import { Activity, LayoutDashboard, Upload, BarChart3, MessageSquare, Bell, Settings, UserCircle, LogOut, Database, Users, Shield } from 'lucide-react';
import { Page, User } from '../App';
import { ThemeToggle } from './ThemeToggle';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from 'react';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  user: User | null;
  unreadAlertsCount: number;
}

const navItems = [
  { id: 'dashboard' as Page, icon: LayoutDashboard, color: 'text-indigo-500', labelKey: 'dashboard' },
  { id: 'records' as Page, icon: Database, color: 'text-teal-500', labelKey: 'dataRecords' },
  { id: 'square' as Page, icon: Users, color: 'text-emerald-500', labelKey: 'healthSquare' },
  { id: 'import' as Page, icon: Upload, color: 'text-purple-500', labelKey: 'importData' },
  { id: 'analysis' as Page, icon: BarChart3, color: 'text-green-500', labelKey: 'healthAnalysis' },
  { id: 'assistant' as Page, icon: MessageSquare, color: 'text-pink-500', labelKey: 'aiAssistant' },
  { id: 'alerts' as Page, icon: Bell, color: 'text-red-500', labelKey: 'alerts' },
  { id: 'settings' as Page, icon: Settings, color: 'text-gray-500', labelKey: 'settings' },
  { id: 'profile' as Page, icon: UserCircle, color: 'text-cyan-500', labelKey: 'profile' },
];

// 管理员专属菜单项
const adminNavItem = { id: 'admin' as Page, icon: Shield, color: 'text-purple-500', labelKey: 'adminPanel' };

export function Navigation({ currentPage, onNavigate, onLogout, user, unreadAlertsCount }: NavigationProps) {
  const { t, language, setLanguage } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // 检查当前用户是否是管理员
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setCheckingAdmin(false);
          return;
        }
        
        const response = await fetch('http://localhost:3001/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setIsAdmin(userData.role === 'admin');
        }
      } catch (error) {
        console.error('检查管理员权限失败:', error);
      } finally {
        setCheckingAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  const handleNavClick = (page: Page) => {
    onNavigate(page);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  // 构建完整的导航项列表
  const allNavItems = [...navItems];
  if (isAdmin) {
    allNavItems.push(adminNavItem);
  }

  return (
    <>
      <div className="fixed left-0 top-0 h-full w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-2xl z-40 border-r border-gray-200/50 dark:border-gray-800/50">
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-50"></div>
              <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-2.5 rounded-2xl shadow-lg">
                <Activity className="text-white" size={26} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Smart Healthcare
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tracker</p>
            </div>
          </div>
        </div>

        <div className="mx-4 mt-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              {isAdmin && (
                <span className="text-xs text-purple-600 dark:text-purple-400 mt-0.5 inline-block">
                  👑 管理员
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="p-4 mt-4 h-[calc(100%-280px)] overflow-y-auto">
          <ul className="space-y-1.5">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                      isActive
                        ? `bg-gradient-to-r ${item.bg || 'from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50'} text-${item.color.split('-')[1]}-600 dark:text-${item.color.split('-')[1]}-400 shadow-md`
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={20} className={isActive ? item.color : ''} />
                    <span className="flex-1 text-left text-sm font-medium">{t(item.labelKey)}</span>
                    {item.id === 'alerts' && unreadAlertsCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-md">
                        {unreadAlertsCount > 99 ? '99+' : unreadAlertsCount}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/50 dark:border-gray-800/50 space-y-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {t('theme')}
            </span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {t('language')}
            </span>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              {language === 'zh' ? 'EN' : '中文'}
            </button>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors group"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">{t('logout')}</span>
          </button>
        </div>
      </div>
    </>
  );
}