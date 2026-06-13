import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, CheckCircle, Calendar, TrendingUp, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HealthGoal {
    id: number;
    metric: string;
    metricLabel: string;
    targetValue: number;
    startDate: string;
    endDate: string;
    duration: number;
    completed: boolean;
    missedDays: string[];
}

interface GoalsSettingsProps {
    user: any;
    healthGoals: HealthGoal[];
    onAddGoal: (goal: any) => Promise<void>;
    onUpdateGoal: (id: number, updates: any) => Promise<void>;
    onDeleteGoal: (id: number) => Promise<void>;
}

const metricOptions = [
    { value: 'steps', labelZh: '步数', labelEn: 'Steps', unit: '步' },
    { value: 'weight', labelZh: '体重', labelEn: 'Weight', unit: 'kg' },
    { value: 'bmi', labelZh: 'BMI', labelEn: 'BMI', unit: '' },
    { value: 'body_fat', labelZh: '体脂率', labelEn: 'Body Fat', unit: '%' },
    { value: 'heart_rate', labelZh: '心率', labelEn: 'Heart Rate', unit: 'bpm' },
    { value: 'sleep_level', labelZh: '睡眠质量', labelEn: 'Sleep Quality', unit: '分' },
    { value: 'calories', labelZh: '卡路里', labelEn: 'Calories', unit: 'kcal' }
];

// 计算两个日期之间的天数差
function getDaysBetween(startDate: string, endDate: string): number {
    if (!startDate || !endDate) return 0;
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diff + 1;
    } catch {
        return 0;
    }
}

// 计算已过去的天数
function getElapsedDays(startDate: string): number {
    if (!startDate) return 0;
    try {
        const start = new Date(startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (today < start) return 0;
        const diff = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diff + 1;
    } catch {
        return 0;
    }
}

// 计算剩余天数
function getRemainingDays(endDate: string): number {
    if (!endDate) return 0;
    try {
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (today > end) return 0;
        const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff + 1;
    } catch {
        return 0;
    }
}

// 计算进度百分比
function getProgressPercent(startDate: string, endDate: string): number {
    const total = getDaysBetween(startDate, endDate);
    if (total <= 0) return 0;
    const elapsed = getElapsedDays(startDate);
    const progress = (elapsed / total) * 100;
    return Math.min(100, Math.max(0, progress));
}

export function GoalsSettings({ user, healthGoals = [], onAddGoal, onUpdateGoal, onDeleteGoal }: GoalsSettingsProps) {
    const { language } = useLanguage();
    const isZh = language === 'zh';
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        metric: 'steps',
        targetValue: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: (() => {
            const date = new Date();
            date.setDate(date.getDate() + 30);
            return date.toISOString().split('T')[0];
        })()
    });
    const [loading, setLoading] = useState(false);
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const interval = setInterval(() => forceUpdate({}), 60000);
        return () => clearInterval(interval);
    }, []);

    const handleAddGoal = async () => {
        if (!formData.targetValue) {
            alert(isZh ? '请填写目标值' : 'Please enter target value');
            return;
        }

        if (!formData.startDate || !formData.endDate) {
            alert(isZh ? '请选择起始日期和结束日期' : 'Please select start date and end date');
            return;
        }

        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            alert(isZh ? '结束日期不能早于起始日期' : 'End date cannot be earlier than start date');
            return;
        }

        setLoading(true);
        const selectedMetric = metricOptions.find(m => m.value === formData.metric);
        const duration = getDaysBetween(formData.startDate, formData.endDate);

        try {
            await onAddGoal({
                metric: formData.metric,
                metric_label: isZh ? selectedMetric?.labelZh : selectedMetric?.labelEn,
                target_value: parseFloat(formData.targetValue),
                start_date: formData.startDate,
                end_date: formData.endDate,
                duration: duration
            });
            setShowAddModal(false);
            setFormData({
                metric: 'steps',
                targetValue: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: (() => {
                    const date = new Date();
                    date.setDate(date.getDate() + 30);
                    return date.toISOString().split('T')[0];
                })()
            });
        } catch (error) {
            console.error('添加目标失败:', error);
            alert(isZh ? '添加失败，请重试' : 'Add failed, please try again');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteGoal = async (goal: HealthGoal) => {
        try {
            await onUpdateGoal(goal.id, { completed: !goal.completed });
        } catch (error) {
            console.error('更新目标失败:', error);
        }
    };

    const handleDeleteGoal = async (id: number) => {
        if (confirm(isZh ? '确定要删除这个目标吗？' : 'Are you sure to delete this goal?')) {
            try {
                await onDeleteGoal(id);
            } catch (error) {
                console.error('删除目标失败:', error);
                alert(isZh ? '删除失败，请重试' : 'Delete failed, please try again');
            }
        }
    };

    // 确保 healthGoals 是数组，并处理字段名映射
    const goalsList = Array.isArray(healthGoals) ? healthGoals : [];
    
    // 标准化目标数据（处理后端返回的字段名）
    const normalizedGoals = goalsList.map(goal => ({
        id: goal.id,
        metric: goal.metric,
        metricLabel: goal.metricLabel || goal.metric_label || '目标',
        targetValue: goal.targetValue || goal.target_value || 0,
        startDate: goal.startDate || goal.start_date || '',
        endDate: goal.endDate || goal.end_date || '',
        duration: goal.duration || 0,
        completed: goal.completed === 1 || goal.completed === true,
        missedDays: goal.missedDays || goal.missed_days || []
    }));

    const activeGoals = normalizedGoals.filter(g => !g.completed);
    const completedGoals = normalizedGoals.filter(g => g.completed);

    const today = new Date().toISOString().split('T')[0];

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr === 'Invalid Date') return '—';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '—';
            return date.toLocaleDateString(isZh ? 'zh-CN' : 'en-US');
        } catch {
            return '—';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{isZh ? '健康目标' : 'Health Goals'}</h1>
                    <p className="text-gray-500">{isZh ? '设置并跟踪您的健康目标' : 'Set and track your health goals'}</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                    <Plus size={20} />
                    {isZh ? '添加目标' : 'Add Goal'}
                </button>
            </div>

            {/* 进行中的目标 */}
            {activeGoals.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Target size={20} className="text-indigo-500" />
                        {isZh ? '进行中' : 'In Progress'}
                    </h2>
                    <div className="space-y-4">
                        {activeGoals.map((goal) => {
                            const totalDays = goal.duration > 0 ? goal.duration : getDaysBetween(goal.startDate, goal.endDate);
                            const elapsedDays = getElapsedDays(goal.startDate);
                            const remainingDays = getRemainingDays(goal.endDate);
                            const progress = getProgressPercent(goal.startDate, goal.endDate);
                            
                            return (
                                <div key={goal.id} className="bg-white rounded-xl shadow-md p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-semibold text-lg">{goal.metricLabel}</p>
                                            <p className="text-sm text-gray-500">
                                                {isZh ? '目标值' : 'Target'}: {goal.targetValue}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleCompleteGoal(goal)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title={isZh ? '标记完成' : 'Mark complete'}
                                            >
                                                <CheckCircle size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteGoal(goal.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title={isZh ? '删除' : 'Delete'}
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3 flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {formatDate(goal.startDate)} - {formatDate(goal.endDate)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {isZh ? `共 ${totalDays} 天` : `${totalDays} days total`}
                                        </span>
                                    </div>
                                    
                                    <div className="mb-2">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>{isZh ? '进度' : 'Progress'}: {Math.round(progress)}%</span>
                                            <span>{elapsedDays}/{totalDays} {isZh ? '天' : 'days'}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between text-xs">
                                        <span className={`flex items-center gap-1 ${remainingDays > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            <TrendingUp size={12} />
                                            {remainingDays > 0 
                                                ? (isZh ? `剩余 ${remainingDays} 天` : `${remainingDays} days remaining`)
                                                : (isZh ? '已到期' : 'Expired')}
                                        </span>
                                        {elapsedDays > totalDays && !goal.completed && (
                                            <span className="text-red-500">
                                                {isZh ? '⚠️ 已超期' : '⚠️ Overdue'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 已完成的目标 */}
            {completedGoals.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle size={20} className="text-green-500" />
                        {isZh ? '已完成' : 'Completed'}
                    </h2>
                    <div className="space-y-3">
                        {completedGoals.map((goal) => (
                            <div key={goal.id} className="bg-gray-50 rounded-xl p-4 opacity-75">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold line-through">{goal.metricLabel}</p>
                                        <p className="text-sm text-gray-500">
                                            {isZh ? '目标值' : 'Target'}: {goal.targetValue}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatDate(goal.startDate)} - {formatDate(goal.endDate)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteGoal(goal.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {normalizedGoals.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Target className="mx-auto text-gray-400 mb-3" size={48} />
                    <p className="text-gray-500">{isZh ? '暂无健康目标' : 'No health goals yet'}</p>
                    <p className="text-sm text-gray-400 mt-2">
                        {isZh ? '点击上方按钮添加您的第一个健康目标' : 'Click above to add your first health goal'}
                    </p>
                </div>
            )}

            {/* 添加目标模态框 */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="flex justify-between p-4 border-b">
                            <h2 className="text-xl font-semibold">{isZh ? '添加健康目标' : 'Add Health Goal'}</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500">✕</button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{isZh ? '指标类型' : 'Metric Type'}</label>
                                <select
                                    value={formData.metric}
                                    onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    {metricOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {isZh ? opt.labelZh : opt.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{isZh ? '目标值' : 'Target Value'}</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.targetValue}
                                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                    placeholder={isZh ? '例如: 8000' : 'e.g., 8000'}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                                        <Calendar size={14} />
                                        {isZh ? '起始日期' : 'Start Date'}
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        min={today}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                                        <Calendar size={14} />
                                        {isZh ? '结束日期' : 'End Date'}
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        min={formData.startDate || today}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg text-center">
                                <p className="text-sm text-gray-600">
                                    {isZh ? '目标期限' : 'Goal Period'}: {formatDate(formData.startDate)} 至 {formatDate(formData.endDate)}
                                    <br />
                                    <span className="text-xs text-gray-400">
                                        {isZh ? `共 ${getDaysBetween(formData.startDate, formData.endDate)} 天` : `${getDaysBetween(formData.startDate, formData.endDate)} days total`}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t">
                            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg">
                                {isZh ? '取消' : 'Cancel'}
                            </button>
                            <button onClick={handleAddGoal} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                                {loading ? (isZh ? '添加中...' : 'Adding...') : (isZh ? '添加' : 'Add')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}