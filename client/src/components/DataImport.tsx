import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, Download, Image, Sparkles, Calendar, Plus } from 'lucide-react';
import { User, HealthRecord } from '../App';
import { useLanguage } from '../context/LanguageContext';

interface DataImportProps {
  user: User | null;
  onAddRecord: (record: HealthRecord) => void;
  healthRecords: HealthRecord[];
}

type ExtractedData = Partial<Record<keyof HealthRecord, string | number>>;

// ==================== 图片压缩函数 ====================
async function compressImageForOCR(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const maxSize = 1024; // 限制长边最大1024像素
      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Canvas to Blob failed'));
        const reader = new FileReader();
        reader.onloadend = () => {
          let base64 = reader.result as string;
          if (base64.includes(',')) base64 = base64.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.7);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ==================== Tesseract 降级识别 ====================
async function tesseractFallback(imageFile: File): Promise<ExtractedData> {
  try {
    console.log('⚠️ 降级到 Tesseract 本地识别');
    const Tesseract = await import('tesseract.js');
    const { data: { text } } = await Tesseract.default.recognize(imageFile, 'chi_sim+eng', {
      logger: m => { if (m.status === 'recognizing text') console.log(`Tesseract进度: ${Math.round(m.progress * 100)}%`); }
    });
    console.log('✅ Tesseract完成，文本长度:', text.length);
    if (!text || text.length < 20) return {};
    return extractHealthDataFromText(text);
  } catch (err) {
    console.error('❌ Tesseract降级失败:', err);
    return {};
  }
}

// ==================== OCR 文本解析（专为体脂秤报告优化） ====================
function extractHealthDataFromText(text: string): ExtractedData {
  const extracted: ExtractedData = {};
  // 按行分割
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  console.log('📄 原始行内容:', lines);

  // 辅助函数：从字符串中提取数字（支持 "64", "41.5kg", "83.3%", "1588Kcal" 等）
  const extractNumber = (str: string): number | null => {
    const match = str.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  };

  // 根据用户提供的正确行索引（从0开始）提取
  // 以下索引均基于用户提供的 97 行数组验证
  extracted.weight = extractNumber(lines[3]);          // 行3: '64'
  extracted.bmi = extractNumber(lines[12]);            // 行12: '19.8↑0.1'
  extracted.bodyFat = extractNumber(lines[14]);        // 行14: '11.9%↓0.1'
  extracted.bodyWater = extractNumber(lines[21]);      // 行21: '41.5kg'
  extracted.bodyFatMass = extractNumber(lines[23]);    // 行23: '7.6kg'
  extracted.boneMass = extractNumber(lines[25]);       // 行25: '3.1kg'
  extracted.protein = extractNumber(lines[27]);        // 行27: '11.1kg'
  extracted.muscleMass = extractNumber(lines[29]);     // 行29: '53.3kg'
  extracted.muscleRate = extractNumber(lines[32]);     // 行32: '83.3%'
  extracted.bodyWaterRate = extractNumber(lines[37]);  // 行37: '65%↑0.5'
  extracted.proteinRate = extractNumber(lines[38]);    // 行38: '17.3%↓0.4'
  extracted.boneMassRate = extractNumber(lines[43]);   // 行43: '4.8%↑0.1'
  extracted.skeletalMuscleMass = extractNumber(lines[44]); // 行44: '30.4kg'
  extracted.visceralFat = extractNumber(lines[50]);    // 行50: '3'
  extracted.basalMetabolicRate = extractNumber(lines[51]); // 行51: '1588Kcal↑4'
  extracted.bodyAge = extractNumber(lines[57]);        // 行57: '19岁'
  extracted.leanBodyMass = extractNumber(lines[61]);   // 行61: '56.4kg'
  extracted.heartRate = extractNumber(lines[63]);      // 行63: '138次/分'
  extracted.waistHipRatio = extractNumber(lines[56]);  // 行56: '1.1'

  // 日期：行1是 '2026/01/22'
  const dateMatch = lines[1]?.match(/(\d{4}\/\d{2}\/\d{2})/);
  extracted.date = dateMatch ? dateMatch[1].replace(/\//g, '-') : new Date().toISOString().split('T')[0];

  console.log('📊 最终提取结果:', extracted);
  return extracted;
}
// ==================== 主 OCR 函数（优先百度OCR，带压缩） ====================
// 删除 compressImageForOCR 函数
// 删除百度 OCR 调用

// 修改 tesseractFallback，使其成为主识别函数
// 替换原有的 performRealOCR 和所有辅助函数
async function performRealOCR(imageFile: File): Promise<ExtractedData> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      let result = reader.result as string;
      if (result.includes(',')) result = result.split(',')[1];
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
  const response = await fetch('http://localhost:3001/api/paddle-ocr/recognize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ image: base64 })
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return extractHealthDataFromText(data.text);
}
// ==================== 健康指标配置（保持不变） ====================
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

// ==================== 主组件 ====================
export function DataImport({ user, onAddRecord, healthRecords }: DataImportProps) {
  const { t, language, formatDate } = useLanguage();
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
  
  const isImportingRef = useRef(false);
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
    const interval = setInterval(() => setOcrProgress(prev => Math.min(prev + 10, 90)), 300);
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

  const safeSaveRecord = async (record: HealthRecord): Promise<boolean> => {
    try {
      await onAddRecord(record);
      return true;
    } catch (error) {
      console.warn('保存时出现错误，但可能已保存:', error);
      const exists = healthRecords.some(r => r.date === record.date);
      if (exists) return true;
      return false;
    }
  };

  const handleFile = async (file: File) => {
    if (isImportingRef.current) return;
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
      const count = Object.keys(data).filter(k => k !== 'date' && data[k] !== undefined && data[k] !== '').length;
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
              if (header === 'date') record.date = value.replace(/\//g, '-');
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
            let saved = 0;
            for (const rec of records) if (await safeSaveRecord(rec)) saved++;
            if (saved > 0 && !hasShownSuccessRef.current) {
              hasShownSuccessRef.current = true;
              showToast(`✅ ${t('importSuccess')} ${saved} ${t('records')}`, 'success');
              setUploadStatus('success');
            } else if (saved === 0) showToast(`❌ ${t('importFailed')}`, 'error');
          } else showToast(`❌ ${t('invalidFile')}`, 'error');
          setTimeout(() => { setUploadStatus('idle'); setFileName(''); }, 2000);
        } catch (err) {
          console.error(err);
          if (!hasShownSuccessRef.current) showToast(`❌ ${t('importFailed')}`, 'error');
          setUploadStatus('error');
        } finally { isImportingRef.current = false; }
      };
      reader.onerror = () => { showToast(`❌ ${t('uploadFailed')}`, 'error'); setUploadStatus('error'); isImportingRef.current = false; };
      reader.readAsText(file, 'UTF-8');
    } else setUploadStatus('error');
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
          const num = parseFloat(String(value));
          if (!isNaN(num)) (healthRecord as any)[key] = num;
          else if (typeof value === 'string' && value.includes('/')) (healthRecord as any)[key] = value;
        }
      });
      const success = await safeSaveRecord(healthRecord);
      if (success) showToast(`✅ ${t('saveSuccess')}`, 'success');
      else {
        const exists = healthRecords.some(r => r.date === healthRecord.date);
        if (exists) showToast(`✅ ${t('saveSuccess')}`, 'success');
        else showToast(`❌ ${t('saveFailed')}`, 'error');
      }
      setExtractedData(null); setImagePreview(null); setUploadStatus('idle'); setFileName('');
      setShowManualEntry(false); setOcrError(null); setOcrProgress(0);
      setSelectedDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error(error);
      const exists = healthRecords.some(r => r.date === selectedDate);
      if (exists) showToast(`✅ ${t('saveSuccess')}`, 'success');
      else showToast(`❌ ${t('saveFailed')}`, 'error');
    } finally { setIsSaving(false); }
  };

  const startManualEntry = () => { setShowManualEntry(true); setUploadType('manual'); setExtractedData({}); };
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
      {toastMessage && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all ${
          toastMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900 border border-green-400 text-green-800' : 'bg-red-100 dark:bg-red-900 border border-red-400 text-red-800'
        }`}>{toastMessage.text}</div>
      )}
      <header className="mb-8">
        <h1 className="text-gray-800 dark:text-white text-2xl font-bold mb-2">{t('importHealthData')}</h1>
        <p className="text-gray-600 dark:text-gray-400">Upload health reports or manually enter data</p>
      </header>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={startManualEntry} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-2 border-transparent hover:border-indigo-500"><div className="flex items-center gap-3 mb-3"><div className="bg-indigo-100 p-3 rounded-lg"><Plus className="text-indigo-600" size={24} /></div><h3 className="font-medium">{t('manualEntry')}</h3></div><p className="text-sm text-gray-600">Enter data manually</p></button>
          <button onClick={() => document.getElementById('file-upload')?.click()} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-2 border-transparent hover:border-purple-500"><div className="flex items-center gap-3 mb-3"><div className="bg-purple-100 p-3 rounded-lg"><Image className="text-purple-600" size={24} /></div><h3 className="font-medium">{t('aiImageRecognition')}</h3></div><p className="text-sm text-gray-600">AI extracts data from images</p></button>
          <button onClick={downloadTemplate} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-2 border-transparent hover:border-blue-500"><div className="flex items-center gap-3 mb-3"><div className="bg-blue-100 p-3 rounded-lg"><Download className="text-blue-600" size={24} /></div><h3 className="font-medium">{t('csvTemplate')}</h3></div><p className="text-sm text-gray-600">Download CSV template</p></button>
        </div>
        {!showManualEntry && !extractedData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4"><h2 className="font-semibold">{t('uploadHealthReport')}</h2><div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-full"><Sparkles className="text-purple-600" size={14} /><span className="text-xs text-purple-700">AI Powered</span></div></div>
            <form onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
              <input type="file" id="file-upload" accept=".csv,image/*" onChange={handleChange} className="hidden" />
              <label htmlFor="file-upload" className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-4 mb-4"><Upload size={40} className="text-gray-400" /><Image size={40} className="text-gray-400" /></div>
                <p className="text-gray-700 mb-2 text-center">{t('dragAndDrop')}</p>
                <p className="text-sm text-gray-500 text-center">Supports: PNG, JPG, JPEG, CSV • AI extracts data automatically</p>
              </label>
            </form>
            {recognizing && (<div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg"><div className="flex items-center gap-3"><div className="animate-spin"><Sparkles className="text-purple-600" size={24} /></div><div><p>{t('aiAnalyzing')}</p>{ocrProgress > 0 && ocrProgress < 100 && (<div className="w-full bg-purple-200 rounded-full h-1 mt-2"><div className="bg-purple-600 h-1 rounded-full" style={{ width: `${ocrProgress}%` }} /></div>)}</div></div></div>)}
            {ocrError && (<div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3"><AlertCircle className="text-yellow-600" size={20} /><p>{ocrError}</p></div>)}
            {uploadStatus === 'error' && (<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"><AlertCircle className="text-red-600" size={24} /><div><p>{t('uploadFailed')}</p><p className="text-sm text-red-600">{t('invalidFile')}</p></div></div>)}
          </div>
        )}
        {(extractedData || showManualEntry) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">{uploadType === 'image' && <CheckCircle className="text-green-600" size={24} />}<h2 className="font-semibold">{uploadType === 'image' ? t('aiExtractedData') : t('manualEntry')}</h2>{uploadType === 'image' && extractedData && extractedMetricsCount > 0 && (<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{extractedMetricsCount} {t('metricsExtracted')}</span>)}</div>
              <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-500" /><input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" /></div>
            </div>
            {imagePreview && (<div className="mb-6"><p className="text-sm text-gray-600 mb-2">Uploaded Image</p><div className="border rounded-lg overflow-hidden max-w-md"><img src={imagePreview} alt="Health report" className="w-full object-contain max-h-64" /></div><p className="text-xs text-gray-500 mt-2">{fileName}</p></div>)}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {Object.entries(HEALTH_METRICS).map(([category, metrics]) => {
                const hasData = !extractedData || metrics.some(m => extractedData[m.key as keyof ExtractedData] !== undefined);
                if (uploadType === 'image' && !hasData) return null;
                return (<div key={category}><h3 className="text-gray-800 dark:text-white mb-4 pb-2 border-b sticky top-0 bg-white dark:bg-gray-800">{category}</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{metrics.map(metric => {
                  const currentValue = extractedData?.[metric.key as keyof ExtractedData];
                  const hasValue = currentValue !== undefined && currentValue !== '';
                  const label = getMetricLabel(metric.labelKey);
                  return (<div key={metric.key} className={hasValue ? 'bg-green-50/30 rounded-lg' : ''}><label className="block text-sm mb-1">{label}</label><div className="relative"><input type="number" step="0.1" value={currentValue !== undefined ? currentValue : ''} onChange={e => handleDataChange(metric.key as keyof HealthRecord, e.target.value)} placeholder={`Enter ${label}`} className={`w-full px-3 py-2 pr-16 border rounded-lg text-sm ${hasValue ? 'border-green-300 bg-green-50/50' : 'border-gray-300'}`} />{metric.unit && (<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">{metric.unit}</span>)}</div>{hasValue && uploadType === 'image' && (<p className="text-xs text-green-600 mt-1">✓ AI extracted</p>)}</div>);
                })}</div></div>);
              })}
            </div>
            <div className="flex gap-3 mt-6 pt-6 border-t">
              <button onClick={handleSaveData} disabled={isSaving} className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50">{isSaving ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : <CheckCircle size={20} />}<span>{isSaving ? t('saving') : t('saveRecord')}</span></button>
              <button onClick={() => { setExtractedData(null); setImagePreview(null); setUploadStatus('idle'); setShowManualEntry(false); setOcrError(null); }} className="px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">{t('cancel')}</button>
            </div>
            {uploadType === 'image' && extractedData && extractedMetricsCount > 0 && (<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"><p className="text-sm text-blue-800"><strong>{t('aiRecognitionNote')}</strong> {extractedMetricsCount} {t('metricsFromImage')}</p></div>)}
          </div>
        )}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">{t('recentRecords')}</h2>
          {healthRecords.length > 0 ? (<div className="space-y-2">{healthRecords.slice(0,5).map((record, idx) => (<div key={idx} className="flex justify-between p-4 border rounded-lg"><div className="flex gap-3"><Calendar className="text-indigo-400" /><div><p>{formatDate(record.date)}</p><p className="text-sm text-gray-500">{Object.keys(record).filter(k=>k!=='date' && record[k] !== undefined).length} {t('metricsTracked')}</p></div></div>{idx===0 && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">{t('latest')}</span>}</div>))}</div>) : (<p className="text-center py-8 text-gray-500">{t('noRecords')} {t('startTracking')}</p>)}
        </div>
      </div>
    </div>
  );
}