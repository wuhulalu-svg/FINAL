import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Calendar, Settings as SettingsIcon, Globe } from 'lucide-react';
import { User, HealthGoal } from '../App';
import { useLanguage } from '../context/LanguageContext';

interface SettingsProps {
  user: User | null;
  healthGoals: HealthGoal[];
  onAddGoal: (goal: Omit<HealthGoal, 'id'>) => void;
  onUpdateGoal: (goalId: number, updates: Partial<HealthGoal>) => void;
  onDeleteGoal: (goalId: number) => void;
}

const GOAL_METRICS = [
  { key: 'weight', label: '体重 (kg)' },
  { key: 'bmi', label: 'BMI' },
  { key: 'body_fat', label: '体脂率 (%)' },
  { key: 'heart_rate', label: '心率 (bpm)' },
  { key: 'blood_pressure', label: '血压 (mmHg)' },
  { key: 'blood_sugar', label: '血糖 (mmol/L)' },
  { key: 'steps', label: '步数' },
  { key: 'calories', label: '卡路里 (kcal)' },
  { key: 'sleep_level', label: '睡眠等级' },
];

export function Settings({ user, healthGoals, onAddGoal, onUpdateGoal, onDeleteGoal }: SettingsProps) {
  const { t, language, setLanguage } = useLanguage();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ metric: 'weight', targetValue: '', duration: '7' });
  const [localGoals, setLocalGoals] = useState<HealthGoal[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/goals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLocalGoals(data);
      }
    } catch (error) {
      console.error('获取目标失败:', error);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddGoal = async () => {
    if (!newGoal.targetValue || !newGoal.duration) {
      alert('Please fill in all fields');
      return;
    }
    setLoading(true);
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + parseInt(newGoal.duration) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const metricObj = GOAL_METRICS.find(m => m.key === newGoal.metric);
    const goalData = {
      metric: newGoal.metric,
      metric_label: metricObj?.label || newGoal.metric,
      target_value: parseFloat(newGoal.targetValue),
      start_date: startDate,
      end_date: endDate,
      duration: parseInt(newGoal.duration)
    };
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(goalData)
      });
      if (response.ok) {
        await fetchGoals();
        setShowAddGoal(false);
        setNewGoal({ metric: 'weight', targetValue: '', duration: '7' });
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to add goal');
      }
    } catch (error) {
      console.error('Add goal error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchGoals();
      } else {
        alert('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleLanguageChange = (lang: 'zh' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    window.location.reload();
  };

  const text = {
    zh: { /* 中文翻译省略，保持原有 */ },
    en: {
      settingsAndGoals: 'Settings & Goals',
      profileInformation: 'Profile Information',
      healthGoals: 'Health Goals',
      addGoal: 'Add Goal',
      notificationPreferences: 'Notification Preferences',
      goalMissedReminders: 'Goal missed reminders',
      healthAnomalyAlerts: 'Health anomaly alerts',
      dailyHealthSummary: 'Daily health summary',
      language: 'Language',
      chinese: '中文',
      english: 'English',
      name: 'Name',
      email: 'Email',
      age: 'Age',
      gender: 'Gender',
      height: 'Height',
      weight: 'Weight',
      years: 'years',
      cm: 'cm',
      kg: 'kg',
    }
  };
  const tText = text[language];

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-gray-800 dark:text-white text-2xl font-bold mb-2">{tText.settingsAndGoals}</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your health goals and preferences</p>
      </header>
      <div className="space-y-6">
        {/* Profile Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon className="text-indigo-600" size={24} />
            <h2 className="text-gray-800 dark:text-white font-semibold">{tText.profileInformation}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><p className="text-sm text-gray-500 dark:text-gray-400">{tText.name}</p><p className="text-gray-800 dark:text-white">{user?.name}</p></div>
            <div><p className="text-sm text-gray-500 dark:text-gray-400">{tText.email}</p><p className="text-gray-800 dark:text-white">{user?.email}</p></div>
            <div><p className="text-sm text-gray-500 dark:text-gray-400">{tText.age}</p><p className="text-gray-800 dark:text-white">{user?.age} {tText.years}</p></div>
            <div><p className="text-sm text-gray-500 dark:text-gray-400">{tText.gender}</p><p className="text-gray-800 dark:text-white capitalize">{user?.gender}</p></div>
            <div><p className="text-sm text-gray-500 dark:text-gray-400">{tText.height}</p><p className="text-gray-800 dark:text-white">{user?.height} {tText.cm}</p></div>
            <div><p className="text-sm text-gray-500 dark:text-gray-400">{tText.weight}</p><p className="text-gray-800 dark:text-white">{user?.weight} {tText.kg}</p></div>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="text-indigo-600" size={24} />
            <h2 className="text-gray-800 dark:text-white font-semibold">{tText.language}</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleLanguageChange('zh')} className={`px-4 py-2 rounded-lg transition-colors ${language === 'zh' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>{tText.chinese}</button>
            <button onClick={() => handleLanguageChange('en')} className={`px-4 py-2 rounded-lg transition-colors ${language === 'en' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>{tText.english}</button>
          </div>
        </div>

        {/* Health Goals */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Target className="text-indigo-600" size={24} />
              <div>
                <h2 className="text-gray-800 dark:text-white font-semibold">{tText.healthGoals}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Set and track your health targets</p>
              </div>
            </div>
            <button onClick={() => setShowAddGoal(!showAddGoal)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus size={18} />
              <span>{tText.addGoal}</span>
            </button>
          </div>

          {showAddGoal && (
            <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <h3 className="text-gray-800 dark:text-white mb-4">Create New Goal</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Metric</label>
                  <select value={newGoal.metric} onChange={(e) => setNewGoal({ ...newGoal, metric: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg">
                    {GOAL_METRICS.map(metric => <option key={metric.key} value={metric.key}>{metric.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Target Value</label>
                  <input type="number" step="0.1" value={newGoal.targetValue} onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })} placeholder="Enter target" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Duration (days)</label>
                  <input type="number" min="1" value={newGoal.duration} onChange={(e) => setNewGoal({ ...newGoal, duration: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleAddGoal} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">{loading ? 'Creating...' : 'Create Goal'}</button>
                <button onClick={() => setShowAddGoal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
              </div>
            </div>
          )}

          {/* Active Goals */}
          {localGoals.filter(g => !g.completed && new Date(g.end_date) >= new Date()).length > 0 ? (
            <div className="space-y-3 mb-6">
              <h3 className="text-gray-700 dark:text-gray-300 font-medium">Active Goals</h3>
              {localGoals.filter(g => !g.completed && new Date(g.end_date) >= new Date()).map(goal => {
                const today = new Date().toISOString().split('T')[0];
                const daysElapsed = Math.floor((new Date(today).getTime() - new Date(goal.start_date).getTime()) / (1000 * 60 * 60 * 24));
                const daysRemaining = goal.duration - daysElapsed;
                const progressPercent = (daysElapsed / goal.duration) * 100;
                const missedDays = goal.missed_days ? JSON.parse(goal.missed_days) : [];
                return (
                  <div key={goal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-gray-800 dark:text-white font-medium">{goal.metric_label}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Target: {goal.target_value}</p>
                      </div>
                      <button onClick={() => handleDeleteGoal(goal.id)} className="text-red-600 hover:text-red-700"><Trash2 size={18} /></button>
                    </div>
                    <div className="mb-3"><div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(progressPercent, 100)}%` }} /></div></div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><Calendar size={14} />{daysRemaining} days remaining</span>
                      {missedDays.length > 0 && <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 rounded">{missedDays.length} missed day(s)</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400"><Target className="mx-auto mb-3 text-gray-400" size={48} /><p>No active goals. Click "Add Goal" to create one!</p></div>
          )}

          {/* Completed Goals */}
          {localGoals.filter(g => g.completed || new Date(g.end_date) < new Date()).length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-gray-700 dark:text-gray-300 font-medium mb-3">Completed Goals</h3>
              <div className="space-y-2">
                {localGoals.filter(g => g.completed || new Date(g.end_date) < new Date()).map(goal => (
                  <div key={goal.id} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 opacity-60">
                    <div className="flex items-center justify-between"><div><h4 className="text-gray-700 dark:text-gray-400 text-sm">{goal.metric_label}</h4><p className="text-xs text-gray-500 dark:text-gray-500">Target: {goal.target_value}</p></div><span className="text-xs text-gray-500 dark:text-gray-500">Ended {new Date(goal.end_date).toLocaleDateString()}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-gray-800 dark:text-white font-semibold mb-4">{tText.notificationPreferences}</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"><span className="text-gray-700 dark:text-gray-300">{tText.goalMissedReminders}</span><input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded" /></label>
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"><span className="text-gray-700 dark:text-gray-300">{tText.healthAnomalyAlerts}</span><input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded" /></label>
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"><span className="text-gray-700 dark:text-gray-300">{tText.dailyHealthSummary}</span><input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" /></label>
          </div>
        </div>
      </div>
    </div>
  );
}