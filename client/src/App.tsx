import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Dashboard } from './components/Dashboard';
import { Navigation } from './components/Navigation';
import { DataImport } from './components/DataImport';
import { HealthAnalysis } from './components/HealthAnalysis';
import { AIAssistant } from './components/AIAssistant';
import { Alerts } from './components/Alerts';
import { Profile } from './components/Profile';
import { DataRecords } from './components/DataRecords';
import { HealthSquare } from './components/HealthSquare';
import { AdminPanel } from './components/AdminPanel';
import { MedicalReports } from './components/MedicalReports';
import { HealthSummary } from './components/HealthSummary';
import { GoalsSettings } from './components/GoalsSettings';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI, healthAPI, goalsAPI, alertsAPI, setToken, clearToken, getToken } from './services/api';
import { useLanguage } from './context/LanguageContext';

export type User = {
  id?: number;
  name: string;
  email: string;
  password?: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
};

export type HealthRecord = {
  id?: number;
  date: string;
  weight?: number;
  bmi?: number;
  body_fat?: number;
  body_fat_mass?: number;
  body_water?: number;
  body_water_rate?: number;
  protein?: number;
  protein_rate?: number;
  muscle_mass?: number;
  muscle_rate?: number;
  skeletal_muscle_mass?: number;
  bone_mass?: number;
  bone_mass_rate?: number;
  lean_body_mass?: number;
  visceral_fat?: number;
  waist_hip_ratio?: number;
  body_age?: number;
  basal_metabolic_rate?: number;
  heart_rate?: number;
  blood_pressure?: string;
  blood_sugar?: number;
  blood_oxygen?: number;
  sleep_level?: number;
  stress_level?: number;
  steps?: number;
  calories?: number;
};

export type HealthGoal = {
  id: number;
  metric: string;
  metricLabel: string;
  targetValue: number;
  startDate: string;
  endDate: string;
  duration: number;
  completed: boolean;
  missedDays: string[];
};

export type Alert = {
  id: number;
  type: 'warning' | 'critical';
  title: string;
  description: string;
  date: string;
  metric?: string;
  read: boolean;
};

export type Page = 'dashboard' | 'records' | 'import' | 'analysis' | 'assistant' | 'alerts' | 'settings' | 'profile' | 'square' | 'admin' | 'reports' | 'summary' | 'goals';

function AppContent() {
  const { language } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [healthGoals, setHealthGoals] = useState<HealthGoal[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // 检测健康异常并生成告警（避免重复）
  const checkHealthAnomalies = async (records: HealthRecord[]) => {
    if (!records || records.length < 3) return;
    const isZh = language === 'zh';
    try {
      const existingAlerts = await alertsAPI.getAll();
      const existingAlertKeys = new Set(
        existingAlerts.map(a => `${a.metric}_${a.date.split('T')[0]}`)
      );
      const alertsToAdd: Omit<Alert, 'id'>[] = [];
      const today = new Date().toISOString().split('T')[0];
      const last7Days = records.slice(0, 7);
      
      const heartRates = last7Days.map(r => r.heart_rate).filter(v => v !== undefined) as number[];
      if (heartRates.length >= 3) {
        const avgHeartRate = heartRates.reduce((a, b) => a + b, 0) / heartRates.length;
        const key = `heart_rate_${today}`;
        if (!existingAlertKeys.has(key)) {
          if (avgHeartRate > 100) {
            alertsToAdd.push({
              type: 'critical',
              title: isZh ? '!!! 心率过高 !!!' : '!!! High Heart Rate !!!',
              description: isZh 
                ? `您过去${heartRates.length}天的平均心率为${avgHeartRate.toFixed(0)} bpm，高于正常范围(60-100 bpm)。请及时就医检查。`
                : `Your average heart rate over the past ${heartRates.length} days was ${avgHeartRate.toFixed(0)} bpm, which is higher than the normal range (60-100 bpm). Please consult a doctor.`,
              date: today,
              metric: 'heart_rate',
              read: false
            });
          } else if (avgHeartRate < 50) {
            alertsToAdd.push({
              type: 'critical',
              title: isZh ? '!!! 心率过低 !!!' : '!!! Low Heart Rate !!!',
              description: isZh
                ? `您过去${heartRates.length}天的平均心率为${avgHeartRate.toFixed(0)} bpm，低于正常范围(60-100 bpm)。请及时就医检查。`
                : `Your average heart rate over the past ${heartRates.length} days was ${avgHeartRate.toFixed(0)} bpm, which is lower than the normal range (60-100 bpm). Please consult a doctor.`,
              date: today,
              metric: 'heart_rate',
              read: false
            });
          }
        }
      }

      const bloodPressures = last7Days.map(r => r.blood_pressure).filter(v => v && typeof v === 'string') as string[];
      if (bloodPressures.length >= 3) {
        let highCount = 0;
        let highValues: number[] = [];
        for (const bp of bloodPressures) {
          if (bp && bp.includes('/')) {
            const parts = bp.split('/');
            if (parts.length === 2) {
              const systolic = parseInt(parts[0]);
              const diastolic = parseInt(parts[1]);
              if (!isNaN(systolic) && !isNaN(diastolic) && (systolic > 140 || diastolic > 90)) {
                highCount++;
                highValues.push(systolic);
              }
            }
          }
        }
        const key = `blood_pressure_${today}`;
        if (highCount >= 3 && !existingAlertKeys.has(key) && highValues.length > 0) {
          const avgHigh = highValues.reduce((a, b) => a + b, 0) / highValues.length;
          alertsToAdd.push({
            type: 'critical',
            title: isZh ? '!!! 血压异常 !!!' : '!!! Abnormal Blood Pressure !!!',
            description: isZh
              ? `您过去${bloodPressures.length}天中有${highCount}天血压偏高，平均收缩压${avgHigh.toFixed(0)} mmHg。请监测血压并及时就医。`
              : `You had high blood pressure for ${highCount} out of ${bloodPressures.length} days in the past week. Average systolic pressure was ${avgHigh.toFixed(0)} mmHg. Please consult a doctor.`,
            date: today,
            metric: 'blood_pressure',
            read: false
          });
        }
      }

      const bloodSugars = last7Days.map(r => r.blood_sugar).filter(v => v !== undefined) as number[];
      if (bloodSugars.length >= 3) {
        const avgBloodSugar = bloodSugars.reduce((a, b) => a + b, 0) / bloodSugars.length;
        const key = `blood_sugar_${today}`;
        if (avgBloodSugar > 6.1 && !existingAlertKeys.has(key)) {
          alertsToAdd.push({
            type: 'critical',
            title: isZh ? '!!! 血糖偏高 !!!' : '!!! High Blood Sugar !!!',
            description: isZh
              ? `您过去${bloodSugars.length}天的平均血糖为${avgBloodSugar.toFixed(1)} mmol/L，高于正常范围(3.9-6.1 mmol/L)。请注意饮食控制。`
              : `Your average blood sugar over the past ${bloodSugars.length} days was ${avgBloodSugar.toFixed(1)} mmol/L, which is higher than the normal range (3.9-6.1 mmol/L). Please focus on dietary control.`,
            date: today,
            metric: 'blood_sugar',
            read: false
          });
        } else if (avgBloodSugar < 3.9 && !existingAlertKeys.has(key)) {
          alertsToAdd.push({
            type: 'critical',
            title: isZh ? '!!! 血糖偏低 !!!' : '!!! Low Blood Sugar !!!',
            description: isZh
              ? `您过去${bloodSugars.length}天的平均血糖为${avgBloodSugar.toFixed(1)} mmol/L，低于正常范围(3.9-6.1 mmol/L)。请注意补充能量。`
              : `Your average blood sugar over the past ${bloodSugars.length} days was ${avgBloodSugar.toFixed(1)} mmol/L, which is lower than the normal range (3.9-6.1 mmol/L). Please ensure adequate nutrition.`,
            date: today,
            metric: 'blood_sugar',
            read: false
          });
        }
      }

      const bmis = last7Days.map(r => r.bmi).filter(v => v !== undefined) as number[];
      if (bmis.length >= 3) {
        const avgBmi = bmis.reduce((a, b) => a + b, 0) / bmis.length;
        const key = `bmi_${today}`;
        if (avgBmi > 28 && !existingAlertKeys.has(key)) {
          alertsToAdd.push({
            type: 'warning',
            title: isZh ? '⚠️ BMI超标' : '⚠️ High BMI',
            description: isZh
              ? `您的BMI为${avgBmi.toFixed(1)}，属于肥胖范围。建议控制饮食，增加运动。`
              : `Your BMI is ${avgBmi.toFixed(1)}, which is in the obese range. It is recommended to control your diet and increase exercise.`,
            date: today,
            metric: 'bmi',
            read: false
          });
        } else if (avgBmi < 18.5 && !existingAlertKeys.has(key)) {
          alertsToAdd.push({
            type: 'warning',
            title: isZh ? '⚠️ BMI偏低' : '⚠️ Low BMI',
            description: isZh
              ? `您的BMI为${avgBmi.toFixed(1)}，属于偏瘦范围。建议增加营养摄入。`
              : `Your BMI is ${avgBmi.toFixed(1)}, which is in the underweight range. It is recommended to increase your nutritional intake.`,
            date: today,
            metric: 'bmi',
            read: false
          });
        }
      }

      const bodyFats = last7Days.map(r => r.body_fat).filter(v => v !== undefined) as number[];
      if (bodyFats.length >= 3) {
        const avgBodyFat = bodyFats.reduce((a, b) => a + b, 0) / bodyFats.length;
        const key = `body_fat_${today}`;
        const isMale = user?.gender === 'male';
        const threshold = isMale ? 25 : 32;
        if (avgBodyFat > threshold && !existingAlertKeys.has(key)) {
          alertsToAdd.push({
            type: 'warning',
            title: isZh ? '⚠️ 体脂率过高' : '⚠️ High Body Fat',
            description: isZh
              ? `您的体脂率为${avgBodyFat.toFixed(1)}%，高于健康范围。建议加强有氧运动。`
              : `Your body fat percentage is ${avgBodyFat.toFixed(1)}%, which is higher than the healthy range. It is recommended to increase aerobic exercise.`,
            date: today,
            metric: 'body_fat',
            read: false
          });
        }
      }

      const sleepLevels = last7Days.map(r => r.sleep_level).filter(v => v !== undefined) as number[];
      if (sleepLevels.length >= 3) {
        const avgSleep = sleepLevels.reduce((a, b) => a + b, 0) / sleepLevels.length;
        const key = `sleep_level_${today}`;
        if (avgSleep < 60 && !existingAlertKeys.has(key)) {
          alertsToAdd.push({
            type: 'warning',
            title: isZh ? '⚠️ 睡眠质量差' : '⚠️ Poor Sleep Quality',
            description: isZh
              ? `您过去${sleepLevels.length}天的平均睡眠评分为${avgSleep.toFixed(0)}分，低于健康标准。建议保持规律作息。`
              : `Your average sleep score over the past ${sleepLevels.length} days is ${avgSleep.toFixed(0)}, which is below the healthy standard. It is recommended to maintain a regular sleep schedule.`,
            date: today,
            metric: 'sleep_level',
            read: false
          });
        }
      }

      const steps = last7Days.map(r => r.steps).filter(v => v !== undefined) as number[];
      if (steps.length >= 3) {
        const avgSteps = steps.reduce((a, b) => a + b, 0) / steps.length;
        const key = `steps_${today}`;
        if (avgSteps < 5000 && !existingAlertKeys.has(key)) {
          alertsToAdd.push({
            type: 'warning',
            title: isZh ? '⚠️ 运动量不足' : '⚠️ Insufficient Activity',
            description: isZh
              ? `您过去${steps.length}天的平均步数为${Math.round(avgSteps)}步，低于推荐值(8000步/天)。建议增加日常活动量。`
              : `Your average daily steps over the past ${steps.length} days is ${Math.round(avgSteps)}, which is below the recommended value (8000 steps/day). It is recommended to increase your daily activity.`,
            date: today,
            metric: 'steps',
            read: false
          });
        }
      }

      const weights = last7Days.map(r => r.weight).filter(v => v !== undefined) as number[];
      if (weights.length >= 5) {
        const firstWeight = weights[0];
        const lastWeight = weights[weights.length - 1];
        const change = lastWeight - firstWeight;
        const key = `weight_trend_${today}`;
        if (Math.abs(change) > 2 && !existingAlertKeys.has(key)) {
          alertsToAdd.push({
            type: 'warning',
            title: change > 0 
              ? (isZh ? '⚠️ 体重快速上升' : '⚠️ Rapid Weight Gain')
              : (isZh ? '⚠️ 体重快速下降' : '⚠️ Rapid Weight Loss'),
            description: change > 0
              ? (isZh
                ? `${weights.length}天内体重增加了${Math.abs(change).toFixed(1)}kg，变化过快。请注意健康管理。`
                : `Your weight increased by ${Math.abs(change).toFixed(1)}kg in ${weights.length} days, which is too rapid. Please pay attention to health management.`)
              : (isZh
                ? `${weights.length}天内体重减少了${Math.abs(change).toFixed(1)}kg，变化过快。请注意健康管理。`
                : `Your weight decreased by ${Math.abs(change).toFixed(1)}kg in ${weights.length} days, which is too rapid. Please pay attention to health management.`),
            date: today,
            metric: 'weight',
            read: false
          });
        }
      }

      const muscleMasses = last7Days.map(r => r.muscle_mass).filter(v => v !== undefined) as number[];
      if (muscleMasses.length >= 3) {
        const avgMuscle = muscleMasses.reduce((a, b) => a + b, 0) / muscleMasses.length;
        const key = `muscle_mass_${today}`;
        const isMale = user?.gender === 'male';
        const threshold = isMale ? 35 : 25;
        if (avgMuscle < threshold && !existingAlertKeys.has(key)) {
          alertsToAdd.push({
            type: 'warning',
            title: isZh ? '⚠️ 肌肉量不足' : '⚠️ Insufficient Muscle Mass',
            description: isZh
              ? `您的肌肉量为${avgMuscle.toFixed(1)}kg，低于健康标准。建议增加力量训练。`
              : `Your muscle mass is ${avgMuscle.toFixed(1)}kg, which is below the healthy standard. It is recommended to increase strength training.`,
            date: today,
            metric: 'muscle_mass',
            read: false
          });
        }
      }

      for (const alert of alertsToAdd) {
        try {
          await alertsAPI.create(alert);
        } catch (error) {
          console.error('Failed to create alert:', error);
        }
      }
    } catch (error) {
      console.error('Error in checkHealthAnomalies:', error);
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [records, goals, userAlerts] = await Promise.all([
        healthAPI.getRecords(),
        goalsAPI.getAll(),
        alertsAPI.getAll(),
      ]);
      setHealthRecords(records);
      setHealthGoals(goals);
      setAlerts(userAlerts);
      
      const today = new Date().toISOString().split('T')[0];
      const hasTodayAlert = userAlerts.some(a => a.date === today);
      if (!hasTodayAlert && records.length > 0) {
        await checkHealthAnomalies(records);
        const newAlerts = await alertsAPI.getAll();
        setAlerts(newAlerts);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (token) {
      authAPI.getMe()
        .then((userData) => {
          setUser(userData);
          setIsLoggedIn(true);
          loadUserData();
        })
        .catch(() => {
          clearToken();
          setIsLoggedIn(false);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await authAPI.login(email, password);
      setToken(result.token);
      setUser(result.user);
      setIsLoggedIn(true);
      await loadUserData();
      return true;
    } catch (error: any) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const handleRegister = async (userData: User): Promise<boolean> => {
    try {
      const result = await authAPI.register(userData);
      setToken(result.token);
      setUser(result.user);
      setIsLoggedIn(true);
      setShowRegister(false);
      return true;
    } catch (error: any) {
      console.error('Register failed:', error);
      return false;
    }
  };

  const handleLogout = () => {
    clearToken();
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage('dashboard');
    setHealthRecords([]);
    setHealthGoals([]);
    setAlerts([]);
  };

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const addHealthRecord = async (record: HealthRecord) => {
    try {
      console.log('💾 Saving health record...');
      await healthAPI.saveRecord(record);
      console.log('✅ Health record saved successfully');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('🔄 Reloading data...');
      
      // 并行加载所有数据
      const [records, goals, userAlerts] = await Promise.all([
        healthAPI.getRecords(),
        goalsAPI.getAll(),
        alertsAPI.getAll(),
      ]);
      
      setHealthRecords(records);
      setHealthGoals(goals);
      setAlerts(userAlerts);
      
      console.log('✅ Data reloaded');
      
      // 触发后端告警生成
      console.log('🔍 Generating alerts...');
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/alerts/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ 告警生成完成: ${result.message}`);
          
          // 重新加载告警
          const finalAlerts = await alertsAPI.getAll();
          setAlerts(finalAlerts);
        } else {
          console.error('告警生成失败:', await response.text());
        }
      } catch (alertError) {
        console.error('告警生成请求失败:', alertError);
      }
      
    } catch (error) {
      console.error('❌ Failed to save health record:', error);
      throw error;
    }
  };

  const addHealthGoal = async (goal: Omit<HealthGoal, 'id'>) => {
    try {
      await goalsAPI.create(goal);
      await loadUserData();
    } catch (error) {
      console.error('Failed to add goal:', error);
      const lang = language === 'zh';
      alert(lang ? '添加目标失败，请重试' : 'Failed to add goal, please try again');
    }
  };

  const updateHealthGoal = async (goalId: number, updates: Partial<HealthGoal>) => {
    try {
      await goalsAPI.update(goalId, updates);
      await loadUserData();
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  };

  const deleteHealthGoal = async (goalId: number) => {
    try {
      await goalsAPI.delete(goalId);
      await loadUserData();
    } catch (error) {
      console.error('Failed to delete goal:', error);
      const lang = language === 'zh';
      alert(lang ? '删除目标失败，请重试' : 'Failed to delete goal, please try again');
    }
  };

  const markAlertAsRead = async (alertId: number) => {
    try {
      await alertsAPI.markAsRead(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      ));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const deleteHealthRecord = async (date: string) => {
    try {
      await healthAPI.deleteRecord(date);
      await loadUserData();
      const lang = language === 'zh';
      alert(lang ? '删除成功' : 'Delete successful');
    } catch (error) {
      console.error('Failed to delete record:', error);
      const lang = language === 'zh';
      alert(lang ? '删除失败' : 'Delete failed');
    }
  };

  const deleteAllHealthRecords = async () => {
    const lang = language === 'zh';
    const confirmed = window.confirm(
      lang ? '确定要删除所有健康记录吗？此操作不可撤销！' : 'Are you sure you want to delete all health records? This action cannot be undone!'
    );
    if (!confirmed) return;
    try {
      const dates = healthRecords.map(record => record.date);
      await Promise.all(dates.map(date => healthAPI.deleteRecord(date)));
      await loadUserData();
      alert(lang ? '已删除所有记录' : 'All records deleted');
    } catch (error) {
      console.error('Failed to delete all records:', error);
      alert(lang ? '删除失败，请重试' : 'Delete failed, please try again');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{language === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    if (showRegister) {
      return <Register onRegister={handleRegister} onBackToLogin={() => setShowRegister(false)} />;
    }
    return <Login onLogin={handleLogin} onShowRegister={() => setShowRegister(true)} />;
  }

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} user={user} unreadAlertsCount={unreadAlertsCount} />
      <AnimatePresence mode="wait">
        <motion.main
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="lg:ml-64 p-4 sm:p-6 pt-16 lg:pt-6"
        >
          {currentPage === 'dashboard' && <Dashboard user={user} healthRecords={healthRecords} />}
          {currentPage === 'records' && (
            <DataRecords 
              user={user} 
              healthRecords={healthRecords} 
              onDeleteRecord={deleteHealthRecord}
              onDeleteAllRecords={deleteAllHealthRecords}
            />
          )}
          {currentPage === 'import' && <DataImport user={user} onAddRecord={addHealthRecord} healthRecords={healthRecords} />}
          {currentPage === 'analysis' && <HealthAnalysis user={user} healthRecords={healthRecords} />}
          {currentPage === 'assistant' && <AIAssistant user={user} healthRecords={healthRecords} />}
          {currentPage === 'alerts' && (
            <Alerts
              user={user}
              alerts={alerts}
              healthGoals={healthGoals}
              onMarkAsRead={markAlertAsRead}
            />
          )}
          {currentPage === 'settings' && (
            <GoalsSettings
              user={user}
              healthGoals={healthGoals}
              onAddGoal={addHealthGoal}
              onUpdateGoal={updateHealthGoal}
              onDeleteGoal={deleteHealthGoal}
            />
          )}
          {currentPage === 'profile' && (
            <Profile 
              user={user} 
              onUpdateUser={async (updatedUser) => {
                try {
                  await authAPI.updateMe(updatedUser);
                  setUser(updatedUser);
                } catch (error) {
                  console.error('Failed to update user:', error);
                  const lang = language === 'zh';
                  alert(lang ? '更新失败，请重试' : 'Update failed, please try again');
                }
              }} 
            />
          )}
          {currentPage === 'square' && <HealthSquare userId={user?.id || 0} userName={user?.name || ''} />}
          {currentPage === 'reports' && <MedicalReports user={user} />}
          {currentPage === 'summary' && <HealthSummary user={user} />}
          {currentPage === 'goals' && (
            <GoalsSettings
              user={user}
              healthGoals={healthGoals}
              onAddGoal={addHealthGoal}
              onUpdateGoal={updateHealthGoal}
              onDeleteGoal={deleteHealthGoal}
            />
          )}
          {currentPage === 'admin' && <AdminPanel />}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}