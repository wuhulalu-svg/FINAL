import { useState, useEffect } from 'react';
import { Users, Trash2, Crown, User, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface UserData {
  id: number;
  name: string;
  email: string;
  age: number;
  gender: string;
  role: string;
  created_at: string;
  recordCount?: number;
}

export function AdminPanel() {
  const { t, language, formatDate } = useLanguage();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const getToken = () => localStorage.getItem('token');

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: number, role: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ role })
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('更新角色失败:', error);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm(language === 'zh' ? '确定要删除该用户吗？此操作不可撤销！' : 'Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        fetchUsers();
        if (selectedUser?.id === userId) setSelectedUser(null);
      }
    } catch (error) {
      console.error('删除用户失败:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-indigo-600" size={32} />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {language === 'zh' ? '管理面板' : 'Admin Panel'}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'zh' ? '管理系统用户' : 'Manage system users'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 用户列表 */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {language === 'zh' ? '用户列表' : 'User List'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{language === 'zh' ? '姓名' : 'Name'}</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{language === 'zh' ? '邮箱' : 'Email'}</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{language === 'zh' ? '角色' : 'Role'}</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">{language === 'zh' ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" 
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">#{user.id}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-gray-800 dark:text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {user.role === 'admin' ? (language === 'zh' ? '管理员' : 'Admin') : (language === 'zh' ? '用户' : 'User')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => updateUserRole(user.id, 'admin')}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title={language === 'zh' ? '设为管理员' : 'Make Admin'}
                          >
                            <Crown size={16} />
                          </button>
                        )}
                        {user.role === 'admin' && user.id !== 1 && (
                          <button
                            onClick={() => updateUserRole(user.id, 'user')}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            title={language === 'zh' ? '取消管理员' : 'Remove Admin'}
                          >
                            <User size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={language === 'zh' ? '删除用户' : 'Delete User'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 用户详情 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {language === 'zh' ? '用户详情' : 'User Details'}
            </h2>
          </div>
          <div className="p-5">
            {selectedUser ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                    {selectedUser.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{selectedUser.name}</h3>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{language === 'zh' ? '年龄' : 'Age'}</span>
                    <span className="text-gray-800 dark:text-white">{selectedUser.age || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{language === 'zh' ? '性别' : 'Gender'}</span>
                    <span className="text-gray-800 dark:text-white capitalize">{selectedUser.gender || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{language === 'zh' ? '角色' : 'Role'}</span>
                    <span className="text-gray-800 dark:text-white">{selectedUser.role === 'admin' ? '管理员' : '普通用户'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{language === 'zh' ? '注册时间' : 'Registered'}</span>
                    <span className="text-gray-800 dark:text-white">{formatDate(selectedUser.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{language === 'zh' ? '健康记录数' : 'Health Records'}</span>
                    <span className="text-gray-800 dark:text-white">{selectedUser.recordCount || 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-3 opacity-50" />
                <p>{language === 'zh' ? '点击用户查看详情' : 'Click a user to view details'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}