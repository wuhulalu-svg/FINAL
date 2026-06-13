import { useState, useEffect } from 'react';
import { Upload, FileText, LineChart, BarChart3, PieChart, ScatterChart, Trash2, Eye, X, FileJson, FileSpreadsheet, File } from 'lucide-react';
import { User } from '../App';
import * as XLSX from 'xlsx';
import { useLanguage } from '../context/LanguageContext';
import {
    LineChart as ReLineChart,
    Line,
    BarChart as ReBarChart,
    Bar,
    PieChart as RePieChart,
    Pie,
    Cell,
    ScatterChart as ReScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface MedicalReport {
    id: number;
    name: string;
    description: string;
    data: any;
    data_type: string;
    created_at: string;
}

interface MedicalReportsProps {
    user: User | null;
}

const CHART_TYPES = [
    { id: 'line', nameZh: '折线图', nameEn: 'Line Chart', icon: LineChart },
    { id: 'bar', nameZh: '柱状图', nameEn: 'Bar Chart', icon: BarChart3 },
    { id: 'pie', nameZh: '饼图', nameEn: 'Pie Chart', icon: PieChart },
    { id: 'scatter', nameZh: '散点图', nameEn: 'Scatter Chart', icon: ScatterChart }
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function MedicalReports({ user }: MedicalReportsProps) {
    const { language } = useLanguage();
    const [reports, setReports] = useState<MedicalReport[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showChartModal, setShowChartModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
    const [chartType, setChartType] = useState('line');
    const [xAxisField, setXAxisField] = useState('');
    const [yAxisField, setYAxisField] = useState('');
    const [availableFields, setAvailableFields] = useState<string[]>([]);
    const [numericFields, setNumericFields] = useState<string[]>([]);
    const [dateFields, setDateFields] = useState<string[]>([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);
    
    const [uploadForm, setUploadForm] = useState({
        name: '',
        description: '',
        file: null as File | null
    });
    
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const token = localStorage.getItem('token');
    const isZh = language === 'zh';

    const loadReports = async () => {
        try {
            const response = await fetch(`${API_BASE}/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setReports(data);
            }
        } catch (error) {
            console.error('加载报告失败:', error);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    // 将日期从 YYYY-MM-DD 转换为 MM/DD
    const convertDateToMD = (value: any): any => {
        if (!value) return value;
        const str = String(value);
        // 匹配 YYYY-MM-DD 格式
        const match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (match) {
            return `${match[2].padStart(2, '0')}/${match[3].padStart(2, '0')}`;
        }
        // 匹配 YYYY/MM/DD 格式
        const match2 = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
        if (match2) {
            return `${match2[2].padStart(2, '0')}/${match2[3].padStart(2, '0')}`;
        }
        return value;
    };

    // 递归转换数据中的所有日期字段
    const convertDatesInData = (data: any[], dateFieldNames: string[]): any[] => {
        if (!Array.isArray(data)) return data;
        return data.map(row => {
            const newRow = { ...row };
            dateFieldNames.forEach(field => {
                if (newRow[field] !== undefined) {
                    newRow[field] = convertDateToMD(newRow[field]);
                }
            });
            return newRow;
        });
    };

    const parseCSV = (text: string): any[] => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            // 处理 CSV 中的引号
            let values: string[] = [];
            let inQuote = false;
            let currentValue = '';
            
            for (let char of lines[i]) {
                if (char === '"') {
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim());
            
            const row: any = {};
            headers.forEach((header, idx) => {
                let value = values[idx] || '';
                value = value.replace(/^"|"$/g, '');
                
                // 检查是否为 YYYY-MM-DD 日期格式
                if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    // 直接转换为 MM/DD
                    const parts = value.split('-');
                    row[header] = `${parts[1]}/${parts[2]}`;
                } 
                // 检查是否为数字
                else if (/^-?\d+(\.\d+)?$/.test(value)) {
                    const num = parseFloat(value);
                    row[header] = isNaN(num) ? value : num;
                } 
                else {
                    row[header] = value;
                }
            });
            data.push(row);
        }
        return data;
    };

    const parseExcel = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    
                    // 处理 Excel 数据，转换日期格式
                    const processedData = jsonData.map((row: any) => {
                        const newRow: any = {};
                        Object.keys(row).forEach(key => {
                            let value = row[key];
                            
                            // 检查是否是 Excel 日期数字
                            if (typeof value === 'number' && value > 40000 && value < 50000) {
                                const date = new Date((value - 25569) * 86400000);
                                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                const day = date.getDate().toString().padStart(2, '0');
                                newRow[key] = `${month}/${day}`;
                            }
                            // 检查是否是字符串日期格式
                            else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                                const parts = value.split('-');
                                newRow[key] = `${parts[1]}/${parts[2]}`;
                            }
                            else {
                                newRow[key] = value;
                            }
                        });
                        return newRow;
                    });
                    resolve(processedData);
                } catch (err) {
                    reject(new Error('Excel 解析失败'));
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsArrayBuffer(file);
        });
    };

    const parseFile = async (file: File): Promise<any> => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        if (extension === 'json') {
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target?.result as string);
                        resolve(data);
                    } catch (err) {
                        reject(new Error('JSON 解析失败'));
                    }
                };
                reader.onerror = () => reject(new Error('文件读取失败'));
                reader.readAsText(file);
            });
        } 
        else if (extension === 'csv') {
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onload = (e) => {
                    try {
                        const text = e.target?.result as string;
                        const data = parseCSV(text);
                        resolve(data);
                    } catch (err) {
                        reject(new Error('CSV 解析失败'));
                    }
                };
                reader.onerror = () => reject(new Error('文件读取失败'));
                reader.readAsText(file);
            });
        }
        else if (extension === 'xlsx' || extension === 'xls') {
            return await parseExcel(file);
        }
        else {
            throw new Error(isZh ? '不支持的文件格式' : 'Unsupported file format');
        }
    };

    const handleUpload = async () => {
        if (!uploadForm.name || !uploadForm.file) {
            alert(isZh ? '请填写报告名称并选择文件' : 'Please enter report name and select file');
            return;
        }
        
        setUploadLoading(true);
        try {
            const parsedData = await parseFile(uploadForm.file);
            
            const response = await fetch(`${API_BASE}/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: uploadForm.name,
                    description: uploadForm.description,
                    data: parsedData,
                    dataType: uploadForm.file.name.split('.').pop()?.toLowerCase()
                })
            });
            
            if (response.ok) {
                alert(isZh ? '报告上传成功' : 'Report uploaded successfully');
                setShowUploadModal(false);
                setUploadForm({ name: '', description: '', file: null });
                loadReports();
            } else {
                const error = await response.json();
                alert(error.error || (isZh ? '上传失败' : 'Upload failed'));
            }
        } catch (error: any) {
            alert(error.message || (isZh ? '上传失败，请检查文件格式' : 'Upload failed, please check file format'));
        } finally {
            setUploadLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(isZh ? '确定要删除这个报告吗？' : 'Are you sure you want to delete this report?')) return;
        
        try {
            const response = await fetch(`${API_BASE}/reports/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                loadReports();
            }
        } catch (error) {
            console.error('删除失败:', error);
        }
    };

    const showChart = async (report: MedicalReport) => {
        setSelectedReport(report);
        setAvailableFields([]);
        setNumericFields([]);
        setDateFields([]);
        setXAxisField('');
        setYAxisField('');
        
        try {
            const response = await fetch(`${API_BASE}/reports/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ data: report.data })
            });
            
            if (response.ok) {
                const analysis = await response.json();
                setAvailableFields(analysis.fields || []);
                setNumericFields(analysis.numericFields || []);
                setDateFields(analysis.dateFields || []);
                
                if (analysis.dateFields && analysis.dateFields.length > 0) {
                    setXAxisField(analysis.dateFields[0]);
                } else if (analysis.fields && analysis.fields.length > 0) {
                    setXAxisField(analysis.fields[0]);
                }
                if (analysis.numericFields && analysis.numericFields.length > 0) {
                    setYAxisField(analysis.numericFields[0]);
                }
                
                setChartData(report.data);
            }
        } catch (error) {
            console.error('分析失败:', error);
        }
        
        setShowChartModal(true);
    };

    const renderChart = () => {
        if (!selectedReport || !chartData || chartData.length === 0) return null;
        
        const data = Array.isArray(chartData) ? chartData : [chartData];
        
        if (chartType === 'pie') {
            const pieData = data.map((item: any, index: number) => ({
                name: item[xAxisField] || `${isZh ? '项' : 'Item'} ${index + 1}`,
                value: item[yAxisField] || 0
            }));
            
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <RePieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </RePieChart>
                </ResponsiveContainer>
            );
        }
        
        if (chartType === 'scatter') {
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <ReScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey={xAxisField} 
                            name={xAxisField}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis dataKey={yAxisField} name={yAxisField} />
                        <Tooltip 
                            formatter={(value: any) => [value, yAxisField]}
                            labelFormatter={(label: any) => `${isZh ? '日期' : 'Date'}: ${label}`}
                        />
                        <Legend />
                        <Scatter name={selectedReport.name} data={data} fill="#8884d8" />
                    </ReScatterChart>
                </ResponsiveContainer>
            );
        }
        
        // 折线图和柱状图的 X 轴配置
        const xAxisProps = {
            dataKey: xAxisField,
            angle: -45,
            textAnchor: 'end' as const,
            height: 70,
            interval: 0,
            tick: { fontSize: 12 }
        };
        
        return (
            <ResponsiveContainer width="100%" height={450}>
                {chartType === 'line' ? (
                    <ReLineChart data={data} margin={{ bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis {...xAxisProps} />
                        <YAxis />
                        <Tooltip 
                            formatter={(value: any) => [value, yAxisField]}
                            labelFormatter={(label: any) => `${isZh ? '日期' : 'Date'}: ${label}`}
                        />
                        <Legend />
                        <Line type="monotone" dataKey={yAxisField} stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
                    </ReLineChart>
                ) : (
                    <ReBarChart data={data} margin={{ bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis {...xAxisProps} />
                        <YAxis />
                        <Tooltip 
                            formatter={(value: any) => [value, yAxisField]}
                            labelFormatter={(label: any) => `${isZh ? '日期' : 'Date'}: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey={yAxisField} fill="#8884d8" />
                    </ReBarChart>
                )}
            </ResponsiveContainer>
        );
    };

    const getFileIcon = (fileName?: string) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        if (ext === 'json') return <FileJson size={16} />;
        if (ext === 'csv') return <FileSpreadsheet size={16} />;
        return <File size={16} />;
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{isZh ? '医疗数据报告' : 'Medical Data Reports'}</h1>
                    <p className="text-gray-500">{isZh ? '上传 CSV/JSON/Excel 文件，自动识别日期并生成图表' : 'Upload CSV/JSON/Excel files, auto-detect dates and generate charts'}</p>
                </div>
                <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg">
                    <Upload size={20} />
                    {isZh ? '上传文件' : 'Upload File'}
                </button>
            </div>
            
            {reports.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                    <p className="text-gray-500">{isZh ? '暂无报告' : 'No reports'}</p>
                    <p className="text-sm text-gray-400 mt-2">{isZh ? '支持 CSV、JSON、Excel 格式' : 'Supports CSV, JSON, Excel formats'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-white rounded-xl shadow-md p-4">
                            <div className="flex justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        {getFileIcon(report.name)}
                                        <h3 className="font-semibold">{report.name}</h3>
                                    </div>
                                    {report.description && <p className="text-sm text-gray-500">{report.description}</p>}
                                    <p className="text-xs text-gray-400 mt-2">{new Date(report.created_at).toLocaleString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => showChart(report)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title={isZh ? '查看图表' : 'View Chart'}>
                                        <Eye size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(report.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title={isZh ? '删除' : 'Delete'}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-gray-500">
                                {isZh ? '数据项数' : 'Data count'}: {Array.isArray(report.data) ? report.data.length : 1}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* 上传模态框 */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full">
                        <div className="flex justify-between p-4 border-b">
                            <h2 className="text-xl font-semibold">{isZh ? '上传文件' : 'Upload File'}</h2>
                            <button onClick={() => setShowUploadModal(false)}><X size={20} /></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{isZh ? '报告名称' : 'Report Name'} *</label>
                                <input 
                                    type="text" 
                                    placeholder={isZh ? '例如：2024年血压记录' : 'e.g., Blood Pressure Records 2024'}
                                    value={uploadForm.name}
                                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                                    className="w-full p-2 border rounded-lg" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{isZh ? '描述（可选）' : 'Description (Optional)'}</label>
                                <input 
                                    type="text" 
                                    placeholder={isZh ? '简要描述这份数据' : 'Brief description of this data'}
                                    value={uploadForm.description}
                                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                    className="w-full p-2 border rounded-lg" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{isZh ? '数据文件' : 'Data File'} *</label>
                                <div className="flex items-center gap-3">
                                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg border transition-colors">
                                        {isZh ? '选择文件' : 'Choose File'}
                                        <input 
                                            type="file" 
                                            accept=".json,.csv,.xlsx,.xls"
                                            onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                                            className="hidden" 
                                        />
                                    </label>
                                    <span className="text-sm text-gray-500">
                                        {uploadForm.file ? uploadForm.file.name : (isZh ? '未选择任何文件' : 'No file selected')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t">
                            <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 border rounded-lg">{isZh ? '取消' : 'Cancel'}</button>
                            <button onClick={handleUpload} disabled={uploadLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                                {uploadLoading ? (isZh ? '上传中...' : 'Uploading...') : (isZh ? '上传' : 'Upload')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* 图表模态框 */}
            {showChartModal && selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between p-4 border-b">
                            <h2 className="text-xl font-semibold">{selectedReport.name} - {isZh ? '数据可视化' : 'Data Visualization'}</h2>
                            <button onClick={() => setShowChartModal(false)}><X size={20} /></button>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{isZh ? '图表类型' : 'Chart Type'}</label>
                                    <div className="flex gap-2">
                                        {CHART_TYPES.map(type => (
                                            <button 
                                                key={type.id} 
                                                onClick={() => setChartType(type.id)}
                                                className={`p-2 rounded-lg ${chartType === type.id ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                                                title={isZh ? type.nameZh : type.nameEn}
                                            >
                                                <type.icon size={20} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{isZh ? 'X 轴' : 'X Axis'}</label>
                                    {dateFields.length > 0 ? (
                                        <select value={xAxisField} onChange={(e) => setXAxisField(e.target.value)} className="w-full p-2 border rounded-lg">
                                            {dateFields.map(field => <option key={field} value={field}>📅 {field}</option>)}
                                        </select>
                                    ) : (
                                        <select value={xAxisField} onChange={(e) => setXAxisField(e.target.value)} className="w-full p-2 border rounded-lg">
                                            <option value="">{isZh ? '未检测到日期字段' : 'No date field detected'}</option>
                                            {availableFields.map(field => <option key={field} value={field}>{field}</option>)}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{isZh ? 'Y 轴（数值）' : 'Y Axis (Value)'}</label>
                                    <select value={yAxisField} onChange={(e) => setYAxisField(e.target.value)} className="w-full p-2 border rounded-lg">
                                        <option value="">{isZh ? '请选择' : 'Select'}</option>
                                        {numericFields.map(field => <option key={field} value={field}>{field}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            {xAxisField && yAxisField ? renderChart() : (
                                <div className="text-center py-12 text-gray-500">
                                    {isZh ? '请选择 X 轴和 Y 轴字段' : 'Please select X and Y axis'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}