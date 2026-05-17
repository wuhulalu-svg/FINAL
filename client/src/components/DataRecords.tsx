import { useState } from 'react';
import { User, HealthRecord } from '../App';
import { Calendar, Trash2, Download, Eye, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface DataRecordsProps {
  user: User | null;
  healthRecords: HealthRecord[];
  onDeleteRecord: (date: string) => void;
  onDeleteAllRecords?: () => void;  // 新增：一键删除所有记录
}

export function DataRecords({ user, healthRecords, onDeleteRecord, onDeleteAllRecords }: DataRecordsProps) {
  const { t, formatDate, formatShortDate } = useLanguage();
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const metricLabels: Record<string, string> = {
    weight: '体重 (kg)',
    bmi: 'BMI',
    body_fat: '体脂率 (%)',
    body_water: '体水分量 (kg)',
    body_fat_mass: '脂肪量 (kg)',
    bone_mass: '骨盐量 (kg)',
    protein: '蛋白质量 (kg)',
    muscle_mass: '肌肉量 (kg)',
    heart_rate: '心率 (bpm)',
    blood_pressure: '血压 (mmHg)',
    blood_sugar: '血糖 (mmol/L)',
    sleep_level: '睡眠等级',
    steps: '步数',
    calories: '卡路里 (kcal)',
    visceral_fat: '内脏脂肪等级',
    basal_metabolic_rate: '基础代谢率 (kcal)',
    body_age: '身体年龄 (岁)',
  };

  const handleExport = () => {
    if (healthRecords.length === 0) return;
    
    const headers = [t('date'), 'Weight(kg)', 'BMI', 'Body Fat(%)', 'Heart Rate(bpm)', 'Sleep', 'Steps', 'Calories(kcal)'];
    const rows = healthRecords.map(record => [
      record.date,
      record.weight || '',
      record.bmi || '',
      record.body_fat || '',
      record.heart_rate || '',
      record.sleep_level || '',
      record.steps || '',
      record.calories || '',
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAll = () => {
    setShowConfirmDelete(true);
  };

  const confirmDeleteAll = () => {
    if (onDeleteAllRecords) {
      onDeleteAllRecords();
    }
    setShowConfirmDelete(false);
  };

  const cancelDeleteAll = () => {
    setShowConfirmDelete(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* 确认删除弹窗 */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {t('confirmDeleteAll')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('deleteAllWarning')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDeleteAll}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('confirm')}
              </button>
              <button
                onClick={cancelDeleteAll}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gray-800 dark:text-white text-2xl font-bold mb-2">{t('dataRecordsTitle')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('dataRecordsDesc')}</p>
        </div>
        <div className="flex gap-3">
          {healthRecords.length > 0 && (
            <>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={18} />
                <span>{t('exportCSV')}</span>
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={18} />
                <span>{t('deleteAll')}</span>
              </button>
            </>
          )}
        </div>
      </header>

      <div className="space-y-4">
        {healthRecords.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <Calendar className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-gray-800 dark:text-white text-lg font-medium mb-2">{t('noDataRecords')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('addDataFirst')}</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
              {t('totalRecords')}: {healthRecords.length}
            </div>
            {healthRecords.map((record) => (
              <div key={record.date} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-white" size={20} />
                    <h3 className="text-white font-semibold">{formatDate(record.date)}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedRecord(selectedRecord?.date === record.date ? null : record)}
                      className="px-3 py-1 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm flex items-center gap-1"
                    >
                      <Eye size={14} />
                      {selectedRecord?.date === record.date ? t('collapse') : t('viewDetails')}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`${t('confirmDelete')} ${formatDate(record.date)} ${t('dataFor')}`)) {
                          onDeleteRecord(record.date);
                        }
                      }}
                      className="px-3 py-1 bg-red-500/80 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      {t('delete')}
                    </button>
                  </div>
                </div>
                
                {selectedRecord?.date === record.date && (
                  <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {Object.entries(record).map(([key, value]) => {
                        if (key === 'date' || key === 'id' || key === 'user_id' || key === 'created_at' || value === undefined || value === null) return null;
                        const label = metricLabels[key] || key;
                        const displayValue = typeof value === 'number' ? value.toFixed(1) : value;
                        return (
                          <div key={key} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white">{displayValue}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}