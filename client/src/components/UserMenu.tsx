import { useState, useEffect, useRef } from 'react';
import { UserCircle, Settings, Target, LogOut, User as UserIcon, Mail, Calendar, Ruler, Weight, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface UserMenuProps {
    user: any;
    onNavigate: (page: 'profile' | 'goals') => void;
    onLogout: () => void;
}

export function UserMenu({ user, onNavigate, onLogout }: UserMenuProps) {
    const { language } = useLanguage();
    const isZh = language === 'zh';
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            {/* 用户头像按钮 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
            </button>

            {/* 下拉菜单 - 改为向下展开 */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                    
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            onNavigate('profile');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                        <UserIcon size={18} className="text-indigo-500" />
                        <span className="text-sm">{isZh ? '个人资料' : 'Profile'}</span>
                    </button>
                    
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            onNavigate('goals');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                        <Target size={18} className="text-green-500" />
                        <span className="text-sm">{isZh ? '健康目标' : 'Health Goals'}</span>
                    </button>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>
                    
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            onLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-left text-red-600"
                    >
                        <LogOut size={18} />
                        <span className="text-sm">{isZh ? '退出登录' : 'Logout'}</span>
                    </button>
                </div>
            )}
        </div>
    );
}