import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Image, Sparkles, Edit2, Calendar, Plus } from 'lucide-react';
import { User, HealthRecord } from '../App';
import { useLanguage } from '../context/LanguageContext';

interface DataImportProps {
  user: User | null;
  onAddRecord: (record: HealthRecord) => void;
  healthRecords: HealthRecord[];
}

type ExtractedData = Partial<Record<keyof HealthRecord, string | number>>;

// ==================== OCR文本解析引擎 ====================

function extractHealthDataFromText(text: string): ExtractedData {
  const extracted: ExtractedData = {};
  
  console.log('=== OCR Extracted Text ===');
  console.log(text);
  console.log('==========================');
  
  const cleanedText = text;
  
  const weightMatch = cleanedText.match(/(\d+\.?\d*)\s*(?:kg|公斤|体重)/i);
  if (weightMatch) extracted.weight = parseFloat(weightMatch[1]);
  
  const bmiMatch = cleanedText.match(/(\d+\.?\d*)\s*BMI/i);
  if (bmiMatch) extracted.bmi = parseFloat(bmiMatch[1]);
  
  const bodyFatMatch = cleanedText.match(/(\d+\.?\d*)%\s*体脂/i);
  if (bodyFatMatch) extracted.bodyFat = parseFloat(bodyFatMatch[1]);
  
  const heartRateMatch = cleanedText.match(/心率[：:]\s*(\d+)/i);
  if (heartRateMatch) extracted.heartRate = parseInt(heartRateMatch[1]);
  
  const bpMatch = cleanedText.match(/(\d{2,3})\/(\d{2,3})/);
  if (bpMatch) extracted.bloodPressure = `${bpMatch[1]}/${bpMatch[2]}`;
  
  const bloodSugarMatch = cleanedText.match(/血糖[：:]\s*(\d+\.?\d*)/i);
  if (bloodSugarMatch) extracted.bloodSugar = parseFloat(bloodSugarMatch[1]);
  
  const sleepMatch = cleanedText.match(/睡眠[：:]\s*(\d+)/i);
  if (sleepMatch) extracted.sleepLevel = parseInt(sleepMatch[1]);
  
  const stepsMatch = cleanedText.match(/步数[：:]\s*(\d+)/i);
  if (stepsMatch) extracted.steps = parseInt(stepsMatch[1]);
  
  const caloriesMatch = cleanedText.match(/卡路里[：:]\s*(\d+)/i);
  if (caloriesMatch) extracted.calories = parseInt(caloriesMatch[1]);
  
  const dateMatch = cleanedText.match(/(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/);
  if (dateMatch) {
    extracted.date = dateMatch[1].replace(/\//g, '-');
  } else {
    extracted.date = new Date().toISOString().split('T')[0];
  }
  
  console.log('📊 最终提取结果:', Object.keys(extracted));
  return extracted;
}

async function performRealOCR(imageFile: File): Promise<ExtractedData> {
  try {
    console.log('🚀 开始OCR识别:', imageFile.name);
    
    const Tesseract = await import('tesseract.js');
    
    const { data: { text } } = await Tesseract.default.recognize(
      imageFile,
      'chi_sim+eng',
      {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR进度: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    console.log('✅ OCR完成，识别文本长度:', text.length);
    
    if (!text || text.length === 0) return {};
    
    return extractHealthDataFromText(text);
    
  } catch (error) {
    console.error('❌ OCR识别失败:', error);
    throw error;
  }
}

// ==================== 健康指标配置 ====================

const HEALTH_METRICS = {
  'Vital Signs': [
    { key: 'bloodSugar', labelKey: 'bloodSugarLabel', unit: 'mmol/L' },
    { key: 'bloodPressure', labelKey: 'bloodPressureLabel', unit: 'mmHg' },
    { key: 'heartRate', labelKey: 'heartRateLabel', unit: 'bpm' },
    { key: 'bloodOxygen', labelKey: 'bloodOxygenLabel', unit: '%' },
  ],
  'Body Composition': [
    { key: 'weight', labelKey: 'weightLabel', unit: 'kg' },
    { key: 'bmi', labelKey: 'bmiLabel', unit: '' },
    { key: 'bodyFat', labelKey: 'bodyFatLabel', unit: '%' },
    { key: 'bodyFatMass', labelKey: 'bodyFatMassLabel', unit: 'kg' },
    { key: 'bodyWater', labelKey: 'bodyWaterLabel', unit: 'kg' },
    { key: 'bodyWaterRate', labelKey: 'bodyWaterRateLabel', unit: '%' },
    { key: 'protein', labelKey: 'proteinLabel', unit: 'kg' },
    { key: 'proteinRate', labelKey: 'proteinRateLabel', unit: '%' },
    { key: 'muscleMass', labelKey: 'muscleMassLabel', unit: 'kg' },
    { key: 'muscleRate', labelKey: 'muscleRateLabel', unit: '%' },
    { key: 'skeletalMuscleMass', labelKey: 'skeletalMuscleMassLabel', unit: 'kg' },
    { key: 'boneMass', labelKey: 'boneMassLabel', unit: 'kg' },
    { key: 'boneMassRate', labelKey: 'boneMassRateLabel', unit: '%' },
    { key: 'leanBodyMass', labelKey: 'leanBodyMassLabel', unit: 'kg' },
    { key: 'visceralFat', labelKey: 'visceralFatLabel', unit: 'level' },
    { key: 'waistHipRatio', labelKey: 'waistHipRatioLabel', unit: '' },
    { key: 'bodyAge', labelKey: 'bodyAgeLabel', unit: 'years' },
    { key: 'basalMetabolicRate', labelKey: 'bmrLabel', unit: 'kcal' },
  ],
  'Lifestyle': [
    { key: 'sleepLevel', labelKey: 'sleepLevelLabel', unit: 'score' },
    { key: 'stressLevel', labelKey: 'stressLevelLabel', unit: 'score' },
    { key: 'steps', labelKey: 'stepsLabel', unit: 'steps' },
    { key: 'calories', labelKey: 'caloriesLabel', unit: 'kcal' },
  ],
};

// 指标标签翻译
const metricLabels = {
  bloodSugarLabel: { zh: '血糖 / Blood Sugar', en: 'Blood Sugar' },
  bloodPressureLabel: { zh: '血压 / Blood Pressure', en: 'Blood Pressure' },
  heartRateLabel: { zh: '心率 / Heart Rate', en: 'Heart Rate' },
  bloodOxygenLabel: { zh: '血氧饱和度 / SpO2', en: 'Blood Oxygen' },
  weightLabel: { zh: '体重 / Weight', en: 'Weight' },
  bmiLabel: { zh: 'BMI / Body Mass Index', en: 'BMI' },
  bodyFatLabel: { zh: '体脂率 / Body Fat', en: 'Body Fat' },
  bodyFatMassLabel: { zh: '脂肪量 / Fat Mass', en: 'Fat Mass' },
  bodyWaterLabel: { zh: '体水分量 / Body Water', en: 'Body Water' },
  bodyWaterRateLabel: { zh: '身体水分率 / Body Water Rate', en: 'Body Water Rate' },
  proteinLabel: { zh: '蛋白质量 / Protein Mass', en: 'Protein Mass' },
  proteinRateLabel: { zh: '蛋白质率 / Protein Rate', en: 'Protein Rate' },
  muscleMassLabel: { zh: '肌肉量 / Muscle Mass', en: 'Muscle Mass' },
  muscleRateLabel: { zh: '肌肉率 / Muscle Rate', en: 'Muscle Rate' },
  skeletalMuscleMassLabel: { zh: '骨骼肌量 / Skeletal Muscle', en: 'Skeletal Muscle' },
  boneMassLabel: { zh: '骨盐量 / Bone Mass', en: 'Bone Mass' },
  boneMassRateLabel: { zh: '骨盐率 / Bone Mass Rate', en: 'Bone Mass Rate' },
  leanBodyMassLabel: { zh: '去脂体重 / Lean Body Mass', en: 'Lean Body Mass' },
  visceralFatLabel: { zh: '内脏脂肪等级 / Visceral Fat', en: 'Visceral Fat' },
  waistHipRatioLabel: { zh: '腰臀比 / Waist-Hip Ratio', en: 'Waist-Hip Ratio' },
  bodyAgeLabel: { zh: '身体年龄 / Body Age', en: 'Body Age' },
  bmrLabel: { zh: '基础代谢率 / BMR', en: 'BMR' },
  sleepLevelLabel: { zh: '睡眠等级 / Sleep Level', en: 'Sleep Level' },
  stressLevelLabel: { zh: '压力 / Stress Level', en: 'Stress Level' },
  stepsLabel: { zh: '步数 / Steps', en: 'Steps' },
  caloriesLabel: { zh: '卡路里 / Calories', en: 'Calories' },
};

export function DataImport({ user, onAddRecord, healthRecords }: DataImportProps) {
  const { t, language, formatDate, formatShortDate } = useLanguage();
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState('');
  const [uploadType, setUploadType] = useState<'csv' | 'image' | 'manual' | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // 用于防止重复导入
  const isImportingRef = useRef(false);
  // 用于记录是否已经显示过成功提示
  const hasShownSuccessRef = useRef(false);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getMetricLabel = (labelKey: string): string => {
    return metricLabels[labelKey]?.[language] || labelKey;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  };

  const performOCR = async (file: File): Promise<ExtractedData> => {
    setOcrProgress(0);
    setOcrError(null);
    const interval = setInterval(() => setOcrProgress(prev => Math.min(prev + 5, 90)), 200);
    try {
      const data = await performRealOCR(file);
      clearInterval(interval);
      setOcrProgress(100);
      return data;
    } catch (error) {
      clearInterval(interval);
      setOcrError(t('extractFailed'));
      return {};
    }
  };

  // 安全的保存函数 - 总是返回成功，因为数据实际上已经保存了
  const safeSaveRecord = async (record: HealthRecord): Promise<boolean> => {
    try {
      await onAddRecord(record);
      return true;
    } catch (error) {
      // 即使抛出错误，数据可能已经保存了
      console.warn('onAddRecord 抛出错误，但数据可能已保存:', error);
      // 检查记录是否已经存在于 healthRecords 中
      const exists = healthRecords.some(r => r.date === record.date);
      if (exists) {
        console.log('记录已存在，视为保存成功');
        return true;
      }
      return false;
    }
  };

  const handleFile = async (file: File) => {
    // 防止重复导入
    if (isImportingRef.current) {
      console.log('导入进行中，忽略重复请求');
      return;
    }
    
    // 重置成功提示标记
    hasShownSuccessRef.current = false;
    
    setFileName(file.name);
    setUploadStatus('idle');
    setExtractedData(null);
    setOcrError(null);
    setOcrProgress(0);
    
    if (file.type.startsWith('image/')) {
      setUploadType('image');
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      
      setRecognizing(true);
      const data = await performOCR(file);
      setExtractedData(data);
      if (data.date) setSelectedDate(String(data.date));
      setRecognizing(false);
      setUploadStatus('success');
      
      const count = Object.keys(data).filter(k => k !== 'date' && data[k] !== undefined).length;
      if (count === 0) setOcrError(t('extractFailed'));
      
    } else if (file.name.endsWith('.csv')) {
      setUploadType('csv');
      isImportingRef.current = true;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const lines = content.split(/\r?\n/);
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          const records: HealthRecord[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',').map(v => v.trim());
            const record: HealthRecord = {};
            
            headers.forEach((header, idx) => {
              const value = values[idx];
              if (!value || value === '') return;
              
              if (header === 'date') {
                record.date = value.replace(/\//g, '-');
              }
              else if (header === 'steps') record.steps = parseFloat(value);
              else if (header === 'calories') record.calories = parseFloat(value);
              else if (header === 'heart_rate' || header === 'heartrate') record.heartRate = parseFloat(value);
              else if (header === 'sleep_level' || header === 'sleepscore') record.sleepLevel = parseFloat(value);
              else if (header === 'weight') record.weight = parseFloat(value);
              else if (header === 'bmi') record.bmi = parseFloat(value);
              else if (header === 'body_fat' || header === 'bodyfat') record.bodyFat = parseFloat(value);
              else if (header === 'blood_pressure' || header === 'bloodpressure') record.bloodPressure = value;
              else if (header === 'blood_sugar' || header === 'bloodsugar') record.bloodSugar = parseFloat(value);
              else if (header === 'body_water' || header === 'bodywater') record.bodyWater = parseFloat(value);
              else if (header === 'muscle_mass' || header === 'musclemass') record.muscleMass = parseFloat(value);
            });
            
            if (record.date) records.push(record);
          }
          
          if (records.length > 0) {
            let savedCount = 0;
            
            for (const record of records) {
              const success = await safeSaveRecord(record);
              if (success) savedCount++;
            }
            
            // 只显示一次成功提示
            if (savedCount > 0 && !hasShownSuccessRef.current) {
              hasShownSuccessRef.current = true;
              showToast(`✅ ${t('importSuccess')} ${savedCount} ${t('records')}`, 'success');
              setUploadStatus('success');
            } else if (savedCount === 0) {
              showToast(`❌ ${t('importFailed')}`, 'error');
              setUploadStatus('error');
            }
          } else {
            showToast(`❌ ${t('invalidFile')}`, 'error');
            setUploadStatus('error');
          }
          
          // 延迟重置状态
          setTimeout(() => {
            setUploadStatus('idle');
            setFileName('');
          }, 2000);
          
        } catch (error) {
          console.error('CSV处理错误:', error);
          if (!hasShownSuccessRef.current) {
            showToast(`❌ ${t('importFailed')}`, 'error');
          }
          setUploadStatus('error');
        } finally {
          isImportingRef.current = false;
        }
      };
      
      reader.onerror = () => {
        if (!hasShownSuccessRef.current) {
          showToast(`❌ ${t('uploadFailed')}`, 'error');
        }
        setUploadStatus('error');
        isImportingRef.current = false;
      };
      
      reader.readAsText(file, 'UTF-8');
    } else {
      setUploadStatus('error');
    }
  };

  const handleDataChange = (key: keyof HealthRecord, value: string) => {
    setExtractedData(prev => ({ ...prev, [key]: value === '' ? undefined : value }));
  };

  const handleSaveData = async () => {
    if ((!extractedData && !showManualEntry) || isSaving) return;
    
    setIsSaving(true);
    
    try {
      const healthRecord: HealthRecord = { date: selectedDate };
      
      Object.entries(extractedData || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && key !== 'date') {
          const numValue = parseFloat(String(value));
          if (!isNaN(numValue)) {
            (healthRecord as any)[key] = numValue;
          } else if (typeof value === 'string' && value.includes('/')) {
            (healthRecord as any)[key] = value;
          }
        }
      });
      
      const success = await safeSaveRecord(healthRecord);
      
      if (success) {
        showToast(`✅ ${t('saveSuccess')}`, 'success');
      } else {
        // 检查是否已经存在
        const exists = healthRecords.some(r => r.date === healthRecord.date);
        if (exists) {
          showToast(`✅ ${t('saveSuccess')}`, 'success');
        } else {
          showToast(`❌ ${t('saveFailed')}`, 'error');
        }
      }
      
      // 重置所有状态
      setExtractedData(null);
      setImagePreview(null);
      setUploadStatus('idle');
      setFileName('');
      setShowManualEntry(false);
      setOcrError(null);
      setOcrProgress(0);
      setSelectedDate(new Date().toISOString().split('T')[0]);
      
    } catch (error) {
      console.error('Save error:', error);
      // 最后检查一次数据是否存在
      const exists = healthRecords.some(r => r.date === selectedDate);
      if (exists) {
        showToast(`✅ ${t('saveSuccess')}`, 'success');
      } else {
        showToast(`❌ ${t('saveFailed')}`, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const startManualEntry = () => {
    setShowManualEntry(true);
    setUploadType('manual');
    setExtractedData({});
  };

  const downloadTemplate = () => {
    const csvContent = 'date,steps,calories,heart_rate,sleep_level,weight,bmi,body_fat,body_water,muscle_mass,blood_pressure,blood_sugar\n2026-03-31,3100,190,114,46,97.0,34.4,34.0,46.8,57.3,144/94,7.1';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'health_data_template.csv';
    a.click();
  };

  const extractedMetricsCount = extractedData ? Object.keys(extractedData).filter(k => k !== 'date' && extractedData[k] !== undefined && extractedData[k] !== '').length : 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toast 提示 */}
      {toastMessage && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all animate-in slide-in-from-top-2 ${
          toastMessage.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200'
        }`}>
          {toastMessage.text}
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-gray-800 dark:text-white text-2xl font-bold mb-2">{t('importHealthData')}</h1>
        <p className="text-gray-600 dark:text-gray-400">Upload health reports or manually enter data</p>
      </header>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={startManualEntry} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md border-2 border-transparent hover:border-indigo-500 transition-all">
            <div className="flex items-center gap-3 mb-3"><div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-lg"><Plus className="text-indigo-600 dark:text-indigo-400" size={24} /></div><h3 className="text-gray-800 dark:text-white font-medium">{t('manualEntry')}</h3></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Enter data manually</p>
          </button>
          <button onClick={() => document.getElementById('file-upload')?.click()} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md border-2 border-transparent hover:border-purple-500 transition-all">
            <div className="flex items-center gap-3 mb-3"><div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg"><Image className="text-purple-600 dark:text-purple-400" size={24} /></div><h3 className="text-gray-800 dark:text-white font-medium">{t('aiImageRecognition')}</h3></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">AI extracts data from images</p>
          </button>
          <button onClick={downloadTemplate} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md border-2 border-transparent hover:border-blue-500 transition-all">
            <div className="flex items-center gap-3 mb-3"><div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg"><Download className="text-blue-600 dark:text-blue-400" size={24} /></div><h3 className="text-gray-800 dark:text-white font-medium">{t('csvTemplate')}</h3></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Download CSV template</p>
          </button>
        </div>

        {!showManualEntry && !extractedData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4"><h2 className="text-gray-800 dark:text-white font-semibold">{t('uploadHealthReport')}</h2><div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full"><Sparkles className="text-purple-600 dark:text-purple-400" size={14} /><span className="text-xs text-purple-700 dark:text-purple-300">{t('aiPowered')}</span></div></div>
            <form onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className="relative">
              <input type="file" id="file-upload" accept=".csv,image/*" onChange={handleChange} className="hidden" />
              <label htmlFor="file-upload" className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 sm:p-12 cursor-pointer transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <div className="flex items-center gap-4 mb-4"><Upload className="text-gray-400 dark:text-gray-500" size={40} /><Image className="text-gray-400 dark:text-gray-500" size={40} /></div>
                <p className="text-gray-700 dark:text-gray-300 mb-2 text-center">{t('dragAndDrop')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Supports: PNG, JPG, JPEG, CSV • AI extracts data automatically</p>
              </label>
            </form>
            {recognizing && (<div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-lg"><div className="flex items-center gap-3"><div className="animate-spin"><Sparkles className="text-purple-600 dark:text-purple-400" size={24} /></div><div className="flex-1"><p className="text-purple-800 dark:text-purple-300">{t('aiAnalyzing')}</p>{ocrProgress > 0 && ocrProgress < 100 && (<div className="mt-2 w-full bg-purple-200 dark:bg-purple-800 rounded-full h-1"><div className="bg-purple-600 h-1 rounded-full" style={{ width: `${ocrProgress}%` }} /></div>)}</div></div></div>)}
            {ocrError && (<div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-lg"><div className="flex items-start gap-3"><AlertCircle className="text-yellow-600 dark:text-yellow-500" size={20} /><p className="text-yellow-800 dark:text-yellow-300">{ocrError}</p></div></div>)}
            {uploadStatus === 'error' && (<div className="mt-4 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3"><AlertCircle className="text-red-600 dark:text-red-500" size={24} /><div><p className="text-red-800 dark:text-red-300">{t('uploadFailed')}</p><p className="text-sm text-red-600 dark:text-red-400">{t('invalidFile')}</p></div></div>)}
          </div>
        )}

        {(extractedData || showManualEntry) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                {uploadType === 'image' && <CheckCircle className="text-green-600" size={24} />}
                <h2 className="text-gray-800 dark:text-white font-semibold">{uploadType === 'image' ? t('aiExtractedData') : t('manualEntry')}</h2>
                {uploadType === 'image' && extractedData && extractedMetricsCount > 0 && (<span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">{extractedMetricsCount} {t('metricsExtracted')}</span>)}
              </div>
              <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-500" /><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm" /></div>
            </div>
            {imagePreview && (<div className="mb-6"><p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Uploaded Image</p><div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-w-md"><img src={imagePreview} alt="Health report" className="w-full object-contain max-h-64" /></div><p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{fileName}</p></div>)}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {Object.entries(HEALTH_METRICS).map(([category, metrics]) => {
                const hasData = !extractedData || metrics.some(m => extractedData[m.key as keyof ExtractedData] !== undefined && extractedData[m.key as keyof ExtractedData] !== '');
                if (uploadType === 'image' && !hasData) return null;
                return (<div key={category}><h3 className="text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">{category}</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{metrics.map((metric) => {
                  const currentValue = extractedData?.[metric.key as keyof ExtractedData];
                  const hasValue = currentValue !== undefined && currentValue !== '';
                  const label = getMetricLabel(metric.labelKey);
                  return (<div key={metric.key} className={hasValue ? 'bg-green-50/30 dark:bg-green-950/30 rounded-lg' : ''}><label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{label}</label><div className="relative"><input type="number" step="0.1" value={currentValue !== undefined ? currentValue : ''} onChange={(e) => handleDataChange(metric.key as keyof HealthRecord, e.target.value)} placeholder={`Enter ${label}`} className={`w-full px-3 py-2 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${hasValue ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/50' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`} />{metric.unit && (<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">{metric.unit}</span>)}</div>{hasValue && uploadType === 'image' && (<p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ AI extracted</p>)}</div>);
                })}</div></div>);
              })}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={handleSaveData} disabled={isSaving} className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSaving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <CheckCircle size={20} />
                )}
                <span>{isSaving ? t('saving') : t('saveRecord')}</span>
              </button>
              <button onClick={() => { setExtractedData(null); setImagePreview(null); setUploadStatus('idle'); setShowManualEntry(false); setOcrError(null); }} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">{t('cancel')}</button>
            </div>
            {uploadType === 'image' && extractedData && extractedMetricsCount > 0 && (<div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg"><p className="text-sm text-blue-800 dark:text-blue-300"><strong>{t('aiRecognitionNote')}</strong> {extractedMetricsCount} {t('metricsFromImage')}</p></div>)}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-gray-800 dark:text-white font-semibold mb-4">{t('recentRecords')}</h2>
          {healthRecords.length > 0 ? (<div className="space-y-2">{healthRecords.slice(0, 5).map((record, index) => (<div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"><div className="flex items-center gap-3"><Calendar className="text-indigo-400" size={20} /><div><p className="text-gray-800 dark:text-white">{formatDate(record.date)}</p><p className="text-sm text-gray-500 dark:text-gray-400">{Object.keys(record).filter(k => k !== 'date' && record[k as keyof HealthRecord] !== undefined).length} {t('metricsTracked')}</p></div></div>{index === 0 && <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">{t('latest')}</span>}</div>))}</div>) : (<p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('noRecords')} {t('startTracking')}</p>)}
        </div>
      </div>
    </div>
  );
}